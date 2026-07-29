// ---------------------------------------------------------------------------
// Composer dock — arrangement arithmetic.
//
// Kept as a pure function for the same reason the virtual window is: this is
// where a multi-window dock goes wrong. A window that silently lands off the
// left edge of the screen is an unreachable draft, and that is not a bug that
// reproduces on demand in a browser.
//
// The rules, from SaniMail UX §6 and the approved mockup (frame 03):
//
//   - Windows flow right to left in the order they were opened, so opening a
//     new one never shoves an existing one sideways.
//   - At most `maxOpen` (three) windows are expanded at once. The budget is
//     spent newest-first, so the draft you are typing in keeps its body.
//   - A window that has no horizontal room for its full width renders as a
//     title bar instead. Its own state is untouched — widen the window and it
//     comes back.
//   - One window may be maximised. It leaves the strip entirely and the
//     remaining title bars flow underneath it.
//   - Under the phone breakpoint the most recent window is full screen and
//     everything else is a title bar stacked up from the bottom edge.
// ---------------------------------------------------------------------------

import type { ComposerPlacement, ComposerState, DockGeometry } from './types';

/** The geometry in the approved mockup: 720px window, 340px title bar. */
export const DEFAULT_DOCK_GEOMETRY: DockGeometry = {
  width: 720,
  collapsedWidth: 340,
  edge: 26,
  gap: 22,
  height: 648,
  headerHeight: 44,
  maxOpen: 3,
  phoneBreakpoint: 768,
  maxWidth: 1200,
  topGap: 40,
  collapsedMinStep: 56,
  zIndex: 150,
};

/** The subset of a window the layout actually reads. */
export interface LayoutWindow {
  id: string;
  state: ComposerState;
  /** Recency stamp. Falls back to the window's index when absent. */
  touchedAt?: number;
}

export interface DockViewport {
  width: number;
  height: number;
}

interface Ranked {
  w: LayoutWindow;
  index: number;
  touchedAt: number;
}

/** Newest first. Ties break on open order, so the arithmetic is deterministic. */
function rankByRecency(windows: readonly LayoutWindow[]): Ranked[] {
  return windows
    .map((w, index) => ({ w, index, touchedAt: w.touchedAt ?? index }))
    .sort((a, b) => b.touchedAt - a.touchedAt || b.index - a.index);
}

export function layoutComposers(
  windows: readonly LayoutWindow[],
  viewport: DockViewport,
  geometry: DockGeometry = DEFAULT_DOCK_GEOMETRY,
): ComposerPlacement[] {
  if (windows.length === 0) return [];

  const g = geometry;
  const byRecency = rankByRecency(windows);

  // Oldest at the bottom of the stack, so the window you just touched is the
  // one on top and fully visible when bars overlap.
  const zOf = new Map<string, number>();
  [...byRecency].reverse().forEach((e, i) => zOf.set(e.w.id, g.zIndex + i));
  const zTop = g.zIndex + windows.length;

  const isPhone = viewport.width > 0 && viewport.width < g.phoneBreakpoint;
  if (isPhone) return layoutPhone(windows, byRecency, viewport, g, zOf, zTop);

  // An unmeasured viewport (first paint, SSR-adjacent) must not read as "no
  // room" and collapse every draft, so assume room for exactly one window.
  const vw = viewport.width > 0 ? viewport.width : g.width + g.edge * 2;
  const vh = viewport.height > 0 ? viewport.height : g.height + g.topGap;
  const room = vw - g.edge * 2;

  // At most one maximised window; the most recent one wins and the rest fall
  // back to the strip as normal windows.
  const maximizedId = byRecency.find((e) => e.w.state === 'maximized')?.w.id ?? null;

  // ── Who renders expanded ────────────────────────────────────────────────
  // Budget spent newest-first. A maximised window is out of the strip, so it
  // costs a slot but no horizontal room.
  const expanded = new Set<string>();
  let budget = g.maxOpen;
  let usedWidth = 0;

  for (const e of byRecency) {
    if (budget <= 0) break;
    if (e.w.id === maximizedId) {
      expanded.add(e.w.id);
      budget -= 1;
      continue;
    }
    if (e.w.state === 'collapsed') continue;
    const need = (usedWidth > 0 ? g.gap : 0) + g.width;
    if (usedWidth + need <= room) {
      usedWidth += need;
      expanded.add(e.w.id);
      budget -= 1;
    }
  }

  // ── Horizontal flow, right to left, in open order ───────────────────────
  const strip = windows.filter((w) => w.id !== maximizedId);

  const naturalTotal =
    strip.reduce((sum, w) => sum + (expanded.has(w.id) ? g.width : g.collapsedWidth), 0) +
    Math.max(0, strip.length - 1) * g.gap;

  // Overflow is absorbed by the title bars alone — expanded windows already
  // passed the fit test above. Bars overlap down to `collapsedMinStep`, which
  // keeps a grabbable edge of every draft on screen.
  //
  // Only bars that something else follows can absorb anything: the leftmost
  // window contributes its full width to the strip's extent rather than a
  // step, so shrinking *its* step saves nothing and the strip would still
  // hang off the edge of the screen.
  const compressible = strip.filter(
    (w, i) => !expanded.has(w.id) && i < strip.length - 1,
  ).length;

  let collapsedStep = g.collapsedWidth;
  if (naturalTotal > room && compressible > 0) {
    collapsedStep = Math.max(
      g.collapsedMinStep,
      g.collapsedWidth - (naturalTotal - room) / compressible,
    );
  }

  const normalHeight = Math.min(g.height, Math.max(g.headerHeight, vh - g.topGap));
  const placements = new Map<string, ComposerPlacement>();

  let x = g.edge;
  for (const w of strip) {
    const isExpanded = expanded.has(w.id);
    const width = isExpanded ? g.width : g.collapsedWidth;
    // Last resort when compression cannot buy enough room (an open composer
    // plus one bar needs 1108px and the window is 1024): the bar slides over
    // the composer's left edge rather than off the screen. It is the newer of
    // the two, so it stacks on top and stays clickable. Nothing in the dock is
    // ever unreachable.
    const right = Math.max(g.edge, Math.min(x, vw - g.edge - width));
    placements.set(w.id, {
      id: w.id,
      variant: isExpanded ? 'normal' : 'collapsed',
      forced: !isExpanded && w.state !== 'collapsed',
      width,
      height: isExpanded ? normalHeight : g.headerHeight,
      right: Math.round(right),
      bottom: 0,
      zIndex: zOf.get(w.id) ?? g.zIndex,
    });
    x += (isExpanded ? g.width : collapsedStep) + g.gap;
  }

  if (maximizedId) {
    const width = Math.min(g.maxWidth, room);
    placements.set(maximizedId, {
      id: maximizedId,
      variant: 'maximized',
      forced: false,
      width,
      height: Math.max(g.headerHeight, vh - g.topGap),
      right: Math.round((vw - width) / 2),
      bottom: 0,
      zIndex: zTop,
    });
  }

  // Emitted in open order so the DOM order matches the visual right-to-left
  // strip, which is what a screen reader and sequential Tab both follow.
  return windows.map((w) => placements.get(w.id)!);
}

function layoutPhone(
  windows: readonly LayoutWindow[],
  byRecency: Ranked[],
  viewport: DockViewport,
  g: DockGeometry,
  zOf: Map<string, number>,
  zTop: number,
): ComposerPlacement[] {
  // One composer is full screen — the most recent one that is not collapsed.
  // Everything else is a title bar stacked up from the bottom edge.
  const fullId = byRecency.find((e) => e.w.state !== 'collapsed')?.w.id ?? null;

  let row = 0;
  return windows.map((w) => {
    if (w.id === fullId) {
      return {
        id: w.id,
        variant: 'fullscreen' as const,
        forced: false,
        width: viewport.width,
        height: viewport.height,
        right: 0,
        bottom: 0,
        zIndex: zTop,
      };
    }
    const bottom = row * g.headerHeight;
    row += 1;
    return {
      id: w.id,
      variant: 'collapsed' as const,
      forced: w.state !== 'collapsed',
      width: viewport.width,
      height: g.headerHeight,
      right: 0,
      bottom,
      zIndex: zOf.get(w.id) ?? g.zIndex,
    };
  });
}
