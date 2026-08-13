import type { CSSProperties } from 'vue';
import type { CalendarPaging } from './types';

/**
 * The one place that turns "one period" into a distance.
 *
 * The day headers, the all-day band, the time body and the events overlay each
 * draw the same strip of day columns, and each of them has to draw it at the
 * same width and slide it to the same place -- a band that disagreed with the
 * body by a column is exactly how a paged calendar goes wrong, and here it
 * would disagree DURING an animation, where nobody is looking at a static
 * screenshot. So all four ask this, and none of them does the arithmetic.
 */
export interface StripGeometry {
  /** Extra columns before the visible window. */
  lead: number;
  /** Extra columns after it. */
  trail: number;
  /** Columns in the whole strip: `lead + visible + trail`. */
  total: number;
  /** `grid-template-columns` for the strip. */
  template: string;
  /**
   * Inline style for the strip element: its width and where it is slid to.
   *
   * Undefined when there is no paging, and that is deliberate rather than a
   * zero transform: an element with any transform at all, even an identity one,
   * becomes the containing block for every `position: fixed` descendant, and a
   * grid that has never been paged should be exactly the grid it always was.
   */
  style: CSSProperties | undefined;
}

/** Two decimals is a hundredth of a pixel at 1000px. Beyond that is noise. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Lay out a strip for a window `visible` columns wide.
 *
 * THE STEP IS IN COLUMNS, NOT DAYS, and that is not pedantry. In the week grid
 * a column is a day and the two are the same number; in the day grid a column
 * is a RESOURCE, so one day of travel is a whole rank of them. Taking the step
 * already converted is what lets both grids share this, and what stops a
 * twenty-table day view from sliding one twentieth of a day.
 *
 * @param visible How many columns are on screen at rest.
 * @param stepColumns How many columns one page turn moves. 0 means no strip.
 * @param paging Where the host has slid it to, or undefined for no strip.
 */
export function stripGeometry(
  visible: number,
  stepColumns: number,
  paging?: CalendarPaging,
): StripGeometry {
  const columns = Math.max(1, Math.round(visible));
  const step = paging ? Math.max(0, Math.round(stepColumns)) : 0;

  if (!paging || step === 0) {
    return {
      lead: 0,
      trail: 0,
      total: columns,
      template: `repeat(${columns}, minmax(0, 1fr))`,
      style: undefined,
    };
  }

  const total = step + columns + step;
  // Percentages of the STRIP's own width, which is what a percentage transform
  // resolves against. One column is `100 / total`% of it, so `lead` columns --
  // the distance the strip sits left of its container at rest -- is this.
  const restPct = -(100 * step) / total;
  const stepPct = (100 * step) / total;
  const shift = restPct + paging.travel * stepPct;

  const style: CSSProperties = {
    width: `${round((total / columns) * 100)}%`,
    height: '100%',
    transform: `translateX(calc(${round(shift)}% + ${round(paging.travelPx)}px))`,
  };
  // An empty transition is left off entirely rather than written as `none`, so
  // that removing it and changing the transform in one patch is one style
  // recalculation with no transition armed -- which is how the strip returns to
  // rest at the end of a page turn without animating back.
  if (paging.transition) style.transition = paging.transition;

  return { lead: step, trail: step, total, template: `repeat(${total}, minmax(0, 1fr))`, style };
}
