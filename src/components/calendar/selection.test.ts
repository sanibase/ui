import { describe, expect, it } from 'vitest';
import { SELECTION_ID, selectionAsEvent, selectionBox } from './selection';

/** A grid running 00:00 to 24:00, which is what a personal calendar draws. */
const FULL_DAY = 24 * 60;

function at(day: number, hour: number, minute = 0): Date {
  return new Date(2026, 7, day, hour, minute, 0, 0);
}

describe('selectionBox', () => {
  it('places a midday hour halfway down a full day', () => {
    const box = selectionBox({ start: at(20, 12), end: at(20, 13) }, at(20, 0), 0, FULL_DAY);
    expect(box).toEqual({ top: '50%', height: `${(60 / FULL_DAY) * 100}%` });
  });

  it('measures from startHour, not from midnight', () => {
    // A grid that starts at 08:00: 09:00 is one hour into a sixteen-hour window.
    const total = 16 * 60;
    const box = selectionBox({ start: at(20, 9), end: at(20, 10) }, at(20, 0), 8, total);
    expect(box).toEqual({ top: `${(60 / total) * 100}%`, height: `${(60 / total) * 100}%` });
  });

  it('draws nothing on a day the range does not reach', () => {
    expect(selectionBox({ start: at(20, 12), end: at(20, 13) }, at(21, 0), 0, FULL_DAY)).toBeNull();
  });

  it('clamps a range that runs past midnight to the foot of its own column', () => {
    const box = selectionBox({ start: at(20, 23, 30), end: at(21, 1) }, at(20, 0), 0, FULL_DAY);
    expect(box).not.toBeNull();
    expect(box?.top).toBe(`${((23 * 60 + 30) / FULL_DAY) * 100}%`);
    expect(box?.height).toBe(`${(30 / FULL_DAY) * 100}%`);
  });

  it('draws the tail of an overnight range on the following day', () => {
    const box = selectionBox({ start: at(20, 23, 30), end: at(21, 1) }, at(21, 0), 0, FULL_DAY);
    expect(box).toEqual({ top: '0%', height: `${(60 / FULL_DAY) * 100}%` });
  });

  it('refuses a zero-height range rather than drawing a line', () => {
    expect(selectionBox({ start: at(20, 12), end: at(20, 12) }, at(20, 0), 0, FULL_DAY)).toBeNull();
  });
});

describe('selectionAsEvent', () => {
  it('carries the range under an id no real event can hold', () => {
    const range = { start: at(20, 12), end: at(20, 13) };
    const event = selectionAsEvent(range);
    expect(event.id).toBe(SELECTION_ID);
    expect(event.start).toBe(range.start);
    expect(event.end).toBe(range.end);
    expect(event.title).toBe('');
  });
});
