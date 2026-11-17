/**
 * The geometry behind SdSignaturePad, kept free of the DOM so it can be
 * tested without a canvas: the stroke model, the smoothing, the fit of a
 * drawing into a pad whose size changed, and the trimmed export rectangle.
 *
 * ## Coordinates
 *
 * A drawing lives in one reference frame: the pad's CSS size when its first
 * point was put down. Points are stored in that frame and never rewritten, so
 * a resize (a wider container, a phone turned on its side) only changes the
 * transform the strokes are drawn with, not the strokes. `fitTransform` maps
 * the frame into the current pad: one uniform scale, so a signature never
 * stretches, centred along the axis that has room to spare.
 */

export interface SignaturePoint {
  x: number;
  y: number;
}

/** One pen-down to pen-up, as the points the pointer passed through. */
export type SignatureStroke = SignaturePoint[];

export interface SignatureSize {
  width: number;
  height: number;
}

/** `screen = point * scale + offset`, the same scale on both axes. */
export interface SignatureTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface SignatureRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One drawing instruction, in the order a canvas path takes them. */
export type SignaturePathOp =
  | { op: 'move'; x: number; y: number }
  | { op: 'line'; x: number; y: number }
  | { op: 'quad'; cx: number; cy: number; x: number; y: number }
  | { op: 'dot'; x: number; y: number };

/** Stroke width in reference CSS px: a ballpoint, not a marker. */
export const SIGNATURE_LINE_WIDTH = 2.5;

/** Points closer than this (reference CSS px) to the last one are dropped. */
export const SIGNATURE_MIN_DISTANCE = 1;

/** Empty space kept around the drawn area in an export, in reference CSS px. */
export const SIGNATURE_EXPORT_MARGIN = 8;

export const IDENTITY_TRANSFORM: SignatureTransform = Object.freeze({ scale: 1, offsetX: 0, offsetY: 0 });

/** True when no stroke holds a point. */
export function isSignatureEmpty(strokes: readonly SignatureStroke[]): boolean {
  return strokes.every((s) => s.length === 0);
}

/**
 * Append `p` to `stroke` unless it is within `minDistance` of the last point.
 * Returns whether it was added. The first point of a stroke is always kept.
 */
export function addPoint(stroke: SignatureStroke, p: SignaturePoint, minDistance = SIGNATURE_MIN_DISTANCE): boolean {
  const last = stroke[stroke.length - 1];
  if (last && Math.hypot(p.x - last.x, p.y - last.y) < minDistance) return false;
  stroke.push({ x: p.x, y: p.y });
  return true;
}

/**
 * The path through a stroke's points, smoothed by running a quadratic curve
 * from midpoint to midpoint with each recorded point as the control point.
 * The curve passes through the first and the last point and stays inside the
 * points' convex hull, which `signatureBounds` relies on. A single point is a
 * dot (a full stop, the dot on an i).
 */
export function smoothPath(stroke: readonly SignaturePoint[]): SignaturePathOp[] {
  const n = stroke.length;
  if (n === 0) return [];
  const first = stroke[0]!;
  if (n === 1) return [{ op: 'dot', x: first.x, y: first.y }];
  const ops: SignaturePathOp[] = [{ op: 'move', x: first.x, y: first.y }];
  if (n === 2) {
    const b = stroke[1]!;
    ops.push({ op: 'line', x: b.x, y: b.y });
    return ops;
  }
  for (let i = 1; i < n - 1; i++) {
    const c = stroke[i]!;
    const next = stroke[i + 1]!;
    ops.push({ op: 'quad', cx: c.x, cy: c.y, x: (c.x + next.x) / 2, y: (c.y + next.y) / 2 });
  }
  const last = stroke[n - 1]!;
  ops.push({ op: 'line', x: last.x, y: last.y });
  return ops;
}

/** Apply a transform to every coordinate of a path. */
export function transformPath(ops: readonly SignaturePathOp[], t: SignatureTransform): SignaturePathOp[] {
  const X = (v: number): number => v * t.scale + t.offsetX;
  const Y = (v: number): number => v * t.scale + t.offsetY;
  return ops.map((o) =>
    o.op === 'quad'
      ? { op: 'quad', cx: X(o.cx), cy: Y(o.cy), x: X(o.x), y: Y(o.y) }
      : { op: o.op, x: X(o.x), y: Y(o.y) },
  );
}

/**
 * How a drawing made in `frame` sits in a pad of `size`: the largest uniform
 * scale that keeps the whole frame visible, centred on the spare axis. The
 * same size in, the identity out.
 */
export function fitTransform(frame: SignatureSize, size: SignatureSize): SignatureTransform {
  if (frame.width <= 0 || frame.height <= 0 || size.width <= 0 || size.height <= 0) return { ...IDENTITY_TRANSFORM };
  const scale = Math.min(size.width / frame.width, size.height / frame.height);
  return {
    scale,
    offsetX: (size.width - frame.width * scale) / 2,
    offsetY: (size.height - frame.height * scale) / 2,
  };
}

/** A point on screen, back into the drawing's reference frame. */
export function toFrame(p: SignaturePoint, t: SignatureTransform): SignaturePoint {
  const s = t.scale || 1;
  return { x: (p.x - t.offsetX) / s, y: (p.y - t.offsetY) / s };
}

/**
 * The box the ink covers, in reference px: every point, widened by half the
 * line width so the round caps are inside. Null for an empty drawing.
 */
export function signatureBounds(
  strokes: readonly SignatureStroke[],
  lineWidth = SIGNATURE_LINE_WIDTH,
): SignatureRect | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of strokes) {
    for (const p of s) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  if (minX === Infinity) return null;
  const half = lineWidth / 2;
  return { x: minX - half, y: minY - half, width: maxX - minX + lineWidth, height: maxY - minY + lineWidth };
}

export interface SignatureExportPlan {
  /** Pixel size of the image. */
  width: number;
  height: number;
  /** Draw the reference-frame strokes with this to land them in the image. */
  transform: SignatureTransform;
}

/**
 * The image an export produces: the ink's bounds plus `margin` on every side,
 * at `scale` image pixels per reference px, rounded up to whole pixels. Null
 * when nothing was drawn, so an empty pad never yields a blank file.
 */
export function exportPlan(
  strokes: readonly SignatureStroke[],
  options: { lineWidth?: number; margin?: number; scale?: number } = {},
): SignatureExportPlan | null {
  const { lineWidth = SIGNATURE_LINE_WIDTH, margin = SIGNATURE_EXPORT_MARGIN, scale = 2 } = options;
  const b = signatureBounds(strokes, lineWidth);
  if (!b) return null;
  const x = b.x - margin;
  const y = b.y - margin;
  return {
    width: Math.max(1, Math.ceil((b.width + margin * 2) * scale)),
    height: Math.max(1, Math.ceil((b.height + margin * 2) * scale)),
    transform: { scale, offsetX: -x * scale, offsetY: -y * scale },
  };
}

/** The slice of a 2D context the drawing needs, so a test can record it. */
export type SignatureContext = Pick<
  CanvasRenderingContext2D,
  'beginPath' | 'moveTo' | 'lineTo' | 'quadraticCurveTo' | 'arc' | 'stroke' | 'fill'
> & {
  lineWidth: number;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  strokeStyle: CanvasRenderingContext2D['strokeStyle'];
  fillStyle: CanvasRenderingContext2D['fillStyle'];
};

/**
 * Draw every stroke onto `ctx` through `t`. The line width scales with the
 * transform, so a drawing shown smaller or exported larger keeps its weight
 * relative to the letters.
 */
export function drawSignature(
  ctx: SignatureContext,
  strokes: readonly SignatureStroke[],
  t: SignatureTransform,
  color: string,
  lineWidth = SIGNATURE_LINE_WIDTH,
): void {
  const width = lineWidth * t.scale;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  for (const s of strokes) {
    const ops = transformPath(smoothPath(s), t);
    if (ops.length === 0) continue;
    ctx.beginPath();
    for (const o of ops) {
      if (o.op === 'dot') {
        ctx.arc(o.x, o.y, width / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (o.op === 'move') ctx.moveTo(o.x, o.y);
      else if (o.op === 'line') ctx.lineTo(o.x, o.y);
      else ctx.quadraticCurveTo(o.cx, o.cy, o.x, o.y);
    }
    if (ops[0]!.op !== 'dot') ctx.stroke();
  }
}
