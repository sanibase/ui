/**
 * Widths for a skeleton row's text bars.
 *
 * A skeleton exists to hold the shape the data will take. If the skeleton is
 * two lines and the row is three, the list visibly jolts the moment data lands
 * — every row below the first shifts by a line height. SaniMail's message list
 * is a three-line rhythm (sender, subject, snippet) at 72px, so a two-bar
 * skeleton is the wrong shape for it. UX §12: "Skeleton rows matching the real
 * rhythm".
 *
 * The first bar is the title bar, sized by the row's density; the rest are
 * secondary bars. Two lines must reproduce the historical `w-2/5` + `w-1/3`
 * pair exactly, because every list shipped before this prop existed will keep
 * calling it with the default.
 */

/** Title bar. Always present, always the widest of the short bars. */
export const SKELETON_TITLE_WIDTH = 'w-2/5';

/**
 * Secondary bars, in order, cycled if a caller asks for more lines than there
 * are entries. `w-1/3` is first and is not negotiable: it is what a two-line
 * skeleton has always rendered.
 */
const SECONDARY_WIDTHS = ['w-1/3', 'w-4/5', 'w-1/2', 'w-2/3'] as const;

/**
 * Tailwind width classes for `lines` bars, title bar included.
 *
 * @param lines Number of text bars. Values below 1 are clamped to 1 — a row
 *              with no text bar is an avatar and a meta chip, which is a
 *              different component, not a zero-line skeleton.
 */
export function skeletonLineWidths(lines: number): string[] {
  const count = Math.max(1, Math.floor(lines));
  const widths = [SKELETON_TITLE_WIDTH];
  for (let i = 0; i < count - 1; i++) {
    widths.push(SECONDARY_WIDTHS[i % SECONDARY_WIDTHS.length]!);
  }
  return widths;
}
