import { describe, expect, it } from 'vitest';
import { type AllDayColumn, packAllDayEvents, splitAllDay } from './all-day-packer';
import type { CalendarEvent } from './types';

/** Monday 2026-07-27 through Sunday 2026-08-02, the week the mockup shows. */
function weekColumns(): AllDayColumn[] {
  const cols: AllDayColumn[] = [];
  for (let i = 0; i < 7; i++) {
    const start = new Date(2026, 6, 27 + i, 0, 0, 0, 0);
    const end = new Date(2026, 6, 28 + i, 0, 0, 0, 0);
    cols.push({ key: String(start.getTime()), start, end });
  }
  return cols;
}

function ev(partial: Partial<CalendarEvent> & { id: string; start: Date; end: Date }): CalendarEvent {
  return { title: partial.id, allDay: true, ...partial };
}

describe('packAllDayEvents', () => {
  it('returns nothing for an empty input', () => {
    expect(packAllDayEvents([], weekColumns())).toEqual({ items: [], rowCount: 0 });
    expect(packAllDayEvents([ev({ id: 'a', start: new Date(2026, 6, 27), end: new Date(2026, 6, 28) })], []))
      .toEqual({ items: [], rowCount: 0 });
  });

  it('places a single-day event in exactly one column', () => {
    const e = ev({ id: 'a', start: new Date(2026, 6, 29), end: new Date(2026, 6, 30) });
    const { items, rowCount } = packAllDayEvents([e], weekColumns());
    expect(rowCount).toBe(1);
    expect(items[0]).toMatchObject({ colStart: 2, colEnd: 2, row: 0, clippedStart: false, clippedEnd: false });
  });

  it('treats end <= start as covering the start day only', () => {
    // A common encoding for "one whole day": both bounds at midnight.
    const e = ev({ id: 'a', start: new Date(2026, 6, 29), end: new Date(2026, 6, 29) });
    const { items } = packAllDayEvents([e], weekColumns());
    expect(items[0]).toMatchObject({ colStart: 2, colEnd: 2 });
  });

  it('spans a multi-day event across a contiguous column run, drawn once', () => {
    // "Inventar Getränkelager", Mon-Tue in the mockup.
    const e = ev({ id: 'inv', start: new Date(2026, 6, 27), end: new Date(2026, 6, 29) });
    const { items } = packAllDayEvents([e], weekColumns());
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ colStart: 0, colEnd: 1 });
  });

  it('pushes overlapping events onto separate rows and leaves non-overlapping ones on row 0', () => {
    const a = ev({ id: 'a', start: new Date(2026, 6, 27), end: new Date(2026, 6, 30) });
    const b = ev({ id: 'b', start: new Date(2026, 6, 28), end: new Date(2026, 6, 29) });
    const c = ev({ id: 'c', start: new Date(2026, 7, 1), end: new Date(2026, 7, 2) });
    const { items, rowCount } = packAllDayEvents([a, b, c], weekColumns());
    expect(rowCount).toBe(2);
    const byId = Object.fromEntries(items.map((i) => [i.event.id, i]));
    expect(byId.a!.row).toBe(0);
    expect(byId.b!.row).toBe(1);
    // c starts after a ends, so it fits back on the top row.
    expect(byId.c!.row).toBe(0);
  });

  it('orders the longest bar first within a cluster', () => {
    const short = ev({ id: 'short', start: new Date(2026, 6, 27), end: new Date(2026, 6, 28) });
    const long = ev({ id: 'long', start: new Date(2026, 6, 27), end: new Date(2026, 6, 31) });
    const { items } = packAllDayEvents([short, long], weekColumns());
    expect(items.find((i) => i.event.id === 'long')!.row).toBe(0);
    expect(items.find((i) => i.event.id === 'short')!.row).toBe(1);
  });

  it('flags clipping when the event runs past the visible window', () => {
    const e = ev({ id: 'holiday', start: new Date(2026, 6, 20), end: new Date(2026, 7, 10) });
    const { items } = packAllDayEvents([e], weekColumns());
    expect(items[0]).toMatchObject({ colStart: 0, colEnd: 6, clippedStart: true, clippedEnd: true });
  });

  it('drops events that miss the window entirely', () => {
    const e = ev({ id: 'far', start: new Date(2026, 8, 1), end: new Date(2026, 8, 2) });
    expect(packAllDayEvents([e], weekColumns()).items).toHaveLength(0);
  });

  describe('resource columns', () => {
    const cols: AllDayColumn[] = ['t1', 't2', 't3'].map((id) => ({
      key: id,
      start: new Date(2026, 6, 29),
      end: new Date(2026, 6, 30),
      resourceId: id,
    }));

    it('matches an event only to its own resource column', () => {
      const e = ev({ id: 'a', resourceId: 't2', start: new Date(2026, 6, 29), end: new Date(2026, 6, 30) });
      const { items } = packAllDayEvents([e], cols);
      expect(items[0]).toMatchObject({ colStart: 1, colEnd: 1 });
    });

    it('never spans across resources, because adjacency is not time', () => {
      const e = ev({ id: 'a', resourceId: 't1', start: new Date(2026, 6, 29), end: new Date(2026, 6, 30) });
      const { items } = packAllDayEvents([e], cols);
      expect(items[0]!.colStart).toBe(items[0]!.colEnd);
    });

    it('ignores an event with no resourceId when the columns are resources', () => {
      const e = ev({ id: 'a', start: new Date(2026, 6, 29), end: new Date(2026, 6, 30) });
      expect(packAllDayEvents([e], cols).items).toHaveLength(0);
    });
  });
});

describe('splitAllDay', () => {
  it('separates all-day from timed in one pass', () => {
    const a = ev({ id: 'a', start: new Date(2026, 6, 29), end: new Date(2026, 6, 30) });
    const t: CalendarEvent = {
      id: 't', title: 't',
      start: new Date(2026, 6, 29, 9), end: new Date(2026, 6, 29, 10),
    };
    const { allDay, timed } = splitAllDay([a, t]);
    expect(allDay.map((e) => e.id)).toEqual(['a']);
    expect(timed.map((e) => e.id)).toEqual(['t']);
  });
});
