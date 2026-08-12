// @vitest-environment jsdom
// ---------------------------------------------------------------------------
// Mount-level regression tests for the agenda list.
//
// The grouping arithmetic is covered by calendar/agenda.test.ts. What is
// tested here is the one thing a pure function cannot express: what happens
// to the per-row `:ref` callbacks when the list *shrinks*. Vue invokes the
// previous render's ref function with `null` while unmounting the rows that
// went away, so any reactive lookup inside that callback runs against the new,
// shorter data with the old index.
// ---------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';
import type { CalendarEvent } from './calendar/types';
import SdCalendarAgenda from './SdCalendarAgenda.vue';
import { mount } from '@vue/test-utils';

const FROM = new Date(2026, 6, 29);

function timed(id: string, day: number, h: number): CalendarEvent {
  return { id, title: id, start: new Date(2026, 6, day, h), end: new Date(2026, 6, day, h + 1) };
}

const THREE_DAYS = [
  timed('a', 29, 9),
  timed('b', 29, 11),
  timed('c', 30, 9),
  timed('d', 30, 14),
  timed('e', 31, 8),
];

describe('SdCalendarAgenda', () => {
  it('numbers rows across day groups in flat order', () => {
    const w = mount(SdCalendarAgenda, { props: { date: FROM, events: THREE_DAYS, days: 7 } });
    const rows = w.findAll('[role="option"]');
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.attributes('tabindex'))).toEqual(['0', '-1', '-1', '-1', '-1']);
    w.unmount();
  });

  it('survives the day groups shrinking to nothing', async () => {
    // Toggling every calendar off is exactly this: the events prop empties
    // while rows rendered from the previous, longer list are still mounted.
    const w = mount(SdCalendarAgenda, { props: { date: FROM, events: THREE_DAYS, days: 7 } });
    await w.setProps({ events: [] });
    expect(w.findAll('[role="option"]')).toHaveLength(0);
    await w.setProps({ events: THREE_DAYS });
    expect(w.findAll('[role="option"]')).toHaveLength(5);
    w.unmount();
  });

  it('survives losing the trailing day groups', async () => {
    const w = mount(SdCalendarAgenda, { props: { date: FROM, events: THREE_DAYS, days: 7 } });
    await w.setProps({ events: [timed('a', 29, 9)] });
    expect(w.findAll('[role="option"]')).toHaveLength(1);
    w.unmount();
  });

  it('survives losing a leading day group', async () => {
    const w = mount(SdCalendarAgenda, { props: { date: FROM, events: THREE_DAYS, days: 7 } });
    await w.setProps({ events: [timed('e', 31, 8)] });
    const rows = w.findAll('[role="option"]');
    expect(rows).toHaveLength(1);
    expect(rows[0]!.attributes('tabindex')).toBe('0');
    w.unmount();
  });

  it('keeps the roving tabindex inside the shortened list', async () => {
    const w = mount(SdCalendarAgenda, { props: { date: FROM, events: THREE_DAYS, days: 7 } });
    await w.findAll('[role="option"]')[4]!.trigger('click');
    expect(w.findAll('[role="option"]')[4]!.attributes('tabindex')).toBe('0');

    await w.setProps({ events: [timed('a', 29, 9), timed('b', 29, 11)] });
    const rows = w.findAll('[role="option"]');
    expect(rows.filter((r) => r.attributes('tabindex') === '0')).toHaveLength(1);
    expect(rows[1]!.attributes('tabindex')).toBe('0');
    w.unmount();
  });

  it('focuses the row the arrow keys move to, after a shrink', async () => {
    const w = mount(SdCalendarAgenda, {
      props: { date: FROM, events: THREE_DAYS, days: 7 },
      attachTo: document.body,
    });
    await w.setProps({ events: [timed('c', 30, 9), timed('d', 30, 14)] });
    const rows = w.findAll('[role="option"]');
    await rows[0]!.trigger('keydown', { key: 'ArrowDown' });
    await w.vm.$nextTick();
    // The element that takes focus must be the one still in the document, not
    // a detached node left behind by the longer list.
    expect(document.activeElement).toBe(rows[1]!.element);
    w.unmount();
  });

  it('emits eventClick with the clicked row event after a reorder', async () => {
    const w = mount(SdCalendarAgenda, { props: { date: FROM, events: THREE_DAYS, days: 7 } });
    await w.setProps({ events: [timed('c', 30, 9), timed('e', 31, 8)] });
    await w.findAll('[role="option"]')[1]!.trigger('click');
    const emitted = w.emitted('eventClick');
    expect(emitted).toBeTruthy();
    expect((emitted![0]![0] as CalendarEvent).id).toBe('e');
    w.unmount();
  });

  it('renders the empty state when there is nothing to show', () => {
    const w = mount(SdCalendarAgenda, { props: { date: FROM, events: [] } });
    expect(w.find('[role="listbox"]').exists()).toBe(false);
    expect(w.text()).toContain('Keine Termine');
    w.unmount();
  });

  it('keeps a heading for an empty day when includeEmptyDays is set', () => {
    const w = mount(SdCalendarAgenda, {
      props: { date: FROM, events: [timed('a', 29, 9)], days: 3, includeEmptyDays: true },
    });
    expect(w.findAll('[role="presentation"]')).toHaveLength(3);
    expect(w.findAll('[role="option"]')).toHaveLength(1);
    w.unmount();
  });
});
