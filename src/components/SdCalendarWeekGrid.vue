<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { CalendarEvent, CalendarResizePayload } from './calendar/types';
import SdCalendarEvent from './SdCalendarEvent.vue';
import SdCalendarAllDayBand from './SdCalendarAllDayBand.vue';
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
  rangeDates,
} from './calendar/day-range';

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
});

const emit = defineEmits<{
  dayClick: [date: Date];
  eventClick: [event: CalendarEvent];
  eventDrop: [payload: { event: CalendarEvent; resourceId: string; start: Date; end: Date }];
  eventResize: [payload: CalendarResizePayload];
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

const weekDays = computed(() => {
  const today = new Date();
  return rangeDates(props.date, dayCount.value, props.weekStartsOn).map((current) => ({
    date: current,
    dayName: current.toLocaleDateString(props.locale, { weekday: 'short' }),
    dayNum: current.getDate(),
    isToday:
      current.getFullYear() === today.getFullYear() &&
      current.getMonth() === today.getMonth() &&
      current.getDate() === today.getDate(),
    isWeekend: current.getDay() === 0 || current.getDay() === 6,
  }));
});

// ── Time slots (for grid mode) ──

const slots = computed(() => {
  const result: { hour: number; minute: number; label: string }[] = [];
  for (let h = props.startHour; h < props.endHour; h++) {
    for (let m = 0; m < 60; m += 15) {
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

const bandColumns = computed<AllDayColumn[]>(() =>
  weekDays.value.map((d) => {
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
  for (const day of weekDays.value) {
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
      if (target) emit('dayClick', target.date);
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
    <!-- Sticky day headers -->
    <div
      class="grid sticky top-0 z-20 bg-white border-b border-sd-border"
      :style="{ gridTemplateColumns: colTemplate }"
    >
      <div
        class="border-r border-sd-border"
        :style="{ height: gridCfg.headerHeight }"
      />
      <div
        v-for="day in weekDays"
        :key="'hdr-' + day.dayNum"
        class="flex flex-col items-center justify-center border-r border-sd-border last:border-r-0"
        :class="day.isWeekend ? 'bg-sd-bg-alt/50' : ''"
        :style="{ height: gridCfg.headerHeight }"
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
        :label="allDayLabel"
        :size="gridCfg.bandSize"
        @event-click="(e) => emit('eventClick', e)"
        @column-click="(c) => emit('dayClick', c.start)"
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
          gridTemplateRows: `repeat(${slots.length}, ${slotPx}px)`,
        }"
      >
        <template
          v-for="(slot, si) in slots"
          :key="`${slot.hour}-${slot.minute}`"
        >
          <!-- Time label. Sits at top-0 (not -top-2) so the very first
               hour doesn't get clipped by the sticky day-name header
               above. Slightly larger right-margin keeps labels off the
               grid lines. -->
          <div
            class="border-r border-sd-border flex items-start justify-end pr-2 select-none relative"
            :class="gridCfg.timeFont + ' text-sd-text-muted'"
          >
            <span
              v-if="slot.minute === 0"
              class="absolute top-0 right-2"
            >{{ slot.label }}</span>
          </div>

          <!-- Day cells. Whole-hour cells are the keyboard grid: roving
               tabindex, arrows move by an hour or a day, Enter picks. -->
          <div
            v-for="(day, di) in weekDays"
            :key="`${di}-${si}`"
            :ref="(el) => slot.minute === 0 && setCellEl(el as Element | null, di, slot.hour - startHour)"
            class="border-r border-sd-border last:border-r-0 cursor-pointer transition-colors hover:bg-sd-purple-subtle/30"
            :class="[
              slot.minute === 0 ? 'border-t border-t-sd-border sd-focus-ring-always' : (slot.minute === 30 ? 'border-t border-t-sd-border/30' : ''),
              day.isWeekend ? 'bg-sd-bg-alt/20' : '',
            ]"
            :role="slot.minute === 0 ? 'gridcell' : undefined"
            :tabindex="slot.minute === 0 ? (isActiveCell(di, si) ? 0 : -1) : undefined"
            :aria-label="slot.minute === 0 ? cellAriaLabel(di, si) : undefined"
            @click="emit('dayClick', day.date)"
            @keydown="slot.minute === 0 && onCellKeydown($event, di, slot.hour - startHour)"
            @dragover="onSlotDragOver"
            @drop="onWeekSlotDrop(day.date, si)"
          />
        </template>
      </div>

      <!-- Events overlay -->
      <div
        class="absolute inset-0 grid pointer-events-none"
        :style="{ gridTemplateColumns: colTemplate }"
      >
        <!-- Skip time column -->
        <div />

        <!-- One overlay per day. Events are lane-packed into sub-columns
             (1–4 concurrent); 5+ concurrent collapse into a cluster
             block with a count badge — tap emits clusterClick. -->
        <div
          v-for="day in weekDays"
          :key="'ov-' + day.dayNum"
          class="relative"
        >
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
                   callers get byte-identical markup. -->
              <template v-if="resizable">
                <div
                  class="absolute left-0.5 right-0.5 top-0 h-2 cursor-ns-resize touch-none
                         opacity-0 group-hover/ev:opacity-100 focus-within:opacity-100 transition-opacity"
                  @pointerdown="onHandlePointerDown($event, item.event, 'start')"
                  @dragstart.prevent
                >
                  <div class="mx-auto mt-0.5 h-1 w-6 rounded-full bg-sd-text/40" />
                </div>
                <div
                  class="absolute left-0.5 right-0.5 bottom-0 h-2 cursor-ns-resize touch-none
                         opacity-0 group-hover/ev:opacity-100 focus-within:opacity-100 transition-opacity"
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

      <!-- Now line -->
      <div
        v-if="showNowLine && isTodayInWeek && nowLinePosition !== null"
        class="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
        :style="{ top: `${nowLinePosition}%` }"
      >
        <div class="w-2 h-2 rounded-full bg-sd-error -ml-1 shrink-0" />
        <div class="flex-1 h-[2px] bg-sd-error" />
      </div>
    </div>
  </div>
</template>
