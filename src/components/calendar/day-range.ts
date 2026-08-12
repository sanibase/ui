// ---------------------------------------------------------------------------
// The visible day window of the week grid.
//
// The week grid used to be exactly seven columns. A phone cannot show seven:
// at 390px they land near 43px each and every event renders as a sliver. The
// window is therefore configurable, and every part of the grid that used to
// assume "7" now asks these functions instead — the three grid templates, the
// day headers, the all-day band columns, the drop targets and the keyboard
// roving tabindex.
//
// Kept as pure functions for the same reason `agenda.ts` is: the failure mode
// of a range is silent and geometric (a header that names a week while three
// columns are drawn, a drop that lands a day off), and none of that is
// testable inside a template.
//
// Anchoring
// ---------
// A full week is a *week*: it snaps to `weekStartsOn` and is named by its
// calendar week, which is what every existing caller already gets. A narrower
// window is a *rolling window*: it starts at the selected day and steps by its
// own width, which is what Google Calendar's phone "3 days" view does. Snapping
// a 3-day window to the week start cannot work anyway — 3 does not divide 7, so
// the third window of a week would either overlap the next one or skip a day.
//
// Stepping follows the anchor in both cases: prev/next moves by the window
// width, so seven-day callers keep their exact +/-7 behaviour.
// ---------------------------------------------------------------------------

/** Columns in a full week. Also the maximum this grid will draw. */
export const FULL_WEEK_DAYS = 7;

/** First day of the week: 1 = Monday, 0 = Sunday. */
export type WeekStart = 0 | 1;

function midnight(d: Date): Date {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  return m;
}

/**
 * Clamp a caller's `visibleDays` into 1..7.
 *
 * Silently clamping rather than throwing: this is a presentational prop, and a
 * design system that blows up a page over a layout number is worse than one
 * that draws the nearest sane thing. Anything longer than a week is an agenda,
 * not a week grid, and `SdCalendarAgenda` already covers that.
 */
export function normaliseVisibleDays(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return FULL_WEEK_DAYS;
  return Math.min(FULL_WEEK_DAYS, Math.max(1, Math.round(value)));
}

/** True when the window is a whole week and therefore week-aligned. */
export function isFullWeek(visibleDays: number | undefined): boolean {
  return normaliseVisibleDays(visibleDays) === FULL_WEEK_DAYS;
}

/**
 * Local midnight of the window's first column.
 *
 * Seven days snap back to `weekStartsOn`; anything narrower starts on the
 * selected day itself.
 */
export function rangeStart(
  date: Date,
  visibleDays: number | undefined,
  weekStartsOn: WeekStart = 1,
): Date {
  if (!isFullWeek(visibleDays)) return midnight(date);

  const day = date.getDay();
  const diff = weekStartsOn === 1 ? (day === 0 ? -6 : 1 - day) : -day;
  const first = new Date(date);
  first.setDate(date.getDate() + diff);
  first.setHours(0, 0, 0, 0);
  return first;
}

/** Local midnight of the window's last column. */
export function rangeEnd(
  date: Date,
  visibleDays: number | undefined,
  weekStartsOn: WeekStart = 1,
): Date {
  const last = rangeStart(date, visibleDays, weekStartsOn);
  last.setDate(last.getDate() + normaliseVisibleDays(visibleDays) - 1);
  return last;
}

/** Every day the window covers, as local midnights, in column order. */
export function rangeDates(
  date: Date,
  visibleDays: number | undefined,
  weekStartsOn: WeekStart = 1,
): Date[] {
  const first = rangeStart(date, visibleDays, weekStartsOn);
  const count = normaliseVisibleDays(visibleDays);
  const out: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(first);
    d.setDate(first.getDate() + i);
    out.push(d);
  }
  return out;
}

/**
 * The date the prev/next buttons move to: one window width, in the direction
 * pressed. At the default seven this is the +/-7 days the nav always did.
 */
export function stepRange(
  date: Date,
  direction: -1 | 1,
  visibleDays: number | undefined,
): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + direction * normaliseVisibleDays(visibleDays));
  return next;
}

/**
 * The date-nav label for a window: `10. Aug. - 16. Aug. 2026`, or a single
 * date when the window is one column wide.
 *
 * It lives next to `rangeStart`/`rangeEnd` rather than inside `SdDateNav`
 * because the label and the columns have to be derived from one rule. A
 * header naming a whole week above three drawn columns is the specific lie
 * that made a page-local 3-day hack unacceptable.
 */
export function formatRangeLabel(
  date: Date,
  visibleDays: number | undefined,
  weekStartsOn: WeekStart,
  locale: string,
): string {
  const start = rangeStart(date, visibleDays, weekStartsOn);
  const end = rangeEnd(date, visibleDays, weekStartsOn);
  const fmt = (dt: Date) => dt.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  // A one-column window is a single day; naming it twice reads as a bug.
  if (start.getTime() === end.getTime()) return `${fmt(end)} ${end.getFullYear()}`;
  return `${fmt(start)} - ${fmt(end)} ${end.getFullYear()}`;
}

/**
 * `grid-template-columns` for the rows that carry the time gutter: the day
 * headers, the all-day band and the time body. All three read this one
 * function, because a band that disagrees with the body by one column is the
 * exact way this breaks.
 */
export function gutterColumnTemplate(
  gutterWidth: string,
  visibleDays: number | undefined,
): string {
  return `${gutterWidth} repeat(${normaliseVisibleDays(visibleDays)}, 1fr)`;
}

/**
 * `grid-template-columns` for the gutterless rows of the compact (sm) layout.
 * `minmax(0, 1fr)` rather than `1fr` so a long event title cannot blow the
 * column out — the same thing Tailwind's `grid-cols-*` emits.
 */
export function dayColumnTemplate(visibleDays: number | undefined): string {
  return `repeat(${normaliseVisibleDays(visibleDays)}, minmax(0, 1fr))`;
}

/**
 * Keep a day-column index inside the window. The keyboard grid's roving
 * tabindex is stored as a column index, so it has to be re-clamped whenever
 * the window narrows, or the stored index points at a column that is no longer
 * drawn and the grid loses its only tab stop.
 */
export function clampDayIndex(index: number, visibleDays: number | undefined): number {
  return Math.min(normaliseVisibleDays(visibleDays) - 1, Math.max(0, index));
}

/**
 * Where an event lands when it is dropped on `day` at `slot`.
 *
 * The day comes from the cell the pointer is over, never from an index into a
 * seven-day assumption, which is what makes a drop correct at any window
 * width. Duration is preserved. `slot.hour` may exceed 23 for overnight
 * venues (endHour 26 = close at 02:00); `setHours` rolls those into the next
 * day, which is the intent.
 */
export function dropOnSlot(
  event: { start: Date; end: Date },
  day: Date,
  slot: { hour: number; minute: number },
): { start: Date; end: Date } {
  const start = new Date(day);
  start.setHours(slot.hour, slot.minute, 0, 0);
  const durationMs = event.end.getTime() - event.start.getTime();
  return { start, end: new Date(start.getTime() + durationMs) };
}
