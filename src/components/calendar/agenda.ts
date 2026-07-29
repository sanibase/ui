// ---------------------------------------------------------------------------
// Day grouping for the agenda view.
//
// Agenda is a flat, scrollable list of days, each day a heading followed by
// its events in chronological order with all-day events first. Kept as a pure
// function so the grouping is testable without mounting a component — the
// boundary cases (multi-day events appearing on every day they cover, empty
// days) are exactly the ones that silently regress in a template.
// ---------------------------------------------------------------------------

import type { CalendarEvent } from './types';

export interface AgendaDay {
  /** Local midnight of the day. */
  date: Date;
  isToday: boolean;
  events: CalendarEvent[];
}

export interface AgendaOptions {
  /** First day shown (time component ignored). */
  from: Date;
  /** How many consecutive days to cover. */
  days: number;
  /** Keep days with no events. Default false — agenda is a list, not a grid. */
  includeEmptyDays?: boolean;
  /** Injectable "now" so the isToday flag is testable. */
  now?: Date;
}

function midnight(d: Date): Date {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  return m;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Group events into consecutive days.
 *
 * A multi-day event (typically all-day) is repeated on every day it covers,
 * which is what a reader expects from an agenda: "Ferien Naty" should appear
 * under each day of the holiday, not only under its first.
 */
export function groupAgendaDays(
  events: CalendarEvent[],
  opts: AgendaOptions,
): AgendaDay[] {
  const now = opts.now ?? new Date();
  const first = midnight(opts.from);
  const out: AgendaDay[] = [];

  for (let i = 0; i < opts.days; i++) {
    const dayStart = new Date(first);
    dayStart.setDate(first.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const dayStartMs = dayStart.getTime();
    const dayEndMs = dayEnd.getTime();

    const inDay = events.filter((ev) => {
      const s = ev.start.getTime();
      // An all-day event encoded with end <= start covers its start day only.
      const e = ev.end.getTime() > s ? ev.end.getTime() : s + 1;
      return s < dayEndMs && e > dayStartMs;
    });

    inDay.sort((a, b) => {
      // All-day first, then by start, then by title for a stable order.
      const ad = (a.allDay ? 0 : 1) - (b.allDay ? 0 : 1);
      if (ad !== 0) return ad;
      const d = a.start.getTime() - b.start.getTime();
      if (d !== 0) return d;
      return a.title.localeCompare(b.title);
    });

    if (inDay.length === 0 && !opts.includeEmptyDays) continue;

    out.push({ date: dayStart, isToday: sameDay(dayStart, now), events: inDay });
  }

  return out;
}
