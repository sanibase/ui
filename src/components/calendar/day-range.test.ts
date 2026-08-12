import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  clampDayIndex,
  dayColumnTemplate,
  dropOnSlot,
  formatRangeLabel,
  gutterColumnTemplate,
  isFullWeek,
  normaliseVisibleDays,
  rangeDates,
  rangeEnd,
  rangeStart,
  stepRange,
} from './day-range';

/** Wed 12 Aug 2026. The week around it is Mon 10 Aug .. Sun 16 Aug. */
const WED = new Date(2026, 7, 12);
const SUN = new Date(2026, 7, 16);

/**
 * The seven-day start the week grid computed inline before `visibleDays`
 * existed, copied verbatim from the pre-change `weekDays` computed. Every
 * default-path assertion below is made against this, so "the default is
 * unchanged" is a property the suite checks rather than a claim.
 */
function legacyWeekStart(date: Date, weekStartsOn: 0 | 1): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = weekStartsOn === 1 ? (day === 0 ? -6 : 1 - day) : -day;
  const first = new Date(d);
  first.setDate(d.getDate() + diff);
  first.setHours(0, 0, 0, 0);
  return first;
}

describe('normaliseVisibleDays', () => {
  it('defaults to a full week', () => {
    expect(normaliseVisibleDays(undefined)).toBe(7);
    expect(isFullWeek(undefined)).toBe(true);
  });

  it('clamps into 1..7 and rounds, rather than drawing nonsense', () => {
    expect(normaliseVisibleDays(0)).toBe(1);
    expect(normaliseVisibleDays(-4)).toBe(1);
    expect(normaliseVisibleDays(30)).toBe(7);
    expect(normaliseVisibleDays(2.6)).toBe(3);
    expect(normaliseVisibleDays(Number.NaN)).toBe(7);
  });
});

describe('rangeStart', () => {
  it('snaps a full week to the week start, exactly as it always did', () => {
    for (const weekStartsOn of [0, 1] as const) {
      for (let offset = 0; offset < 14; offset++) {
        const probe = new Date(2026, 7, 3 + offset);
        expect(rangeStart(probe, undefined, weekStartsOn).getTime()).toBe(
          legacyWeekStart(probe, weekStartsOn).getTime(),
        );
        expect(rangeStart(probe, 7, weekStartsOn).getTime()).toBe(
          legacyWeekStart(probe, weekStartsOn).getTime(),
        );
      }
    }
  });

  it('starts a narrower window at the selected day', () => {
    expect(rangeStart(WED, 3).getDate()).toBe(12);
    expect(rangeStart(SUN, 3).getDate()).toBe(16);
    expect(rangeStart(WED, 1).getDate()).toBe(12);
  });

  it('drops the time component so a column is a whole day', () => {
    const start = rangeStart(new Date(2026, 7, 12, 23, 59), 3);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });

  it('does not mutate its argument', () => {
    const probe = new Date(2026, 7, 12, 9, 30);
    rangeStart(probe, 3);
    rangeStart(probe, 7);
    expect(probe.getTime()).toBe(new Date(2026, 7, 12, 9, 30).getTime());
  });
});

describe('rangeDates', () => {
  it('draws seven consecutive days by default', () => {
    const days = rangeDates(WED, undefined);
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.getDate())).toEqual([10, 11, 12, 13, 14, 15, 16]);
  });

  it('draws exactly three, starting at the selected day', () => {
    expect(rangeDates(WED, 3).map((d) => d.getDate())).toEqual([12, 13, 14]);
  });

  it('crosses a month boundary without a gap', () => {
    expect(rangeDates(new Date(2026, 7, 30), 3).map((d) => d.getMonth())).toEqual([7, 7, 8]);
    expect(rangeDates(new Date(2026, 7, 30), 3).map((d) => d.getDate())).toEqual([30, 31, 1]);
  });

  it('agrees with rangeEnd', () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7]) {
      const days = rangeDates(WED, n);
      expect(days[days.length - 1]!.getTime()).toBe(rangeEnd(WED, n).getTime());
    }
  });

  it('keeps the Sunday of a Monday-start week inside that week', () => {
    // A Sunday selected with weekStartsOn = 1 belongs to the week that began
    // six days earlier, not to the one starting tomorrow.
    expect(rangeDates(SUN, 7, 1).map((d) => d.getDate())).toEqual([10, 11, 12, 13, 14, 15, 16]);
    expect(rangeDates(SUN, 7, 0)[0]!.getDate()).toBe(16);
  });
});

describe('stepRange', () => {
  it('pages a full week by seven days, as the nav always did', () => {
    expect(stepRange(WED, 1, undefined).getDate()).toBe(19);
    expect(stepRange(WED, -1, 7).getDate()).toBe(5);
  });

  it('pages a narrow window by its own width, so nothing is skipped or repeated', () => {
    const next = stepRange(WED, 1, 3);
    expect(next.getDate()).toBe(15);
    // The window after next starts where this one ended + 1: no overlap, no gap.
    expect(rangeDates(next, 3).map((d) => d.getDate())).toEqual([15, 16, 17]);
    expect(rangeDates(stepRange(next, -1, 3), 3).map((d) => d.getDate())).toEqual([12, 13, 14]);
  });
});

describe('formatRangeLabel', () => {
  it('names the calendar week at the default, unchanged', () => {
    expect(formatRangeLabel(WED, undefined, 1, 'de-CH')).toBe('10. Aug. - 16. Aug. 2026');
    expect(formatRangeLabel(WED, 7, 1, 'en-GB')).toBe('10 Aug - 16 Aug 2026');
  });

  it('names only the days a narrow window draws', () => {
    // The whole point: three columns must not be captioned as a week.
    expect(formatRangeLabel(WED, 3, 1, 'de-CH')).toBe('12. Aug. - 14. Aug. 2026');
  });

  it('names a single day once, not as a range onto itself', () => {
    expect(formatRangeLabel(WED, 1, 1, 'de-CH')).toBe('12. Aug. 2026');
  });

  it('follows weekStartsOn on a Sunday instead of naming the next week', () => {
    expect(formatRangeLabel(SUN, 7, 1, 'de-CH')).toBe('10. Aug. - 16. Aug. 2026');
    expect(formatRangeLabel(SUN, 7, 0, 'de-CH')).toBe('16. Aug. - 22. Aug. 2026');
  });

  it('agrees with the columns the grid draws, at every width', () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7]) {
      const days = rangeDates(WED, n, 1);
      const label = formatRangeLabel(WED, n, 1, 'de-CH');
      expect(label).toContain(days[0]!.toLocaleDateString('de-CH', { day: 'numeric', month: 'short' }));
      expect(label).toContain(
        days[days.length - 1]!.toLocaleDateString('de-CH', { day: 'numeric', month: 'short' }),
      );
    }
  });
});

describe('the grid templates', () => {
  it('emits the byte-identical seven-column template by default', () => {
    expect(gutterColumnTemplate('52px', undefined)).toBe('52px repeat(7, 1fr)');
    expect(gutterColumnTemplate('60px', 7)).toBe('60px repeat(7, 1fr)');
  });

  it('narrows to the requested count', () => {
    expect(gutterColumnTemplate('52px', 3)).toBe('52px repeat(3, 1fr)');
    expect(dayColumnTemplate(3)).toBe('repeat(3, minmax(0, 1fr))');
    expect(dayColumnTemplate(undefined)).toBe('repeat(7, minmax(0, 1fr))');
  });
});

describe('clampDayIndex', () => {
  it('cannot walk out of a full week', () => {
    expect(clampDayIndex(7, undefined)).toBe(6);
    expect(clampDayIndex(-1, undefined)).toBe(0);
  });

  it('cannot walk out of a narrow window', () => {
    expect(clampDayIndex(3, 3)).toBe(2);
    expect(clampDayIndex(6, 3)).toBe(2);
    expect(clampDayIndex(-3, 3)).toBe(0);
    expect(clampDayIndex(0, 1)).toBe(0);
    expect(clampDayIndex(4, 1)).toBe(0);
  });
});

describe('dropOnSlot', () => {
  const event = {
    start: new Date(2026, 7, 12, 9, 0),
    end: new Date(2026, 7, 12, 10, 30),
  };

  it('lands on the day it was given, not on an index into a week', () => {
    const moved = dropOnSlot(event, new Date(2026, 7, 14), { hour: 14, minute: 15 });
    expect(moved.start.getDate()).toBe(14);
    expect(moved.start.getHours()).toBe(14);
    expect(moved.start.getMinutes()).toBe(15);
  });

  it('preserves the duration', () => {
    const moved = dropOnSlot(event, new Date(2026, 7, 14), { hour: 23, minute: 45 });
    expect(moved.end.getTime() - moved.start.getTime()).toBe(90 * 60_000);
    // 23:45 + 1h30 crosses midnight, which is a real end on the next day.
    expect(moved.end.getDate()).toBe(15);
  });

  it('rolls an overnight slot hour into the following day', () => {
    // endHour 26 = a 02:00 close; slot.hour 25 is 01:00 tomorrow.
    const moved = dropOnSlot(event, new Date(2026, 7, 14), { hour: 25, minute: 0 });
    expect(moved.start.getDate()).toBe(15);
    expect(moved.start.getHours()).toBe(1);
  });

  it('does not mutate the source event', () => {
    dropOnSlot(event, new Date(2026, 7, 14), { hour: 8, minute: 0 });
    expect(event.start.getTime()).toBe(new Date(2026, 7, 12, 9, 0).getTime());
  });
});

// ---------------------------------------------------------------------------
// Wiring guards.
//
// This package's test setup has no DOM and mounts nothing (see README), so the
// three-rows-agree claim is checked the way `css-variables.test.ts` checks the
// stylesheet against the token table: by reading the source and asserting the
// property that must hold. Weaker than a mount, stronger than nothing, and it
// catches exactly the regression that matters: one row of the grid quietly
// keeping its own column count.
// ---------------------------------------------------------------------------

const weekGrid = readFileSync(
  fileURLToPath(new URL('../SdCalendarWeekGrid.vue', import.meta.url)),
  'utf8',
);

const dateNav = readFileSync(
  fileURLToPath(new URL('../SdDateNav.vue', import.meta.url)),
  'utf8',
);

describe('SdCalendarWeekGrid wiring', () => {
  it('has no hardcoded seven anywhere in its layout', () => {
    expect(weekGrid).not.toContain('repeat(7');
    expect(weekGrid).not.toContain('grid-cols-7');
    // The old keyboard clamps were literal 6 (= 7 - 1).
    expect(weekGrid).not.toMatch(/Math\.min\(6,/);
    expect(weekGrid).not.toMatch(/moveCell\(6,/);
  });

  it('drives all three gutter rows from one column template', () => {
    // Day headers, all-day band, time body. Plus the events overlay, which is
    // absolutely positioned over the body and must line up with it too.
    const uses = weekGrid.match(/colTemplate/g) ?? [];
    expect(uses.length).toBeGreaterThanOrEqual(4);
    expect(weekGrid).toContain('gutterColumnTemplate(');
    expect(weekGrid).toContain(':column-template="colTemplate"');
  });

  it('drops onto the day of the cell under the pointer', () => {
    expect(weekGrid).toContain('@drop="onWeekSlotDrop(day.date, si)"');
    expect(weekGrid).toContain('dropOnSlot(');
  });

  it('clamps the keyboard grid to the visible window', () => {
    expect(weekGrid).toContain('clampDayIndex(');
  });
});

describe('SdDateNav wiring', () => {
  it('formats the label from the range rather than its own week arithmetic', () => {
    expect(dateNav).toContain('formatRangeLabel(d, props.visibleDays, props.weekStartsOn, locale)');
    // The replaced arithmetic, which the doc comment still names in prose.
    expect(dateNav).not.toContain('d.getDay()');
  });

  it('steps by the window width, not by a fixed week', () => {
    expect(dateNav).toContain('stepRange(props.modelValue, direction, props.visibleDays)');
    // Agenda still pages by a week on purpose; week mode must not.
    const weekBranch = dateNav.slice(dateNav.indexOf("viewMode === 'week'", dateNav.indexOf('function navigate')));
    expect(weekBranch).not.toContain('direction * 7');
  });
});
