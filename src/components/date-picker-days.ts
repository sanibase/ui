// ---------------------------------------------------------------------------
// The day styling of SdDatePicker (SaniDesk SD-596, "one calendar"), as plain
// functions so they can be tested without mounting PrimeVue.
//
// A day is named by a `Date` (its local calendar day counts, the time does not)
// or by an ISO day string `YYYY-MM-DD`, which is how most callers hold a
// business day. PrimeVue names a day by `{ year, month (0-based), day }`; both
// meet in `dayKey`, the `YYYY-MM-DD` of the local calendar day.
// ---------------------------------------------------------------------------

/** A calendar day: a `Date` (its local day; the time is ignored) or `YYYY-MM-DD`. */
export type SdCalendarDay = Date | string;

/**
 * A run of days drawn as a light purple band.
 *
 * - A week (`fillEnds` off, the default): the band alone. A chosen day inside
 *   it is drawn as part of the band, not filled, and a muted day inside it
 *   stays light, so "no session on the 17th" is still readable.
 * - "Von bis" (`fillEnds` on): the first and the last day are filled purple,
 *   as a chosen day is.
 */
export interface SdDateRange {
  start: SdCalendarDay;
  end: SdCalendarDay;
  fillEnds?: boolean;
}

/** PrimeVue's name for a day in the grid. */
export interface PickerDayMeta {
  year: number;
  /** 0-based, as `Date#getMonth`. */
  month: number;
  day: number;
  otherMonth?: boolean;
}

/** Where a visible day sits in the band, if it is in one. */
export interface BandPart {
  /** `range` when the ends are filled ("von bis"), `week` when they are not. */
  kind: 'range' | 'week';
  /** The band starts here: the range's first day or the month's first day. */
  start: boolean;
  /** The band ends here: the range's last day or the month's last day. */
  end: boolean;
}

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const pad = (n: number): string => String(n).padStart(2, '0');

/** The `YYYY-MM-DD` of a year, a 0-based month and a day. */
export function keyOf(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

/** The `YYYY-MM-DD` of a calendar day, or null when it is not one. */
export function dayKey(d: SdCalendarDay | null | undefined): string | null {
  if (d == null) return null;
  if (typeof d === 'string') {
    const m = ISO_DAY.exec(d.slice(0, 10));
    return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
  }
  if (Number.isNaN(d.getTime())) return null;
  return keyOf(d.getFullYear(), d.getMonth(), d.getDate());
}

/** The local midnight of a calendar day, or null when it is not one. */
export function toLocalDate(d: SdCalendarDay): Date | null {
  const key = dayKey(d);
  if (!key) return null;
  const [y, m, day] = key.split('-').map(Number);
  return new Date(y, m - 1, day);
}

/** A set of `YYYY-MM-DD` keys; days that are not days are dropped. */
export function keySet(days: readonly SdCalendarDay[] | null | undefined): Set<string> {
  const out = new Set<string>();
  for (const d of days ?? []) {
    const k = dayKey(d);
    if (k) out.add(k);
  }
  return out;
}

/** The key of one of PrimeVue's grid days. */
export function metaKey(meta: PickerDayMeta): string {
  return keyOf(meta.year, meta.month, meta.day);
}

/** The band as two ordered keys, or null when it is not drawable. */
export function bandKeys(range: SdDateRange | null | undefined): { start: string; end: string; kind: BandPart['kind'] } | null {
  if (!range) return null;
  const a = dayKey(range.start);
  const b = dayKey(range.end);
  if (!a || !b) return null;
  const [start, end] = a <= b ? [a, b] : [b, a];
  return { start, end, kind: range.fillEnds ? 'range' : 'week' };
}

/**
 * Where a grid day sits in the band. Days of the neighbouring months are not
 * drawn, so they are never in it; the band is cut (and rounded) at the month's
 * edge instead.
 */
export function bandPart(meta: PickerDayMeta, band: ReturnType<typeof bandKeys>): BandPart | null {
  if (!band || meta.otherMonth) return null;
  const key = metaKey(meta);
  if (key < band.start || key > band.end) return null;
  const lastOfMonth = new Date(meta.year, meta.month + 1, 0).getDate();
  return {
    kind: band.kind,
    start: key === band.start || meta.day === 1,
    end: key === band.end || meta.day === lastOfMonth,
  };
}

/** The `YYYY-MM-DD` of today: the given day (a venue's business day), else the browser's. */
export function todayKey(today?: SdCalendarDay | null): string {
  return dayKey(today) ?? (dayKey(new Date()) as string);
}
