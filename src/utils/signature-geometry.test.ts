import { describe, expect, it } from 'vitest';
import {
  addPoint,
  drawSignature,
  exportPlan,
  fitTransform,
  isSignatureEmpty,
  signatureBounds,
  type SignatureContext,
  type SignatureStroke,
  smoothPath,
  toFrame,
  transformPath,
} from './signature-geometry';

describe('isSignatureEmpty', () => {
  it('is empty with no strokes or only empty strokes', () => {
    expect(isSignatureEmpty([])).toBe(true);
    expect(isSignatureEmpty([[], []])).toBe(true);
    expect(isSignatureEmpty([[], [{ x: 1, y: 1 }]])).toBe(false);
  });
});

describe('addPoint', () => {
  it('always keeps the first point and drops ones closer than the minimum distance', () => {
    const s: SignatureStroke = [];
    expect(addPoint(s, { x: 0, y: 0 })).toBe(true);
    expect(addPoint(s, { x: 0.5, y: 0.5 })).toBe(false);
    expect(addPoint(s, { x: 3, y: 4 })).toBe(true);
    expect(s).toEqual([{ x: 0, y: 0 }, { x: 3, y: 4 }]);
  });

  it('copies the point, so a reused event object cannot move it later', () => {
    const s: SignatureStroke = [];
    const p = { x: 1, y: 2 };
    addPoint(s, p);
    p.x = 99;
    expect(s[0]).toEqual({ x: 1, y: 2 });
  });
});

describe('smoothPath', () => {
  it('draws nothing for an empty stroke and a dot for a single point', () => {
    expect(smoothPath([])).toEqual([]);
    expect(smoothPath([{ x: 5, y: 6 }])).toEqual([{ op: 'dot', x: 5, y: 6 }]);
  });

  it('draws a straight line between two points', () => {
    expect(smoothPath([{ x: 0, y: 0 }, { x: 10, y: 0 }])).toEqual([
      { op: 'move', x: 0, y: 0 },
      { op: 'line', x: 10, y: 0 },
    ]);
  });

  it('runs quadratic curves from midpoint to midpoint, through the first and last point', () => {
    const ops = smoothPath([
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 0 },
      { x: 30, y: 10 },
    ]);
    expect(ops).toEqual([
      { op: 'move', x: 0, y: 0 },
      { op: 'quad', cx: 10, cy: 10, x: 15, y: 5 },
      { op: 'quad', cx: 20, cy: 0, x: 25, y: 5 },
      { op: 'line', x: 30, y: 10 },
    ]);
  });
});

describe('fitTransform and toFrame', () => {
  it('is the identity for the same size', () => {
    expect(fitTransform({ width: 400, height: 180 }, { width: 400, height: 180 })).toEqual({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    });
  });

  it('shrinks uniformly when the pad gets narrower and centres it vertically', () => {
    const t = fitTransform({ width: 400, height: 180 }, { width: 200, height: 180 });
    expect(t.scale).toBe(0.5);
    expect(t.offsetX).toBe(0);
    expect(t.offsetY).toBe(45);
  });

  it('grows only as far as the height allows when the pad gets wider, centred horizontally', () => {
    const t = fitTransform({ width: 400, height: 180 }, { width: 1000, height: 180 });
    expect(t.scale).toBe(1);
    expect(t.offsetX).toBe(300);
    expect(t.offsetY).toBe(0);
  });

  it('falls back to the identity for a zero size (a hidden pad)', () => {
    expect(fitTransform({ width: 0, height: 180 }, { width: 300, height: 180 }).scale).toBe(1);
    expect(fitTransform({ width: 300, height: 180 }, { width: 0, height: 0 }).scale).toBe(1);
  });

  it('maps a screen point back into the frame it was drawn in', () => {
    const t = fitTransform({ width: 400, height: 180 }, { width: 200, height: 180 });
    const p = { x: 50, y: 70 };
    const back = toFrame({ x: p.x * t.scale + t.offsetX, y: p.y * t.scale + t.offsetY }, t);
    expect(back.x).toBeCloseTo(50);
    expect(back.y).toBeCloseTo(70);
  });

  it('transformPath scales and offsets every coordinate, control points too', () => {
    const ops = transformPath(
      [
        { op: 'move', x: 0, y: 0 },
        { op: 'quad', cx: 10, cy: 10, x: 20, y: 0 },
      ],
      { scale: 2, offsetX: 1, offsetY: 3 },
    );
    expect(ops).toEqual([
      { op: 'move', x: 1, y: 3 },
      { op: 'quad', cx: 21, cy: 23, x: 41, y: 3 },
    ]);
  });
});

describe('signatureBounds and exportPlan', () => {
  const strokes: SignatureStroke[] = [
    [
      { x: 50, y: 40 },
      { x: 150, y: 90 },
    ],
    [{ x: 100, y: 120 }],
  ];

  it('covers every point plus half the line width', () => {
    expect(signatureBounds(strokes, 2)).toEqual({ x: 49, y: 39, width: 102, height: 82 });
  });

  it('has no bounds and no image for an empty drawing', () => {
    expect(signatureBounds([])).toBeNull();
    expect(signatureBounds([[]])).toBeNull();
    expect(exportPlan([])).toBeNull();
    expect(exportPlan([[], []])).toBeNull();
  });

  it('trims the image to the ink plus the margin, at the export scale', () => {
    const plan = exportPlan(strokes, { lineWidth: 2, margin: 8, scale: 2 })!;
    expect(plan.width).toBe((102 + 16) * 2);
    expect(plan.height).toBe((82 + 16) * 2);
    // The top-left of the ink lands one margin in from the image's corner.
    expect(49 * plan.transform.scale + plan.transform.offsetX).toBe(16);
    expect(39 * plan.transform.scale + plan.transform.offsetY).toBe(16);
  });

  it('gives a dot an image of its own, not a zero-size one', () => {
    const plan = exportPlan([[{ x: 10, y: 10 }]], { lineWidth: 2, margin: 0, scale: 1 })!;
    expect(plan.width).toBe(2);
    expect(plan.height).toBe(2);
  });
});

describe('drawSignature', () => {
  function recorder() {
    const calls: string[] = [];
    const ctx: SignatureContext = {
      lineWidth: 0,
      lineCap: 'butt',
      lineJoin: 'miter',
      strokeStyle: '',
      fillStyle: '',
      beginPath: () => calls.push('begin'),
      moveTo: (x: number, y: number) => calls.push(`M${x},${y}`),
      lineTo: (x: number, y: number) => calls.push(`L${x},${y}`),
      quadraticCurveTo: (cx: number, cy: number, x: number, y: number) => calls.push(`Q${cx},${cy},${x},${y}`),
      arc: (x: number, y: number, r: number) => calls.push(`A${x},${y},${r}`),
      stroke: () => calls.push('stroke'),
      fill: () => calls.push('fill'),
    };
    return { ctx, calls };
  }

  it('strokes a line with round ends, its width scaled with the transform', () => {
    const { ctx, calls } = recorder();
    drawSignature(
      ctx,
      [
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
        ],
      ],
      { scale: 2, offsetX: 0, offsetY: 0 },
      '#123456',
      2.5,
    );
    expect(ctx.lineWidth).toBe(5);
    expect(ctx.lineCap).toBe('round');
    expect(ctx.lineJoin).toBe('round');
    expect(ctx.strokeStyle).toBe('#123456');
    expect(calls).toEqual(['begin', 'M0,0', 'L20,0', 'stroke']);
  });

  it('fills a dot instead of stroking it, and skips empty strokes', () => {
    const { ctx, calls } = recorder();
    drawSignature(ctx, [[], [{ x: 4, y: 4 }]], { scale: 1, offsetX: 0, offsetY: 0 }, '#000', 2);
    expect(calls).toEqual(['begin', 'A4,4,1', 'fill']);
  });
});
