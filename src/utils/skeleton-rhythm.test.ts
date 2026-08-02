import { describe, expect, it } from 'vitest';
import { skeletonLineWidths } from './skeleton-rhythm';

describe('skeletonLineWidths', () => {
  it('reproduces the historical two-bar skeleton exactly', () => {
    // Every SdRowList shipped before `skeletonLines` existed renders with the
    // default of 2. If this assertion ever changes, those lists changed too.
    expect(skeletonLineWidths(2)).toEqual(['w-2/5', 'w-1/3']);
  });

  it('gives a three-line rhythm three bars', () => {
    expect(skeletonLineWidths(3)).toEqual(['w-2/5', 'w-1/3', 'w-4/5']);
  });

  it('returns one bar per line', () => {
    for (const n of [1, 2, 3, 4, 5, 8]) {
      expect(skeletonLineWidths(n)).toHaveLength(n);
    }
  });

  it('cycles the secondary widths rather than running out', () => {
    expect(skeletonLineWidths(7)).toEqual([
      'w-2/5',
      'w-1/3', 'w-4/5', 'w-1/2', 'w-2/3',
      'w-1/3', 'w-4/5',
    ]);
  });

  it('clamps nonsense to a single bar', () => {
    expect(skeletonLineWidths(0)).toEqual(['w-2/5']);
    expect(skeletonLineWidths(-3)).toEqual(['w-2/5']);
    expect(skeletonLineWidths(1.9)).toEqual(['w-2/5']);
  });
});
