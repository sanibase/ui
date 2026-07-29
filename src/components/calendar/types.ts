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
