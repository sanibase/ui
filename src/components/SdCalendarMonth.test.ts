// @vitest-environment jsdom
// ---------------------------------------------------------------------------
// The month chip carries the same accent bar the other views draw.
//
// The colour arithmetic itself is calendar/event-colour.test.ts. What is tested
// here is the thing that regressed and that a pure function cannot express: the
// month grid RENDERING the accent it now resolves. It resolved one before this
// and drew only the 8% tint with it, so two calendars in one month were told
// apart by a wash behind 10px text -- which is what the owner reported after
// living with the release that fixed the tint.
// ---------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import type { CalendarEvent } from './calendar/types';
import SdCalendarMonth from './SdCalendarMonth.vue';

const MONTH = new Date(2026, 7, 13);

function event(id: string, color?: string): CalendarEvent {
  return {
    id,
    title: id,
    start: new Date(2026, 7, 13, 9),
    end: new Date(2026, 7, 13, 10),
    ...(color === undefined ? {} : { color }),
  };
}

describe('SdCalendarMonth', () => {
  it("paints the accent bar in the event's own colour", () => {
    const w = mount(SdCalendarMonth, {
      props: { date: MONTH, events: [event('a', '#2f6fed')] },
    });
    const bars = w.findAll('.sd-cal-month-accent');
    expect(bars).toHaveLength(1);
    // The colour undiluted: the fill behind it is the same colour at 8%, and a
    // bar sharing that alpha would be the bug this exists to catch.
    expect(bars[0]!.attributes('style')).toContain('background-color: rgb(47, 111, 237)');
    w.unmount();
  });

  it('falls back to the status token when the event has no colour', () => {
    const w = mount(SdCalendarMonth, { props: { date: MONTH, events: [event('b')] } });
    const bar = w.get('.sd-cal-month-accent');
    expect(bar.classes()).toContain('bg-sd-success');
    expect(bar.attributes('style')).toBeUndefined();
    w.unmount();
  });

  it('draws one bar per chip, and none for the overflow line', () => {
    const w = mount(SdCalendarMonth, {
      props: {
        date: MONTH,
        events: [event('a', '#111111'), event('b', '#222222'), event('c', '#333333')],
        maxVisible: 2,
      },
    });
    expect(w.findAll('.sd-cal-month-accent')).toHaveLength(2);
    w.unmount();
  });
});
