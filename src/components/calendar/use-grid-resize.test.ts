import { describe, expect, it } from 'vitest';
import { applyResizeDelta, snapMinutes } from './use-grid-resize';
import type { CalendarEvent } from './types';

/** 09:00-10:00 on 2026-07-29. */
function event(): CalendarEvent {
  return {
    id: 'a',
    title: 'Team-Sitzung',
    start: new Date(2026, 6, 29, 9, 0),
    end: new Date(2026, 6, 29, 10, 0),
  };
}

const STEP = 15;

describe('snapMinutes', () => {
  it('snaps to the nearest step in both directions', () => {
    expect(snapMinutes(7, STEP)).toBe(0);
    expect(snapMinutes(8, STEP)).toBe(15);
    expect(snapMinutes(-8, STEP)).toBe(-15);
    expect(snapMinutes(37, STEP)).toBe(30);
  });
});

describe('applyResizeDelta', () => {
  it('moves the end edge and leaves the start alone', () => {
    const e = event();
    const r = applyResizeDelta(e, 'end', 30, STEP)!;
    expect(r.start.getTime()).toBe(e.start.getTime());
    expect(r.end.getHours()).toBe(10);
    expect(r.end.getMinutes()).toBe(30);
  });

  it('moves the start edge and leaves the end alone', () => {
    const e = event();
    const r = applyResizeDelta(e, 'start', -30, STEP)!;
    expect(r.start.getHours()).toBe(8);
    expect(r.start.getMinutes()).toBe(30);
    expect(r.end.getTime()).toBe(e.end.getTime());
  });

  it('never lets the end cross the start — one step is the floor', () => {
    const r = applyResizeDelta(event(), 'end', -600, STEP)!;
    expect(r.end.getTime() - r.start.getTime()).toBe(STEP * 60_000);
    expect(r.end.getTime()).toBeGreaterThan(r.start.getTime());
  });

  it('never lets the start cross the end', () => {
    const r = applyResizeDelta(event(), 'start', 600, STEP)!;
    expect(r.end.getTime() - r.start.getTime()).toBe(STEP * 60_000);
  });

  it('returns null for a no-op, so no pointless write is committed', () => {
    expect(applyResizeDelta(event(), 'end', 0, STEP)).toBeNull();
    // Already clamped at the minimum: a further shrink changes nothing.
    const min = applyResizeDelta(event(), 'end', -600, STEP)!;
    const already: CalendarEvent = { ...event(), start: min.start, end: min.end };
    expect(applyResizeDelta(already, 'end', -600, STEP)).toBeNull();
  });

  it('honours a non-default step', () => {
    const r = applyResizeDelta(event(), 'end', 5, 5)!;
    expect(r.end.getMinutes()).toBe(5);
  });

  it('does not mutate the source event', () => {
    const e = event();
    const before = e.end.getTime();
    applyResizeDelta(e, 'end', 45, STEP);
    expect(e.end.getTime()).toBe(before);
  });
});
