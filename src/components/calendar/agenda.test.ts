import { describe, expect, it } from 'vitest';
import { groupAgendaDays } from './agenda';
import type { CalendarEvent } from './types';

const NOW = new Date(2026, 6, 29, 14, 32);

function timed(id: string, day: number, h: number, endH = h + 1): CalendarEvent {
  return {
    id,
    title: id,
    start: new Date(2026, 6, day, h),
    end: new Date(2026, 6, day, endH),
  };
}

function allDay(id: string, fromDay: number, toDay: number): CalendarEvent {
  return {
    id,
    title: id,
    allDay: true,
    start: new Date(2026, 6, fromDay),
    end: new Date(2026, 6, toDay),
  };
}

describe('groupAgendaDays', () => {
  it('drops empty days by default and keeps them on request', () => {
    const events = [timed('a', 29, 11)];
    expect(groupAgendaDays(events, { from: new Date(2026, 6, 29), days: 3, now: NOW })).toHaveLength(1);
    expect(
      groupAgendaDays(events, { from: new Date(2026, 6, 29), days: 3, includeEmptyDays: true, now: NOW }),
    ).toHaveLength(3);
  });

  it('flags today', () => {
    const days = groupAgendaDays([timed('a', 29, 11), timed('b', 30, 8)], {
      from: new Date(2026, 6, 29), days: 3, now: NOW,
    });
    expect(days.map((d) => d.isToday)).toEqual([true, false]);
  });

  it('ignores the time component of `from`', () => {
    const days = groupAgendaDays([timed('a', 29, 8)], {
      from: new Date(2026, 6, 29, 23, 59), days: 1, now: NOW,
    });
    // 08:00 is before the `from` timestamp but on the same day, so it counts.
    expect(days).toHaveLength(1);
    expect(days[0]!.events.map((e) => e.id)).toEqual(['a']);
  });

  it('repeats a multi-day event under every day it covers', () => {
    const days = groupAgendaDays([allDay('ferien', 11, 15)], {
      from: new Date(2026, 6, 10), days: 8, now: NOW,
    });
    expect(days.map((d) => d.date.getDate())).toEqual([11, 12, 13, 14]);
  });

  it('sorts all-day first, then by start, then by title', () => {
    const days = groupAgendaDays(
      [timed('spaet', 29, 19), allDay('feiertag', 29, 30), timed('frueh', 29, 8)],
      { from: new Date(2026, 6, 29), days: 1, now: NOW },
    );
    expect(days[0]!.events.map((e) => e.id)).toEqual(['feiertag', 'frueh', 'spaet']);
  });

  it('treats an all-day event with end == start as one day', () => {
    const days = groupAgendaDays([allDay('einer', 29, 29)], {
      from: new Date(2026, 6, 28), days: 4, now: NOW,
    });
    expect(days).toHaveLength(1);
    expect(days[0]!.date.getDate()).toBe(29);
  });

  it('does not leak an event into the following day when it ends at midnight', () => {
    const closing: CalendarEvent = {
      id: 'close', title: 'close',
      start: new Date(2026, 6, 29, 22), end: new Date(2026, 6, 30, 0, 0),
    };
    const days = groupAgendaDays([closing], { from: new Date(2026, 6, 29), days: 2, now: NOW });
    expect(days).toHaveLength(1);
    expect(days[0]!.date.getDate()).toBe(29);
  });
});
