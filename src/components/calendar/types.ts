/** Shared types for the SdCalendar component family. */

export type CalendarViewMode = 'day' | 'week' | 'month' | 'agenda';
export type TimeAxisOrientation = 'vertical' | 'horizontal';
export type EventStatus = 'confirmed' | 'pending' | 'tentative' | 'cancelled';

export interface CalendarEvent {
  id: string;
  /**
   * Column this event belongs to in the resource day grid (a staff member, a
   * table, a room).
   *
   * **Optional.** Resource columns are a booking-grid concept; a personal
   * calendar has exactly one implicit column and no resources at all. When
   * `resources` is empty the day grid renders that single implicit column and
   * shows every event in it regardless of this field.
   *
   * Callers that do pass resources are unaffected: an event still only lands
   * in a column whose id it matches.
   */
  resourceId?: string;
  start: Date;
  end: Date;
  title: string;
  subtitle?: string;
  status?: EventStatus;
  color?: string;
  /**
   * All-day (or multi-day) event. Rendered in the pinned band above the time
   * grid in week and day views and as a timeless row in agenda, never as a
   * block on the time axis.
   *
   * `start` and `end` are still real Dates; only the *rendering* changes. For
   * a single all-day event, `end` may equal `start` — the band treats an end
   * at or before the start as covering the start day only.
   */
  allDay?: boolean;
}

export interface CalendarResource {
  id: string;
  label: string;
  subtitle?: string;
}

export interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
}

/** Payload of the `eventResize` emit. */
export interface CalendarResizePayload {
  event: CalendarEvent;
  start: Date;
  end: Date;
  /** Which edge the user dragged. */
  edge: 'start' | 'end';
}

/**
 * Where a paging host has slid the day columns to.
 *
 * THE GRID IS A CHAIN OF DAYS, NOT A DECK OF PERIODS. The first version of this
 * (SD-223) moved the visible period out and the next one in, and because there
 * is only ever one period rendered, the middle of the travel showed an empty
 * grid. Measured: 41 of 65 animation frames with the column region 0% covered.
 * The owner: "its better but its still not a continuous strip, there white
 * space first and then the other slides in, it its really a chain pls".
 *
 * So the grid draws `stepDays` extra day columns on EACH side of the visible
 * window and lays every one of them end to end in a single strip. A page turn
 * translates that strip by exactly one step. Both periods are laid out and
 * painted for the whole travel, edge to edge, because they were never two
 * things: they are one row of days and the window slides along it.
 *
 * THE GEOMETRY LIVES HERE, NOT IN THE HOST, and that is the point of expressing
 * the travel in STEPS rather than in pixels or percent. A host would have to
 * know the strip's column count to turn "one period" into a percentage, and a
 * host that got it wrong would leave the grid parked between two days.
 */
export interface CalendarPaging {
  /**
   * How many days one page turn moves.
   *
   * NOT the width of the window. The three-day view rolls by a single day, so
   * its strip is five columns wide -- one lead, three visible, one trail -- and
   * one step is a third of what is on screen. A week steps seven and gets
   * twenty-one. Zero means no strip at all.
   */
  stepDays: number;
  /**
   * Where the strip is, in whole steps. `0` is at rest; `-1` is one step
   * forward, which puts the next period exactly on screen.
   */
  travel: number;
  /** Extra travel in px, so a finger can drag the strip 1:1. */
  travelPx: number;
  /** The transition on the strip's transform. Empty string for none. */
  transition: string;
}

/** Localisable chrome strings. The library itself carries no i18n. */
export interface CalendarNavLabels {
  today?: string;
  day?: string;
  week?: string;
  month?: string;
  agenda?: string;
  allDay?: string;
  /** Trailing word of the month view's "+N more" link. */
  more?: string;
}
