// ---------------------------------------------------------------------------
// Fixed-height list virtualisation.
//
// Kept as a pure function because the arithmetic is where windowing goes
// wrong — an off-by-one in `endIndex` shows up as a blank strip at the bottom
// of a fast scroll, which is exactly the kind of bug that never reproduces on
// demand in a browser.
//
// Fixed height, deliberately: measured/variable heights need a position cache
// and a resize pass, and every row this serves (message list, contact list) is
// one of two fixed densities.
// ---------------------------------------------------------------------------

export interface VirtualWindowInput {
  /** Current scroll offset of the viewport, px. */
  scrollTop: number;
  /** Visible height of the viewport, px. */
  viewportHeight: number;
  /** Height of one row, px. */
  itemHeight: number;
  /** Vertical gap between rows, px. */
  gap: number;
  /** Total number of items in the list. */
  count: number;
  /** Rows rendered beyond each edge to cover fast scrolling. */
  overscan: number;
}

export interface VirtualWindow {
  /** First rendered index, inclusive. */
  startIndex: number;
  /** Last rendered index, exclusive. */
  endIndex: number;
  /** Translation applied to the rendered block, px. */
  offsetY: number;
  /** Height of the spacer that gives the scrollbar its true length, px. */
  totalHeight: number;
}

/** Distance from one row's top edge to the next. */
export function rowPitch(itemHeight: number, gap: number): number {
  return itemHeight + gap;
}

export function computeVirtualWindow(input: VirtualWindowInput): VirtualWindow {
  const { scrollTop, viewportHeight, itemHeight, gap, count, overscan } = input;
  const pitch = rowPitch(itemHeight, gap);

  // The last row has no trailing gap, so the spacer is one gap short of
  // `count * pitch` — otherwise the list scrolls a few px past its end.
  const totalHeight = count === 0 ? 0 : count * pitch - gap;

  if (count === 0 || pitch <= 0) {
    return { startIndex: 0, endIndex: 0, offsetY: 0, totalHeight };
  }

  const startIndex = Math.min(
    Math.max(0, count - 1),
    Math.max(0, Math.floor(scrollTop / pitch) - overscan),
  );
  // +1 covers a viewport whose top edge sits mid-row.
  const visible = Math.ceil(viewportHeight / pitch) + overscan * 2 + 1;
  const endIndex = Math.min(count, startIndex + visible);

  return { startIndex, endIndex, offsetY: startIndex * pitch, totalHeight };
}
