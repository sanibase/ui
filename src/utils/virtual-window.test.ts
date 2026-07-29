import { describe, expect, it } from 'vitest';
import { computeVirtualWindow, rowPitch } from './virtual-window';

/** The message-list geometry from the UX spec: 72px rows, 8px gap. */
const base = { itemHeight: 72, gap: 8, overscan: 6, viewportHeight: 800 };

describe('computeVirtualWindow', () => {
  it('handles an empty list', () => {
    expect(computeVirtualWindow({ ...base, scrollTop: 0, count: 0 })).toEqual({
      startIndex: 0, endIndex: 0, offsetY: 0, totalHeight: 0,
    });
  });

  it('does not leave a trailing gap in the spacer', () => {
    // 3 rows = 3*72 + 2 gaps, not 3*72 + 3 gaps — otherwise the list scrolls
    // a few px past its own end.
    const w = computeVirtualWindow({ ...base, scrollTop: 0, count: 3 });
    expect(w.totalHeight).toBe(3 * 72 + 2 * 8);
  });

  it('renders from the top with overscan clamped at zero', () => {
    const w = computeVirtualWindow({ ...base, scrollTop: 0, count: 40_000 });
    expect(w.startIndex).toBe(0);
    expect(w.offsetY).toBe(0);
  });

  it('keeps a constant window size for a 40 000 row list', () => {
    const w = computeVirtualWindow({ ...base, scrollTop: 500_000, count: 40_000 });
    // ceil(800/80) + 2*6 + 1 = 23 rows, regardless of list length.
    expect(w.endIndex - w.startIndex).toBe(23);
  });

  it('places the rendered block exactly where the rows would have been', () => {
    const pitch = rowPitch(72, 8);
    const w = computeVirtualWindow({ ...base, scrollTop: 100 * pitch, count: 1000 });
    expect(w.startIndex).toBe(100 - 6);
    expect(w.offsetY).toBe((100 - 6) * pitch);
  });

  it('covers a viewport whose top edge sits mid-row', () => {
    const pitch = rowPitch(72, 8);
    // Scrolled half a row down: the window must still reach past the bottom
    // edge, which is what the +1 in the visible count buys.
    const w = computeVirtualWindow({ ...base, scrollTop: 10 * pitch + pitch / 2, count: 1000 });
    const lastRowTop = (w.endIndex - 1) * pitch;
    expect(lastRowTop).toBeGreaterThanOrEqual(10 * pitch + base.viewportHeight);
  });

  it('never runs past the end of the list', () => {
    const pitch = rowPitch(72, 8);
    const w = computeVirtualWindow({ ...base, scrollTop: 995 * pitch, count: 1000 });
    expect(w.endIndex).toBe(1000);
    expect(w.startIndex).toBeLessThan(1000);
  });

  it('survives a viewport that has not been measured yet', () => {
    const w = computeVirtualWindow({ ...base, viewportHeight: 0, scrollTop: 0, count: 1000 });
    expect(w.startIndex).toBe(0);
    expect(w.endIndex).toBeGreaterThan(0);
  });
});
