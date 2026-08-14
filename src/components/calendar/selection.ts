// ---------------------------------------------------------------------------
// The proposed range on a time grid: where it goes and how it is dragged.
//
// The arithmetic lives here rather than in the two grids because both of them
// need every line of it and neither of them is the right place for the next
// reader to look. The rendering is `SdCalendarSelection.vue`; the dragging is
// `useGridResize`, unchanged, which is the point of `selectionAsEvent`: the
// snap step, the one-step minimum, the pointer capture and the Escape are the
// SAME code that moves an event's edges. Two rules about how far a handle
// jumps, in a product where both are on screen at once, is how they drift.
// ---------------------------------------------------------------------------

import type { CalendarEvent, CalendarSelection } from './types';

/**
 * The id the drag machinery knows the selection by.
 *
 * `useGridResize` is keyed by event id, and the selection is not an event, so
 * it needs one id that no real event can have. It never leaves the grid.
 */
export const SELECTION_ID = '__sd-selection__';

/** The selection in the shape the drag composable takes. */
export function selectionAsEvent(selection: CalendarSelection): CalendarEvent {
  return {
    id: SELECTION_ID,
    title: '',
    start: selection.start,
    end: selection.end,
  };
}

export interface SelectionBox {
  top: string;
  height: string;
}

/**
 * Where the box sits in ONE day column, or null when it does not belong there.
 *
 * The reference frame is minutes since (that day's midnight + `startHour`),
 * which is the frame the events are laid out in, so a selection and an event at
 * the same time land on the same pixel.
 *
 * CLAMPED TO THE COLUMN, not dropped. A range that starts at 23:30 and runs
 * into the next day is drawn from 23:30 to the foot of its own column: the
 * alternative is a proposal the user made that has no rectangle anywhere, which
 * reads as the tap having failed.
 */
export function selectionBox(
  selection: CalendarSelection,
  day: Date,
  startHour: number,
  totalMinutes: number,
): SelectionBox | null {
  if (totalMinutes <= 0) return null;
  const midnight = new Date(day);
  midnight.setHours(0, 0, 0, 0);
  const originMs = midnight.getTime() + startHour * 60 * 60_000;
  const startMin = (selection.start.getTime() - originMs) / 60_000;
  const endMin = (selection.end.getTime() - originMs) / 60_000;
  if (endMin <= 0 || startMin >= totalMinutes) return null;
  const top = Math.max(0, startMin);
  const bottom = Math.min(totalMinutes, Math.max(endMin, startMin));
  if (bottom <= top) return null;
  return {
    top: `${(top / totalMinutes) * 100}%`,
    height: `${((bottom - top) / totalMinutes) * 100}%`,
  };
}
