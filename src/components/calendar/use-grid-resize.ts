// ---------------------------------------------------------------------------
// Drag-to-resize for the calendar time grids.
//
// Deliberately Pointer Events, not HTML5 drag-and-drop: DnD is already spoken
// for by *moving* an event, it cannot report intermediate positions (so there
// would be no live preview), and it does not work with a stylus or touch
// without a long-press. Pointer capture gives a live preview, works on touch,
// and cancels cleanly on Escape.
//
// The composable owns only the interaction and the arithmetic. It never
// mutates the event — it reports a candidate range through `onCommit` and the
// host decides, which is what makes the optimistic-with-revert pattern in the
// UX spec possible.
// ---------------------------------------------------------------------------

import { computed, type ComputedRef, type MaybeRefOrGetter, onUnmounted, type Ref, ref, toValue } from 'vue';
import type { CalendarEvent, CalendarResizePayload } from './types';

export type ResizeAxis = 'vertical' | 'horizontal';
export type ResizeEdge = 'start' | 'end';

export interface UseGridResizeOptions {
  /**
   * Vertical grids measure height, horizontal (Gantt) grids measure width.
   * Accepts a getter because the day grid flips orientation at runtime.
   */
  axis: MaybeRefOrGetter<ResizeAxis>;
  /** The element whose full extent maps to `totalMinutes`. */
  container: Ref<HTMLElement | null>;
  totalMinutes: ComputedRef<number>;
  stepMinutes: ComputedRef<number>;
  /** Fired once, on release, with the snapped result. */
  onCommit: (payload: CalendarResizePayload) => void;
}

interface ActiveResize {
  event: CalendarEvent;
  edge: ResizeEdge;
  origin: number;
  start: Date;
  end: Date;
}

export interface UseGridResize {
  /** Live range while dragging this event, or null. */
  previewFor: (id: string) => { start: Date; end: Date } | null;
  isResizing: (id: string) => boolean;
  /** Any resize in progress — useful for suppressing hover affordances. */
  active: ComputedRef<boolean>;
  onHandlePointerDown: (e: PointerEvent, event: CalendarEvent, edge: ResizeEdge) => void;
  /** Keyboard equivalent: move one edge by `deltaMinutes` and commit at once. */
  nudge: (event: CalendarEvent, edge: ResizeEdge, deltaMinutes: number) => void;
}

/** Exported for testing — the arithmetic is the part that goes wrong. */
export function snapMinutes(minutes: number, step: number): number {
  return Math.round(minutes / step) * step;
}

/**
 * Apply a delta to one edge, keeping the event at least one step long.
 * Returns null when the delta would not change anything.
 */
export function applyResizeDelta(
  event: CalendarEvent,
  edge: ResizeEdge,
  deltaMinutes: number,
  stepMinutes: number,
): { start: Date; end: Date } | null {
  const ms = deltaMinutes * 60_000;
  const minMs = stepMinutes * 60_000;
  if (edge === 'end') {
    const end = new Date(Math.max(event.start.getTime() + minMs, event.end.getTime() + ms));
    if (end.getTime() === event.end.getTime()) return null;
    return { start: new Date(event.start), end };
  }
  const start = new Date(Math.min(event.end.getTime() - minMs, event.start.getTime() + ms));
  if (start.getTime() === event.start.getTime()) return null;
  return { start, end: new Date(event.end) };
}

export function useGridResize(opts: UseGridResizeOptions): UseGridResize {
  const activeResize = ref<ActiveResize | null>(null);

  function pixelsToMinutes(px: number): number {
    const el = opts.container.value;
    if (!el) return 0;
    const extent = toValue(opts.axis) === 'vertical' ? el.clientHeight : el.clientWidth;
    if (extent <= 0) return 0;
    return (px / extent) * opts.totalMinutes.value;
  }

  function move(e: PointerEvent) {
    const a = activeResize.value;
    if (!a) return;
    const delta = (toValue(opts.axis) === 'vertical' ? e.clientY : e.clientX) - a.origin;
    const minutes = snapMinutes(pixelsToMinutes(delta), opts.stepMinutes.value);
    const next = applyResizeDelta(a.event, a.edge, minutes, opts.stepMinutes.value);
    activeResize.value = {
      ...a,
      start: next?.start ?? new Date(a.event.start),
      end: next?.end ?? new Date(a.event.end),
    };
  }

  function finish(commit: boolean) {
    const a = activeResize.value;
    activeResize.value = null;
    detach();
    if (!a || !commit) return;
    const changed =
      a.start.getTime() !== a.event.start.getTime() ||
      a.end.getTime() !== a.event.end.getTime();
    if (!changed) return;
    opts.onCommit({ event: a.event, start: a.start, end: a.end, edge: a.edge });
  }

  function onUp() { finish(true); }
  function onCancel() { finish(false); }
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); finish(false); }
  }

  function attach() {
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKey);
  }

  function detach() {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    window.removeEventListener('keydown', onKey);
  }

  onUnmounted(detach);

  function onHandlePointerDown(e: PointerEvent, event: CalendarEvent, edge: ResizeEdge) {
    // Stop the click reaching the event card (which would open the detail)
    // and the native drag from starting a move at the same time.
    e.preventDefault();
    e.stopPropagation();
    activeResize.value = {
      event,
      edge,
      origin: toValue(opts.axis) === 'vertical' ? e.clientY : e.clientX,
      start: new Date(event.start),
      end: new Date(event.end),
    };
    attach();
  }

  function nudge(event: CalendarEvent, edge: ResizeEdge, deltaMinutes: number) {
    const next = applyResizeDelta(event, edge, deltaMinutes, opts.stepMinutes.value);
    if (!next) return;
    opts.onCommit({ event, start: next.start, end: next.end, edge });
  }

  return {
    previewFor: (id: string) => {
      const a = activeResize.value;
      return a && a.event.id === id ? { start: a.start, end: a.end } : null;
    },
    isResizing: (id: string) => activeResize.value?.event.id === id,
    active: computed(() => activeResize.value !== null),
    onHandlePointerDown,
    nudge,
  };
}
