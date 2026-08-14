<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type {
  CalendarEvent,
  CalendarPaging,
  CalendarResizePayload,
  CalendarSelection,
} from './calendar/types';
import SdCalendarEvent from './SdCalendarEvent.vue';
import SdCalendarAllDayBand from './SdCalendarAllDayBand.vue';
import SdCalendarSelection, { type SelectionEdge } from './SdCalendarSelection.vue';
import {
  SELECTION_ID,
  selectionAsEvent,
  selectionBox,
  type SelectionBox,
} from './calendar/selection';
import { type LaidOutItem, packDayEvents } from './calendar/lane-packer';
import type { AllDayColumn } from './calendar/all-day-packer';
import { useGridResize } from './calendar/use-grid-resize';
import {
  clampDayIndex,
  dayColumnTemplate,
  dropOnSlot,
  FULL_WEEK_DAYS,
  gutterColumnTemplate,
  normaliseVisibleDays,
  stripDates,
} from './calendar/day-range';
import { stripGeometry } from './calendar/strip';

export type WeekGridSize = 'sm' | 'md' | 'touch';

export interface SdCalendarWeekGridProps {
  /**
   * Which window to display. At the default seven columns this is any date
   * inside the week; below seven it is the window's first day (see
   * `visibleDays`).
   */
  date: Date;
  /** Events to display */
  events: CalendarEvent[];
  /** Start hour (0-23) */
  startHour?: number;
  /** End hour (0-23; may exceed 24 for overnight venues) */
  endHour?: number;
  /** Show the "now" line */
  showNowLine?: boolean;
  /** Component size. sm = compact stacked cards, md/touch = time grid */
  size?: WeekGridSize;
  /** When true, events are draggable and slots become drop targets. */
  draggable?: boolean;
  /** When true, events grow top/bottom resize handles and emit `eventResize`. */
  resizable?: boolean;
  /** Snap granularity for a resize, in minutes. */
  resizeStepMinutes?: number;
  /**
   * Scroll the grid so this hour sits at the top of the visible area. Applied
   * on mount and whenever it changes — the point of a 00:00-24:00 window is
   * that it can still open at 08:00.
   */
  scrollToHour?: number;
  /** Row height per 15-minute slot, px. Defaults to 14 (md) / 18 (touch). */
  slotHeight?: number;
  /** First day of the week: 1 = Monday (default), 0 = Sunday. */
  weekStartsOn?: 0 | 1;
  /**
   * How many day columns to draw, 1 to 7. Defaults to 7, so an existing
   * caller sees the week it has always seen.
   *
   * Below 7 the grid stops being a week and becomes a rolling window: it
   * starts at `date` rather than at `weekStartsOn`, because a 3-day window
   * cannot be week-aligned without overlapping or skipping days. That is the
   * shape a phone needs, where seven columns come out near 43px each and
   * every event renders as a sliver.
   *
   * A host that pages the window must step `date` by the same amount:
   * `SdDateNav` does it from the same helper, and `stepRange` is exported for
   * hosts that draw their own chrome. Set `ariaLabel` to match, too, since the
   * default names a week view.
   */
  visibleDays?: number;
  /** Intl locale for weekday names. */
  locale?: string;
  /** Gutter label of the all-day band. */
  allDayLabel?: string;
  /** Accessible name for the time grid. */
  ariaLabel?: string;
  /**
   * Where a paging host has slid the DAY COLUMNS to. The gutter never moves.
   *
   * WHY THE AXIS IS SPLIT (SD-223). A host that pages this grid by swiping used
   * to transform the whole component, and the hour labels went with it — which
   * says the hours moved. They did not: 08:00 is 08:00 in every week, and the
   * gutter is the one part of this grid that is not the period being changed.
   *
   * WHY IT IS A STRIP AND NOT A SHIFT (SD-227). The first answer moved the one
   * rendered period out and the next one in, so the middle of every page turn
   * was an empty grid. Now the day headers, the all-day band, the time cells
   * and the events overlay each draw `stepDays` extra columns on either side
   * and lay the lot end to end, and a page turn slides that strip by one step.
   * There is nothing to arrive, because the next period was already there.
   *
   * The regions clip, so no part of the strip ever paints over the gutter.
   *
   * Leave it undefined and the grid is exactly the grid it always was: no extra
   * columns, no wrapper width, and no transform — not even a zero one, which
   * would still make this the containing block for every `position: fixed`
   * descendant.
   */
  paging?: CalendarPaging;
  /**
   * A range the user has proposed, drawn as a bordered box with a handle at
   * each end. Null draws nothing at all.
   *
   * It is NOT an event and the grid never invents one: a tap reports
   * `slotClick` and the host decides whether that becomes a selection, so the
   * box only exists while the host says it does. See `CalendarSelection`.
   */
  selection?: CalendarSelection | null;
  /** Accessible names for the box and its two handles. */
  selectionLabels?: { range?: string; startHandle?: string; endHandle?: string };
}

const props = withDefaults(defineProps<SdCalendarWeekGridProps>(), {
  startHour: 7,
  endHour: 22,
  showNowLine: true,
  size: 'md',
  draggable: false,
  resizable: false,
  resizeStepMinutes: 15,
  weekStartsOn: 1,
  visibleDays: FULL_WEEK_DAYS,
  locale: 'de-CH',
  allDayLabel: 'Ganztags',
  ariaLabel: 'Wochenansicht',
  selection: null,
  selectionLabels: () => ({}),
});

const emit = defineEmits<{
  /**
   * A tap on a time cell, with the QUARTER HOUR that was tapped.
   *
   * IT USED TO BE `dayClick` AND THAT WAS THE BUG. A week grid is a grid of
   * times: the row a finger lands on is the answer to "when", and reporting
   * only the day threw it away, so every host had to invent an hour of its own.
   * SaniMail's did: every tap on this grid proposed 08:00, wherever it landed.
   * The day grid has always reported the slot; this is the same contract.
   */
  slotClick: [payload: { resourceId: string; start: Date; end: Date }];
  /** A tap on the all-day band's column: the proposal is a whole day. */
  allDayClick: [date: Date];
  dayClick: [date: Date];
  eventClick: [event: CalendarEvent];
  eventDrop: [payload: { event: CalendarEvent; resourceId: string; start: Date; end: Date }];
  eventResize: [payload: CalendarResizePayload];
  /** A selection handle was dragged to a new range. */
  'update:selection': [value: CalendarSelection];
  clusterClick: [payload: { events: CalendarEvent[]; bucketStart: Date; bucketEnd: Date }];
}>();

const draggingEventId = ref<string | null>(null);

function onEventDragStart(event: CalendarEvent, e: DragEvent) {
  draggingEventId.value = event.id;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/sd-calendar-event-id', event.id);
  }
}

function onEventDragEnd() {
  draggingEventId.value = null;
}

function onSlotDragOver(e: DragEvent) {
  if (!draggingEventId.value) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
}

function onWeekSlotDrop(date: Date, slotIndex: number) {
  const id = draggingEventId.value;
  if (!id) return;
  const droppedEvent = props.events.find((e) => e.id === id);
  if (!droppedEvent) return;
  const slot = slots.value[slotIndex];
  if (!slot) return;
  // `date` is the cell's own day, taken from the column the pointer is over,
  // never an index into a seven-day assumption, which is what keeps a drop
  // correct at any window width.
  const { start: newStart, end: newEnd } = dropOnSlot(droppedEvent, date, slot);
  // Week view doesn't have resources — preserve the event's existing
  // resourceId. `resourceId` is optional on CalendarEvent now (a personal
  // calendar has no resources), so a missing one reports as an empty string
  // rather than changing the emit's shape for callers that do use resources.
  emit('eventDrop', {
    event: droppedEvent,
    resourceId: droppedEvent.resourceId ?? '',
    start: newStart,
    end: newEnd,
  });
  draggingEventId.value = null;
}

const isCompact = computed(() => props.size === 'sm');

// ── Week days ──

/** Columns actually drawn: 7 by default, fewer when `visibleDays` narrows it. */
const dayCount = computed(() => normaliseVisibleDays(props.visibleDays));

/**
 * How wide the strip is and where it is slid to. The one arithmetic.
 *
 * A column here IS a day, so the step converts one for one -- which is exactly
 * the case the day grid does not have, and the reason `stripGeometry` is told
 * the step in columns rather than reading `stepDays` itself.
 */
const strip = computed(() =>
  stripGeometry(dayCount.value, props.paging?.stepDays ?? 0, props.paging),
);

/**
 * Every column the grid DRAWS: the visible window, plus the lead and trail days
 * a page turn travels across.
 *
 * Without paging `lead` and `trail` are zero and this is the window itself, so
 * a caller that never pages renders exactly what it always rendered.
 *
 * `inWindow` is what the rest of the component branches on. The lead and trail
 * columns are painted and nothing else: no `gridcell` role, no tab stop, no
 * aria label, and `inert` over anything clickable in them. They are days you
 * can see coming, not days you are looking at.
 */
const stripDays = computed(() => {
  const today = new Date();
  const { lead, trail } = strip.value;
  return stripDates(props.date, dayCount.value, props.weekStartsOn, lead, trail).map(
    (current, index) => ({
      date: current,
      dayName: current.toLocaleDateString(props.locale, { weekday: 'short' }),
      dayNum: current.getDate(),
      isToday:
        current.getFullYear() === today.getFullYear() &&
        current.getMonth() === today.getMonth() &&
        current.getDate() === today.getDate(),
      isWeekend: current.getDay() === 0 || current.getDay() === 6,
      inWindow: index >= lead && index < lead + dayCount.value,
      /** Index within the visible window, or -1. The keyboard grid's column. */
      windowIndex: index >= lead && index < lead + dayCount.value ? index - lead : -1,
    }),
  );
});

/** The window on screen. Aria labels, keyboard targets and `isTodayInWeek`. */
const weekDays = computed(() => stripDays.value.filter((d) => d.inWindow));

// ── Time slots (for grid mode) ──

/** A row of this grid is a quarter of an hour, and always has been. */
const SLOT_MINUTES = 15;

const slots = computed(() => {
  const result: { hour: number; minute: number; label: string }[] = [];
  for (let h = props.startHour; h < props.endHour; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      // h % 24 — overnight venues set endHour > 24 (e.g. 26 for a 02:00
      // close). Display label stays inside 00:00–23:59 even though the
      // grid coordinate continues past 24.
      const displayH = ((h % 24) + 24) % 24;
      result.push({
        hour: h,
        minute: m,
        label: `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      });
    }
  }
  return result;
});

const totalMinutes = computed(() => (props.endHour - props.startHour) * 60);

const slotPx = computed(() => props.slotHeight ?? (props.size === 'touch' ? 18 : 14));

// ── All-day band ──

const timedEvents = computed(() => props.events.filter((e) => !e.allDay));

/** The band draws the STRIP, so an all-day chip travels with its own days. */
const bandColumns = computed<AllDayColumn[]>(() =>
  stripDays.value.map((d) => {
    const end = new Date(d.date);
    end.setDate(end.getDate() + 1);
    return { key: String(d.date.getTime()), start: d.date, end };
  }),
);

// ── Now line ──

const nowMinutes = ref(0);
let nowTimer: ReturnType<typeof setInterval> | null = null;

function updateNow() {
  const now = new Date();
  nowMinutes.value = now.getHours() * 60 + now.getMinutes();
}

const nowLinePosition = computed(() => {
  const startMin = props.startHour * 60;
  const endMin = props.endHour * 60;
  // For overnight grids (endMin > 1440) the early hours of "tomorrow"
  // also fall inside the window; offset nowMinutes by +24h so 01:00
  // reads as 1500min not 60.
  let now = nowMinutes.value;
  if (endMin > 1440 && now < startMin) now += 1440;
  if (now < startMin || now > endMin) return null;
  return ((now - startMin) / totalMinutes.value) * 100;
});

const isTodayInWeek = computed(() => weekDays.value.some((d) => d.isToday));

// ── Scroll position ──

const scrollEl = ref<HTMLElement | null>(null);

function applyScrollToHour() {
  const h = props.scrollToHour;
  if (h === undefined || !scrollEl.value) return;
  // The day header and all-day band are sticky inside this scroll container,
  // so an element `y` px into the time body becomes flush with the header's
  // bottom edge at exactly `scrollTop = y`.
  const y = Math.max(0, (h - props.startHour) * 4 * slotPx.value);
  scrollEl.value.scrollTop = y;
}

onMounted(() => {
  updateNow();
  nowTimer = setInterval(updateNow, 60_000);
  void nextTick(applyScrollToHour);
});

onUnmounted(() => {
  if (nowTimer) clearInterval(nowTimer);
});

watch(() => [props.scrollToHour, props.startHour, props.size], () => void nextTick(applyScrollToHour));

// ── Events per day ──

/** Day window in absolute Date timestamps. Honours endHour > 24 so
 *  overnight venues (close 02:00 = endHour 26) include early-morning
 *  next-day events that belong to this service day. */
function dayWindow(date: Date): { start: number; end: number } {
  const mid = new Date(date);
  mid.setHours(0, 0, 0, 0);
  const base = mid.getTime();
  return {
    start: base + props.startHour * 60 * 60_000,
    end: base + props.endHour * 60 * 60_000,
  };
}

function eventsForDay(date: Date): CalendarEvent[] {
  const win = dayWindow(date);
  return timedEvents.value
    .filter((ev) => {
      const s = ev.start.getTime();
      return s >= win.start && s < win.end;
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

const laidOutByDay = computed<Map<number, LaidOutItem[]>>(() => {
  const out = new Map<number, LaidOutItem[]>();
  // The STRIP, not the window: the lead and trail columns are what makes a
  // page turn continuous, and a column packed with no events is a blank one.
  for (const day of stripDays.value) {
    out.set(day.date.getTime(), packDayEvents(eventsForDay(day.date)));
  }
  return out;
});

function itemsForDay(date: Date): LaidOutItem[] {
  return laidOutByDay.value.get(date.getTime()) ?? [];
}

// ── Resize ──

const bodyEl = ref<HTMLElement | null>(null);

const {
  previewFor,
  isResizing,
  onHandlePointerDown,
  nudge,
} = useGridResize({
  axis: 'vertical',
  container: bodyEl,
  totalMinutes,
  stepMinutes: computed(() => props.resizeStepMinutes),
  onCommit: (payload) => emit('eventResize', payload),
});

/** Start/end actually rendered — the live preview while dragging a handle. */
function range(event: CalendarEvent): { start: Date; end: Date } {
  return previewFor(event.id) ?? { start: event.start, end: event.end };
}

// ── The proposed range ──
//
// A SECOND INSTANCE OF THE SAME COMPOSABLE, not a second implementation. It
// snaps by `resizeStepMinutes`, keeps at least one step between the edges (so
// the end can never precede the start) and cancels on Escape, because that is
// what `useGridResize` does and this is `useGridResize`. All that differs is
// where the committed range is sent.

const { previewFor: selectionPreview, onHandlePointerDown: onSelectionPointerDown, nudge: nudgeSelection } =
  useGridResize({
    axis: 'vertical',
    container: bodyEl,
    totalMinutes,
    stepMinutes: computed(() => props.resizeStepMinutes),
    onCommit: (payload) => emit('update:selection', { start: payload.start, end: payload.end }),
  });

/** The selection as drawn: the live drag while a handle is held, else the prop. */
const liveSelection = computed<CalendarSelection | null>(() => {
  const proposed = props.selection;
  if (!proposed) return null;
  return selectionPreview(SELECTION_ID) ?? proposed;
});

/**
 * The box for one day column, as a list of nought or one.
 *
 * A list because the template then needs no non-null assertion: `v-for` over
 * nothing draws nothing. Calling a function that may return null three times in
 * one element's bindings is the alternative, and it reads worse every time.
 */
function selectionFor(day: Date): SelectionBox[] {
  const proposed = liveSelection.value;
  if (!proposed) return [];
  const box = selectionBox(proposed, day, props.startHour, totalMinutes.value);
  return box ? [box] : [];
}

function onSelectionHandle(payload: { edge: SelectionEdge; event: PointerEvent }): void {
  const proposed = props.selection;
  if (!proposed) return;
  onSelectionPointerDown(payload.event, selectionAsEvent(proposed), payload.edge);
}

function onSelectionStep(payload: { edge: SelectionEdge; direction: -1 | 1 }): void {
  const proposed = props.selection;
  if (!proposed) return;
  nudgeSelection(
    selectionAsEvent(proposed),
    payload.edge,
    payload.direction * props.resizeStepMinutes,
  );
}

/** Keyboard equivalents of drag and resize, per UX spec §14. */
function onEventKeydown(e: KeyboardEvent, event: CalendarEvent) {
  const step = props.resizeStepMinutes;
  if (e.shiftKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    e.preventDefault();
    nudge(event, 'end', e.key === 'ArrowDown' ? step : -step);
  } else if (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    e.preventDefault();
    const delta = (e.key === 'ArrowDown' ? step : -step) * 60_000;
    emit('eventDrop', {
      event,
      resourceId: event.resourceId ?? '',
      start: new Date(event.start.getTime() + delta),
      end: new Date(event.end.getTime() + delta),
    });
  } else if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.preventDefault();
    const delta = (e.key === 'ArrowRight' ? 1 : -1) * 86_400_000;
    emit('eventDrop', {
      event,
      resourceId: event.resourceId ?? '',
      start: new Date(event.start.getTime() + delta),
      end: new Date(event.end.getTime() + delta),
    });
  }
}

/** Event y/height + x/width relative to its day-column. Lane info comes
 *  from the lane-packer; overnight cross-midnight events get their end
 *  bumped by +24h so height stays positive. The reference frame is
 *  minutes-since-(date-midnight + startHour), so a 22:00–02:00 booking
 *  with startHour=18, endHour=26 lays out cleanly. */
function eventStyleGrid(event: CalendarEvent, date: Date, lane: number, laneCount: number) {
  const { start, end } = range(event);
  const mid = new Date(date);
  mid.setHours(0, 0, 0, 0);
  const startMs = mid.getTime() + props.startHour * 60 * 60_000;
  const evStartMin = (start.getTime() - startMs) / 60_000;
  let evEndMin = (end.getTime() - startMs) / 60_000;
  if (evEndMin <= evStartMin) evEndMin += 24 * 60;  // overnight safety
  const top = (evStartMin / totalMinutes.value) * 100;
  const height = ((evEndMin - evStartMin) / totalMinutes.value) * 100;
  const widthPct = 100 / Math.max(1, laneCount);
  const leftPct = widthPct * lane;
  return {
    top: `${top}%`,
    height: `${height}%`,
    left: `${leftPct}%`,
    width: `${widthPct}%`,
  };
}

function clusterStyleGrid(item: { bucketStart: Date; bucketEnd: Date }, date: Date) {
  const mid = new Date(date);
  mid.setHours(0, 0, 0, 0);
  const startMs = mid.getTime() + props.startHour * 60 * 60_000;
  const s = (item.bucketStart.getTime() - startMs) / 60_000;
  let e = (item.bucketEnd.getTime() - startMs) / 60_000;
  if (e <= s) e += 24 * 60;
  const top = (s / totalMinutes.value) * 100;
  const height = ((e - s) / totalMinutes.value) * 100;
  return { top: `${top}%`, height: `${height}%`, left: '0%', width: '100%' };
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function timeLabel(event: CalendarEvent): string {
  const { start, end } = range(event);
  return `${formatTime(start)} - ${formatTime(end)}`;
}

// ── Keyboard navigation over the hour cells ──
// Only whole-hour cells are focusable (24 per column at most, not 96); arrow
// keys move an hour or a day, Enter/Space picks the day. Roving tabindex, so
// the grid is a single tab stop. Every day index is clamped to the visible
// window, so the arrows cannot walk onto a column that is not drawn.

const activeCell = ref<{ day: number; hour: number }>({ day: 0, hour: 0 });
const cellEls = ref<Record<string, HTMLElement>>({});

function cellKey(day: number, hour: number) {
  return `${day}:${hour}`;
}

function setCellEl(el: Element | null, day: number, hour: number) {
  if (el instanceof HTMLElement) cellEls.value[cellKey(day, hour)] = el;
}

const hourCount = computed(() => props.endHour - props.startHour);

async function moveCell(day: number, hour: number) {
  const d = clampDayIndex(day, dayCount.value);
  const h = Math.min(hourCount.value - 1, Math.max(0, hour));
  activeCell.value = { day: d, hour: h };
  await nextTick();
  cellEls.value[cellKey(d, h)]?.focus();
}

function onCellKeydown(e: KeyboardEvent, day: number, hour: number) {
  switch (e.key) {
    case 'ArrowRight': e.preventDefault(); void moveCell(day + 1, hour); break;
    case 'ArrowLeft': e.preventDefault(); void moveCell(day - 1, hour); break;
    case 'ArrowDown': e.preventDefault(); void moveCell(day, hour + 1); break;
    case 'ArrowUp': e.preventDefault(); void moveCell(day, hour - 1); break;
    case 'Home': e.preventDefault(); void moveCell(0, hour); break;
    case 'End': e.preventDefault(); void moveCell(dayCount.value - 1, hour); break;
    case 'PageDown': e.preventDefault(); void moveCell(day, hour + 6); break;
    case 'PageUp': e.preventDefault(); void moveCell(day, hour - 6); break;
    case 'Enter':
    case ' ': {
      e.preventDefault();
      const target = weekDays.value[day];
      // The keyboard grid steps by the HOUR, so its cell is the hour's first
      // slot: `hour` here is an offset from `startHour` and four rows make one.
      if (target) emitSlotClick(target.date, hour * (60 / SLOT_MINUTES));
      break;
    }
    default: break;
  }
}

// A narrowing window can strand the roving tabindex on a column that is no
// longer drawn, and then no cell carries tabindex 0 and the grid drops out of
// the tab order entirely. Re-clamp whenever the window changes.
watch(dayCount, (count) => {
  activeCell.value = { ...activeCell.value, day: clampDayIndex(activeCell.value.day, count) };
});

function isActiveCell(day: number, slotIndex: number): boolean {
  const slot = slots.value[slotIndex];
  if (!slot || slot.minute !== 0) return false;
  return activeCell.value.day === day && activeCell.value.hour === slot.hour - props.startHour;
}

/**
 * A tap on a time cell: the DAY of the column and the QUARTER HOUR of the row.
 *
 * The end is one slot on, which is what the day grid has always reported. It is
 * a floor, not a proposal about how long the thing should be — a host that wants
 * an hour says so, and only the host knows.
 */
function emitSlotClick(day: Date, slotIndex: number): void {
  const slot = slots.value[slotIndex];
  if (!slot) return;
  const start = new Date(day);
  start.setHours(slot.hour, slot.minute, 0, 0);
  const end = new Date(start.getTime() + SLOT_MINUTES * 60_000);
  // Week columns are days, not resources: there is no resource to report, and
  // an empty string is what the other grids send for an event that has none.
  emit('slotClick', { resourceId: '', start, end });
}

function cellAriaLabel(day: number, slotIndex: number): string {
  const slot = slots.value[slotIndex];
  const target = weekDays.value[day];
  if (!slot || !target) return '';
  return `${target.date.toLocaleDateString(props.locale, { weekday: 'long', day: 'numeric', month: 'long' })} ${slot.label}`;
}

// ── Sizing ──

const gridCfg = computed(() => {
  if (props.size === 'touch') {
    return {
      timeColWidth: '60px',
      headerHeight: '60px',
      dayNameFont: 'text-xs font-medium uppercase tracking-wider',
      dayNumFont: 'text-lg font-bold',
      dayNumSize: 'w-10 h-10',
      timeFont: 'text-xs',
      eventSize: 'sm' as const,
      bandSize: 'touch' as const,
    };
  }
  return {
    timeColWidth: '52px',
    headerHeight: '52px',
    dayNameFont: 'text-[10px] font-medium uppercase tracking-wider',
    dayNumFont: 'text-sm font-bold',
    dayNumSize: 'w-7 h-7',
    timeFont: 'text-[10px]',
    eventSize: 'sm' as const,
    bandSize: 'md' as const,
  };
});

/** Day headers, all-day band, time body and the events overlay all read this
 *  one template. A band that disagrees with the body by a column is exactly
 *  how a narrower window goes wrong. */
const colTemplate = computed(
  () => gutterColumnTemplate(gridCfg.value.timeColWidth, dayCount.value),
);

/** The compact (sm) layout has no time gutter, so it gets its own template. */
const compactColTemplate = computed(() => dayColumnTemplate(dayCount.value));

/**
 * The template INSIDE each column region — the strip that spans `2 / -1` of a
 * gutter row and holds every day column, so a page turn can move and clip them
 * as one thing. At rest its columns are exactly `colTemplate`'s day columns;
 * paged, it is that plus a step's worth either side, and the strip's own width
 * (`strip.style`) grows to match so a column stays the same width on screen.
 */
const regionTemplate = computed(() => strip.value.template);

/** The body's rows. Declared on the outer grid AND on the region, so the two
 *  are the same height whichever one the browser sizes first. */
const rowTemplate = computed(() => `repeat(${slots.value.length}, ${slotPx.value}px)`);
</script>

<template>
  <!-- ════ COMPACT (sm): stacked card list per day ════ -->
  <div
    v-if="isCompact"
    class="flex flex-col h-full border border-sd-border rounded-sd-md bg-white overflow-hidden"
  >
    <!-- Day headers -->
    <div
      class="grid shrink-0 border-b border-sd-border"
      :style="{ gridTemplateColumns: compactColTemplate }"
    >
      <div
        v-for="day in weekDays"
        :key="day.dayNum"
        class="flex flex-col items-center justify-center border-r border-sd-border last:border-r-0 h-[52px]"
        :class="day.isWeekend ? 'bg-sd-bg-alt/50' : ''"
      >
        <span
          class="text-sd-text-muted text-[10px] font-medium uppercase tracking-wider"
          :class="day.isToday ? 'text-sd-orange' : ''"
        >{{ day.dayName }}</span>
        <span
          class="flex items-center justify-center rounded-full mt-0.5 text-sm font-bold w-7 h-7"
          :class="day.isToday ? 'bg-sd-orange text-white' : 'text-sd-text'"
        >{{ day.dayNum }}</span>
      </div>
    </div>

    <!-- Stacked event cards -->
    <div
      class="grid flex-1 min-h-0 overflow-y-auto"
      :style="{ gridTemplateColumns: compactColTemplate }"
    >
      <div
        v-for="day in weekDays"
        :key="'col-' + day.dayNum"
        class="border-r border-sd-border last:border-r-0 flex flex-col cursor-pointer p-1 gap-1"
        :class="day.isWeekend ? 'bg-sd-bg-alt/30' : ''"
        @click.self="emit('dayClick', day.date)"
      >
        <SdCalendarEvent
          v-for="event in eventsForDay(day.date)"
          :key="event.id"
          :title="event.title"
          :subtitle="event.subtitle"
          :time-label="`${formatTime(event.start)} - ${formatTime(event.end)}`"
          :status="event.status ?? 'confirmed'"
          :color="event.color"
          size="sm"
          @click.stop="emit('eventClick', event)"
        />
      </div>
    </div>
  </div>

  <!-- ════ GRID (md/touch): time axis + `visibleDays` day columns ════ -->
  <div
    v-else
    ref="scrollEl"
    class="h-full border border-sd-border rounded-sd-md bg-white overflow-y-auto relative"
  >
    <!-- Sticky day headers.

         The gutter cell holds still and the day names travel with their
         columns: `Mo 11` IS the day, and a header that stayed behind while its
         column left would be naming the wrong one. -->
    <div
      class="grid sticky top-0 z-20 bg-white border-b border-sd-border"
      :style="{ gridTemplateColumns: colTemplate }"
    >
      <div
        class="border-r border-sd-border"
        :style="{ height: gridCfg.headerHeight, gridColumn: '1' }"
      />
      <!-- The clip is on the STATIONARY box and the strip inside it: a box that
           clips to its own transformed bounds clips nothing, and the travelling
           days would paint straight over the gutter. -->
      <div
        class="overflow-clip min-w-0"
        :style="{ gridColumn: '2 / -1' }"
      >
        <div
          class="grid h-full"
          :style="[{ gridTemplateColumns: regionTemplate }, strip.style ?? {}]"
        >
          <div
            v-for="day in stripDays"
            :key="'hdr-' + day.date.getTime()"
            class="flex flex-col items-center justify-center border-r border-sd-border last:border-r-0"
            :class="day.isWeekend ? 'bg-sd-bg-alt/50' : ''"
            :style="{ height: gridCfg.headerHeight }"
            :aria-hidden="day.inWindow ? undefined : 'true'"
          >
            <span
              class="text-sd-text-muted"
              :class="[gridCfg.dayNameFont, day.isToday ? 'text-sd-orange' : '']"
            >{{ day.dayName }}</span>
            <span
              class="flex items-center justify-center rounded-full mt-0.5"
              :class="[
                gridCfg.dayNumFont,
                gridCfg.dayNumSize,
                day.isToday ? 'bg-sd-orange text-white' : 'text-sd-text',
              ]"
            >{{ day.dayNum }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Pinned all-day band. Renders nothing at all unless at least one event
         carries allDay, so a caller that never sets it is unaffected. -->
    <div
      class="sticky z-20"
      :style="{ top: gridCfg.headerHeight }"
    >
      <SdCalendarAllDayBand
        :columns="bandColumns"
        :events="events"
        :column-template="colTemplate"
        :strip="strip"
        :label="allDayLabel"
        :size="gridCfg.bandSize"
        @event-click="(e) => emit('eventClick', e)"
        @column-click="(c) => emit('allDayClick', c.start)"
      />
    </div>

    <!-- Time grid body -->
    <div
      ref="bodyEl"
      class="relative"
      role="grid"
      :aria-label="ariaLabel"
    >
      <div
        class="grid"
        :style="{
          gridTemplateColumns: colTemplate,
          gridTemplateRows: rowTemplate,
        }"
      >
        <!-- The hour axis, now ONE grid item spanning every row instead of one
             per slot. It is the part that holds still while the days travel,
             and a thing that holds still is easier to be sure of when it is a
             single box than when it is ninety-six of them. -->
        <div
          class="grid border-r border-sd-border"
          :style="{ gridColumn: '1', gridRow: '1 / -1', gridTemplateRows: rowTemplate }"
        >
          <!-- Time label. Sits at top-0 (not -top-2) so the very first
               hour doesn't get clipped by the sticky day-name header
               above. Slightly larger right-margin keeps labels off the
               grid lines. -->
          <div
            v-for="slot in slots"
            :key="`t-${slot.hour}-${slot.minute}`"
            class="flex items-start justify-end pr-2 select-none relative"
            :class="gridCfg.timeFont + ' text-sd-text-muted'"
          >
            <span
              v-if="slot.minute === 0"
              class="absolute top-0 right-2"
            >{{ slot.label }}</span>
          </div>
        </div>

        <!-- The day columns, clipped to their own region so a page turn cannot
             paint across the hour axis. -->
        <div
          class="overflow-clip min-w-0"
          :style="{ gridColumn: '2 / -1', gridRow: '1 / -1' }"
        >
          <div
            class="grid h-full"
            :style="[
              { gridTemplateColumns: regionTemplate, gridTemplateRows: rowTemplate },
              strip.style ?? {},
            ]"
          >
            <template
              v-for="(slot, si) in slots"
              :key="`${slot.hour}-${slot.minute}`"
            >
              <!-- Day cells. Whole-hour cells of the VISIBLE window are the
                   keyboard grid: roving tabindex, arrows move by an hour or a
                   day, Enter picks. The lead and trail columns carry none of
                   that -- they are painted, not offered.

                   `data-sd-day-cell` is a hook for the host, the same contract
                   `data-sd-resize-handle` is: it marks every drawn column
                   including the ones outside the window, which is the only way
                   to check from outside that the strip really is continuous. -->
              <div
                v-for="(day, di) in stripDays"
                :key="`${di}-${si}`"
                :ref="(el) => slot.minute === 0 && day.inWindow && setCellEl(el as Element | null, day.windowIndex, slot.hour - startHour)"
                data-sd-day-cell
                class="border-r border-sd-border last:border-r-0 cursor-pointer transition-colors hover:bg-sd-purple-subtle/30"
                :class="[
                  slot.minute === 0 ? 'border-t border-t-sd-border' : (slot.minute === 30 ? 'border-t border-t-sd-border/30' : ''),
                  slot.minute === 0 && day.inWindow ? 'sd-focus-ring-always' : '',
                  day.isWeekend ? 'bg-sd-bg-alt/20' : '',
                ]"
                :role="slot.minute === 0 && day.inWindow ? 'gridcell' : undefined"
                :tabindex="slot.minute === 0 && day.inWindow ? (isActiveCell(day.windowIndex, si) ? 0 : -1) : undefined"
                :aria-label="slot.minute === 0 && day.inWindow ? cellAriaLabel(day.windowIndex, si) : undefined"
                @click="day.inWindow && emitSlotClick(day.date, si)"
                @keydown="slot.minute === 0 && day.inWindow && onCellKeydown($event, day.windowIndex, slot.hour - startHour)"
                @dragover="onSlotDragOver"
                @drop="onWeekSlotDrop(day.date, si)"
              />
            </template>
          </div>
        </div>
      </div>

      <!-- Events overlay -->
      <div
        class="absolute inset-0 grid pointer-events-none"
        :style="{ gridTemplateColumns: colTemplate }"
      >
        <!-- Skip time column -->
        <div :style="{ gridColumn: '1' }" />

        <div
          class="overflow-clip min-w-0"
          :style="{ gridColumn: '2 / -1' }"
        >
          <div
            class="grid h-full"
            :style="[{ gridTemplateColumns: regionTemplate }, strip.style ?? {}]"
          >
            <!-- One overlay per day. Events are lane-packed into sub-columns
                 (1–4 concurrent); 5+ concurrent collapse into a cluster
                 block with a count badge — tap emits clusterClick.

                 The lead and trail columns are `inert`: their events are real
                 and drawn, but they are off screen, and a tab stop you cannot
                 see is worse than one that is not there. `inert` rather than
                 `aria-hidden` because SdCalendarEvent is `tabindex="0"` and
                 hiding a focusable thing from the accessibility tree while
                 leaving it focusable is the one combination that is wrong. -->
            <div
              v-for="day in stripDays"
              :key="'ov-' + day.date.getTime()"
              class="relative"
              :inert="day.inWindow ? undefined : true"
            >
              <!-- The proposed range. Inside the day column, so it travels
                   with the strip like everything else that belongs to a day,
                   and above the events, because it is what the user is
                   currently pointing at. -->
              <SdCalendarSelection
                v-for="(box, bi) in (day.inWindow ? selectionFor(day.date) : [])"
                :key="'sel-' + bi"
                :top="box.top"
                :height="box.height"
                :label="selectionLabels.range ?? ''"
                :start-handle-label="selectionLabels.startHandle ?? 'Start'"
                :end-handle-label="selectionLabels.endHandle ?? 'End'"
                @handle-down="onSelectionHandle"
                @handle-step="onSelectionStep"
              />
              <template
                v-for="(item, idx) in itemsForDay(day.date)"
                :key="idx"
              >
                <div
                  v-if="item.kind === 'event'"
                  class="absolute pointer-events-auto z-10 px-0.5 group/ev"
                  :class="isResizing(item.event.id) ? 'z-20' : ''"
                  :style="eventStyleGrid(item.event, day.date, item.lane, item.laneCount)"
                  @keydown="onEventKeydown($event, item.event)"
                >
                  <SdCalendarEvent
                    :title="item.event.title"
                    :subtitle="item.event.subtitle"
                    :time-label="timeLabel(item.event)"
                    :status="item.event.status ?? 'confirmed'"
                    :color="item.event.color"
                    :size="gridCfg.eventSize"
                    :draggable="draggable"
                    class="h-full"
                    @click="emit('eventClick', item.event)"
                    @dragstart="(e) => onEventDragStart(item.event, e)"
                    @dragend="onEventDragEnd"
                  />
                  <!-- Resize handles. Absent unless `resizable`, so existing
                       callers get byte-identical markup.

                       `data-sd-resize-handle` is a hook for the HOST, not for
                       anything in here. A host that puts its own swipe gesture
                       on the grid (SaniMail pages the calendar by swiping it)
                       has to be able to tell "a finger on the glass" from "a
                       finger on a resize handle", and the alternative was for
                       it to match on `.cursor-ns-resize`, i.e. on a Tailwind
                       class that is a styling detail and would take somebody's
                       appointment with it the day it changed. -->
                  <template v-if="resizable">
                    <div
                      class="absolute left-0.5 right-0.5 top-0 h-2 cursor-ns-resize touch-none
                             opacity-0 group-hover/ev:opacity-100 focus-within:opacity-100 transition-opacity"
                      data-sd-resize-handle
                      @pointerdown="onHandlePointerDown($event, item.event, 'start')"
                      @dragstart.prevent
                    >
                      <div class="mx-auto mt-0.5 h-1 w-6 rounded-full bg-sd-text/40" />
                    </div>
                    <div
                      class="absolute left-0.5 right-0.5 bottom-0 h-2 cursor-ns-resize touch-none
                             opacity-0 group-hover/ev:opacity-100 focus-within:opacity-100 transition-opacity"
                      data-sd-resize-handle
                      @pointerdown="onHandlePointerDown($event, item.event, 'end')"
                      @dragstart.prevent
                    >
                      <div class="mx-auto mt-0.5 h-1 w-6 rounded-full bg-sd-text/40" />
                    </div>
                  </template>
                </div>
                <button
                  v-else
                  type="button"
                  class="sd-focus-ring absolute pointer-events-auto z-10 left-0.5 right-0.5 rounded-md bg-sd-orange/15 border border-sd-orange/40 text-sd-orange flex items-center justify-center gap-1.5 cursor-pointer hover:bg-sd-orange/25 transition-colors"
                  :style="clusterStyleGrid(item, day.date)"
                  @click="emit('clusterClick', { events: item.events, bucketStart: item.bucketStart, bucketEnd: item.bucketEnd })"
                >
                  <span class="font-bold text-sm">{{ item.events.length }}</span>
                  <span class="text-[10px] uppercase tracking-wide font-semibold">Reservierungen</span>
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Now line.

           IT TRAVELS WITH THE DAYS, and it lives in the column region for the
           same reason the day headers do: it does not say what time it is, it
           says where NOW falls in TODAY's column, and it is drawn at all only
           when today is one of the columns. Left in the gutter it would hang
           over a week it does not belong to, and it would have to blink out of
           existence mid-turn whenever the next period has no today in it.

           Which is also why it no longer strikes through the hour labels: the
           marker is on the day axis, so it starts where the day axis does.

           On the strip it spans the WINDOW's columns, not the whole strip: the
           lead and trail days belong to a period that is not the one being
           looked at, and a line drawn across them would say now is in all of
           them. It is a grid over the strip, so it travels with it. -->
      <div
        v-if="showNowLine && isTodayInWeek && nowLinePosition !== null"
        class="absolute left-0 right-0 z-30 pointer-events-none grid"
        :style="{ top: `${nowLinePosition}%`, gridTemplateColumns: colTemplate }"
      >
        <div :style="{ gridColumn: '1' }" />
        <!-- `h-2` because the strip carries `height: 100%` and this row's own
             height would otherwise be whatever the dot made it, measured from a
             box that is sizing itself from the dot. Eight px IS the dot. -->
        <div
          class="overflow-clip min-w-0 h-2"
          :style="{ gridColumn: '2 / -1' }"
        >
          <div
            class="grid h-full"
            :style="[{ gridTemplateColumns: regionTemplate }, strip.style ?? {}]"
          >
            <div
              class="flex items-center"
              :style="{ gridColumn: `${strip.lead + 1} / span ${dayCount}` }"
            >
              <div class="w-2 h-2 rounded-full bg-sd-error shrink-0" />
              <div class="flex-1 h-[2px] bg-sd-error" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
