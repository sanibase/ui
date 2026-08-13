import { describe, expect, it } from 'vitest';
import { stripGeometry } from './strip';
import { stripDates } from './day-range';
import type { CalendarPaging } from './types';

const at = (travel: number, travelPx = 0, stepDays = 7): CalendarPaging => ({
  stepDays,
  travel,
  travelPx,
  transition: '',
});

/** The transform's percentage, which is the only number that has to be right. */
function shiftPct(style: Record<string, unknown> | undefined): number {
  const transform = String(style?.transform ?? '');
  const match = /calc\((-?[\d.]+)%/.exec(transform);
  return match ? Number(match[1]) : NaN;
}

describe('stripGeometry', () => {
  it('draws only the window and adds no transform when nobody is paging', () => {
    const geo = stripGeometry(7, 0);
    expect(geo).toMatchObject({ lead: 0, trail: 0, total: 7 });
    expect(geo.template).toBe('repeat(7, minmax(0, 1fr))');
    // Not a zero transform: any transform makes a containing block for fixed.
    expect(geo.style).toBeUndefined();
  });

  it('adds a step of columns on each side of a week', () => {
    const geo = stripGeometry(7, 7, at(0));
    expect(geo).toMatchObject({ lead: 7, trail: 7, total: 21 });
    expect(geo.template).toBe('repeat(21, minmax(0, 1fr))');
  });

  it('is exactly three windows wide for a week, and rests one window in', () => {
    const geo = stripGeometry(7, 7, at(0));
    expect(geo.style?.width).toBe('300%');
    // 7 of 21 columns = a third of the strip = one window.
    expect(shiftPct(geo.style)).toBeCloseTo(-33.33, 1);
  });

  it('travels exactly one window for a week', () => {
    const rest = shiftPct(stripGeometry(7, 7, at(0)).style);
    const forward = shiftPct(stripGeometry(7, 7, at(-1)).style);
    const back = shiftPct(stripGeometry(7, 7, at(1)).style);
    // One step is 7/21 of the strip, and the strip is 3x the window, so a step
    // is exactly one window on screen.
    expect(rest - forward).toBeCloseTo(33.33, 1);
    expect(back - rest).toBeCloseTo(33.33, 1);
  });

  it('rolls a three-day window by ONE column, not by three', () => {
    // The three-day view's arrows step a single day, and the swipe has to move
    // the same amount or the two controls mean different things.
    const geo = stripGeometry(3, 1, at(0, 0, 1));
    expect(geo).toMatchObject({ lead: 1, trail: 1, total: 5 });
    const rest = shiftPct(geo.style);
    const forward = shiftPct(stripGeometry(3, 1, at(-1, 0, 1)).style);
    // 1 of 5 columns, on a strip 5/3 as wide as the window: a third of the
    // screen, which is one of the three columns.
    expect(rest - forward).toBeCloseTo(20, 1);
    expect(geo.style?.width).toBe('166.67%');
  });

  it('takes the step in COLUMNS, so a resource day view moves a whole rank', () => {
    // Three tables, one day of travel: nine columns, and one step is three.
    const geo = stripGeometry(3, 3, at(0, 0, 1));
    expect(geo).toMatchObject({ lead: 3, trail: 3, total: 9 });
    expect(shiftPct(geo.style)).toBeCloseTo(-33.33, 1);
  });

  it('carries the finger 1:1 on top of the step', () => {
    const style = stripGeometry(7, 7, at(0, -48)).style;
    expect(String(style?.transform)).toContain('+ -48px');
  });

  it('leaves the transition off entirely when there is none', () => {
    expect(stripGeometry(7, 7, at(0)).style?.transition).toBeUndefined();
    expect(
      stripGeometry(7, 7, { ...at(0), transition: 'transform 300ms linear' }).style?.transition,
    ).toBe('transform 300ms linear');
  });
});

describe('stripDates', () => {
  const monday = new Date(2026, 7, 10); // Mon 10 Aug 2026

  it('is the window itself with no lead or trail', () => {
    const days = stripDates(monday, 7, 1, 0, 0);
    expect(days).toHaveLength(7);
    expect(days[0]?.getDate()).toBe(10);
    expect(days[6]?.getDate()).toBe(16);
  });

  it('runs continuously across the window, with no repeats and no holes', () => {
    const days = stripDates(monday, 7, 1, 7, 7);
    expect(days).toHaveLength(21);
    expect(days[0]?.getDate()).toBe(3); // the Monday before
    expect(days[7]?.getDate()).toBe(10); // the window starts here
    expect(days[20]?.getDate()).toBe(23); // the Sunday after
    for (let i = 1; i < days.length; i += 1) {
      const gap = (days[i]!.getTime() - days[i - 1]!.getTime()) / 86_400_000;
      // Around a DST change a day is 23 or 25 hours; what matters is that it is
      // one calendar day and never zero or two.
      expect(gap).toBeGreaterThan(0.9);
      expect(gap).toBeLessThan(1.1);
    }
  });

  it('does not week-align the ends, which would put holes in the strip', () => {
    // A three-day window starting on a Wednesday: the lead day is the Tuesday,
    // not the Monday a week-aligned range would snap to.
    const wednesday = new Date(2026, 7, 12);
    const days = stripDates(wednesday, 3, 1, 1, 1);
    expect(days.map((d) => d.getDate())).toEqual([11, 12, 13, 14, 15]);
  });
});
