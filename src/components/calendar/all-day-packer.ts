// ---------------------------------------------------------------------------
// Row-packing for the pinned all-day band.
//
// The band is a small grid: one column per day (week view) or per resource
// (day view with resources), and as many rows as it takes for no two events
// to overlap in a row. A multi-day event occupies a contiguous run of columns
// and is drawn once, spanning them — which is why this cannot reuse the
// time-grid lane packer, whose unit is a vertical lane inside one column.
// ---------------------------------------------------------------------------

import type { CalendarEvent } from './types';

/** One column of the band. */
export interface AllDayColumn {
  /** Stable key (a day timestamp, or a resource id). */
  key: string;
  /** Column time window, half-open: `[start, end)`. */
  start: Date;
  end: Date;
  /**
   * When set, only events carrying this `resourceId` may land in the column,
   * and spanning across columns is disabled — adjacent columns are different
   * resources, not adjacent days, so a span would be meaningless.
   */
  resourceId?: string;
}

export interface PackedAllDayEvent {
  event: CalendarEvent;
  /** 0-based inclusive column index. */
  colStart: number;
  /** 0-based inclusive column index. `colEnd >= colStart`. */
  colEnd: number;
  /** 0-based row within the band. */
  row: number;
  /** True when the event actually starts before the first visible column. */
  clippedStart: boolean;
  /** True when the event actually ends after the last visible column. */
  clippedEnd: boolean;
}

export interface PackedAllDayBand {
  items: PackedAllDayEvent[];
  /** Number of rows used. 0 when there is nothing to show. */
  rowCount: number;
}

/** Half-open intersection test: does `[aS, aE)` share any moment with `[bS, bE)`? */
function intersects(aS: number, aE: number, bS: number, bE: number): boolean {
  return aS < bE && bS < aE;
}

/**
 * Effective end of an event for band purposes. An all-day event whose end is
 * at or before its start (a common encoding for "one whole day") is treated
 * as covering the start instant only, so it lands in exactly one column.
 */
function effectiveEnd(ev: CalendarEvent): number {
  const s = ev.start.getTime();
  const e = ev.end.getTime();
  return e > s ? e : s + 1;
}

/**
 * Lay all-day events out into band rows.
 *
 * Events are sorted by start, then by descending duration, so the longest bar
 * in a cluster takes the top row — which reads better than the arrival order.
 * Packing is first-fit: an event takes the first row where its column run is
 * still free.
 */
export function packAllDayEvents(
  events: CalendarEvent[],
  columns: AllDayColumn[],
): PackedAllDayBand {
  if (columns.length === 0 || events.length === 0) return { items: [], rowCount: 0 };

  const windowStart = columns[0]!.start.getTime();
  const windowEnd = columns[columns.length - 1]!.end.getTime();

  const sorted = [...events].sort((a, b) => {
    const d = a.start.getTime() - b.start.getTime();
    if (d !== 0) return d;
    return effectiveEnd(b) - effectiveEnd(a);
  });

  const items: PackedAllDayEvent[] = [];
  // rows[r] = the column indices already taken in row r.
  const rows: boolean[][] = [];

  for (const ev of sorted) {
    const s = ev.start.getTime();
    const e = effectiveEnd(ev);

    // Which columns does it touch?
    let colStart = -1;
    let colEnd = -1;
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i]!;
      if (col.resourceId !== undefined && ev.resourceId !== col.resourceId) continue;
      if (!intersects(s, e, col.start.getTime(), col.end.getTime())) continue;
      if (colStart < 0) colStart = i;
      colEnd = i;
      // Resource columns never span — one event, one column.
      if (col.resourceId !== undefined) break;
    }
    if (colStart < 0) continue;

    let row = 0;
    for (;; row++) {
      if (!rows[row]) rows[row] = [];
      const taken = rows[row]!;
      let free = true;
      for (let c = colStart; c <= colEnd; c++) {
        if (taken[c]) { free = false; break; }
      }
      if (free) {
        for (let c = colStart; c <= colEnd; c++) taken[c] = true;
        break;
      }
    }

    items.push({
      event: ev,
      colStart,
      colEnd,
      row,
      clippedStart: s < windowStart,
      clippedEnd: e > windowEnd,
    });
  }

  return { items, rowCount: rows.length };
}

/** Split a list into its all-day and timed halves in one pass. */
export function splitAllDay(events: CalendarEvent[]): {
  allDay: CalendarEvent[];
  timed: CalendarEvent[];
} {
  const allDay: CalendarEvent[] = [];
  const timed: CalendarEvent[] = [];
  for (const ev of events) (ev.allDay ? allDay : timed).push(ev);
  return { allDay, timed };
}
