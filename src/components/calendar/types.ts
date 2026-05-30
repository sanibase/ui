/** Shared types for the SdCalendar component family. */

export type CalendarViewMode = 'day' | 'week' | 'month';
export type TimeAxisOrientation = 'vertical' | 'horizontal';
export type EventStatus = 'confirmed' | 'pending' | 'tentative' | 'cancelled';

export interface CalendarEvent {
  id: string;
  resourceId: string;
  start: Date;
  end: Date;
  title: string;
  subtitle?: string;
  status?: EventStatus;
  color?: string;
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
