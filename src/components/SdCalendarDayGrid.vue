<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { CalendarEvent, CalendarResizePayload, CalendarResource } from './calendar/types';
import type { TimeAxisOrientation } from './calendar/types';
import SdCalendarEvent from './SdCalendarEvent.vue';
import SdCalendarAllDayBand from './SdCalendarAllDayBand.vue';
import { type LaidOutItem, packDayEvents } from './calendar/lane-packer';
import type { AllDayColumn } from './calendar/all-day-packer';
import { useGridResize } from './calendar/use-grid-resize';

export type DayGridSize = 'sm' | 'md' | 'touch';

export interface SdCalendarDayGridProps {
  /** Date to display */
  date: Date;
  /**
   * Resources — columns (vertical) or rows (horizontal).
   *
   * Optional. Leave it empty for a personal calendar: the grid then renders
   * a single unlabelled column carrying every event, regardless of whether
   * the events have a `resourceId` at all. Callers that pass resources see
   * exactly the behaviour they see today.
   */
  resources?: CalendarResource[];
  /** Events to display */
  events: CalendarEvent[];
  /** Start hour (0-23) */
  startHour?: number;
  /** End hour (0-23) */
  endHour?: number;
  /** Slot duration in minutes */
  slotDuration?: 15 | 30 | 60;
  /** Time axis direction: vertical (classic) or horizontal (Gantt-style) */
  orientation?: TimeAxisOrientation;
  /** Show the "now" line */
  showNowLine?: boolean;
  /** Component size */
  size?: DayGridSize;
  /** When true, events are draggable and slots become drop targets. */
  draggable?: boolean;
  /** When true, events grow resize handles and emit `eventResize`. */
  resizable?: boolean;
  /** Snap granularity for a resize, in minutes. */
  resizeStepMinutes?: number;
  /**
   * Scroll so this hour sits at the top. Only meaningful together with
   * `slotHeight`, since without it the grid stretches to fit instead of
   * scrolling.
   */
  scrollToHour?: number;
  /**
   * Fixed row height per slot, px. Default (undefined) keeps today's
   * stretch-to-fit behaviour, where the whole window is always visible.
   * Set it to make a wide window (00:00-24:00) scroll instead of squash.
   */
  slotHeight?: number;
  /** Intl locale for the accessible cell labels. */
  locale?: string;
  /** Gutter label of the all-day band. */
  allDayLabel?: string;
  /** Accessible name for the time grid. */
  ariaLabel?: string;
}

const props = withDefaults(defineProps<SdCalendarDayGridProps>(), {
  resources: () => [],
  startHour: 7,
  endHour: 22,
  slotDuration: 15,
  orientation: 'vertical',
  showNowLine: true,
  size: 'md',
  draggable: false,
  resizable: false,
  resizeStepMinutes: 15,
  locale: 'de-CH',
  allDayLabel: 'Ganztags',
  ariaLabel: 'Tagesansicht',
});

const emit = defineEmits<{
  slotClick: [payload: { resourceId: string; start: Date; end: Date }];
  eventClick: [event: CalendarEvent];
  eventDrop: [payload: { event: CalendarEvent; resourceId: string; start: Date; end: Date }];
  eventResize: [payload: CalendarResizePayload];
  clusterClick: [payload: { events: CalendarEvent[]; bucketStart: Date; bucketEnd: Date }];
}>();

// ── Resources ──
// A personal calendar has no resources. Rather than pushing a synthetic
// resource onto every caller, the grid falls back to one implicit column.
// `hasResources` is what the rest of the component branches on; the previous
// behaviour (an empty grid) was never useful to anybody.

const hasResources = computed(() => props.resources.length > 0);

const effectiveResources = computed<CalendarResource[]>(() =>
  hasResources.value ? props.resources : [{ id: '', label: '' }],
);

// Tracks which event is currently being dragged. The HTML5 dataTransfer
// payload is the event id; the lookup happens in props.events on drop.
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

function onSlotDrop(resourceId: string, slotIndex: number) {
  const id = draggingEventId.value;
  if (!id) return;
  const droppedEvent = props.events.find((e) => e.id === id);
  if (!droppedEvent) return;
  const slot = slots.value[slotIndex];
  if (!slot) return;
  const newStart = new Date(props.date);
  newStart.setHours(slot.hour, slot.minute, 0, 0);
  // Preserve the original duration on drop.
  const durationMs = droppedEvent.end.getTime() - droppedEvent.start.getTime();
  const newEnd = new Date(newStart.getTime() + durationMs);
  emit('eventDrop', { event: droppedEvent, resourceId, start: newStart, end: newEnd });
  draggingEventId.value = null;
}

const isHorizontal = computed(() => props.orientation === 'horizontal');

// ── Sizing ──

const sizeConfig: Record<DayGridSize, {
  timeColWidth: string;
  resourceMinWidth: string;
  resourceRowHeight: string;
  headerHeight: string;
  timeHeaderHeight: string;
  timeFont: string;
  headerFont: string;
  headerSubFont: string;
  eventSize: 'sm' | 'md' | 'touch';
}> = {
  sm: {
    timeColWidth: '52px',
    resourceMinWidth: '120px',
    resourceRowHeight: '48px',
    headerHeight: '40px',
    timeHeaderHeight: '32px',
    timeFont: 'text-[10px]',
    headerFont: 'text-xs font-semibold',
    headerSubFont: 'text-[10px]',
    eventSize: 'sm',
  },
  md: {
    timeColWidth: '64px',
    resourceMinWidth: '160px',
    resourceRowHeight: '64px',
    headerHeight: '52px',
    timeHeaderHeight: '36px',
    timeFont: 'text-[11px]',
    headerFont: 'text-sm font-semibold',
    headerSubFont: 'text-[11px]',
    eventSize: 'md',
  },
  touch: {
    timeColWidth: '72px',
    resourceMinWidth: '180px',
    resourceRowHeight: '80px',
    headerHeight: '60px',
    timeHeaderHeight: '44px',
    timeFont: 'text-xs',
    headerFont: 'text-base font-semibold',
    headerSubFont: 'text-xs',
    eventSize: 'touch',
  },
};

const cfg = computed(() => sizeConfig[props.size]);

// Vertical: time col + resource columns
const vColTemplate = computed(
  () => `${cfg.value.timeColWidth} repeat(${effectiveResources.value.length}, minmax(${cfg.value.resourceMinWidth}, 1fr))`,
);

// Horizontal body: resource label + fine slot columns
const hColTemplate = computed(
  () => `${cfg.value.resourceMinWidth} repeat(${slots.value.length}, 1fr)`,
);

// Horizontal header: resource label + one column per hour
const hHeaderColTemplate = computed(
  () => `${cfg.value.resourceMinWidth} repeat(${hours.value.length}, 1fr)`,
);

// ── Time slots ──

const slots = computed(() => {
  const result: { hour: number; minute: number; label: string }[] = [];
  for (let h = props.startHour; h < props.endHour; h++) {
    for (let m = 0; m < 60; m += props.slotDuration) {
      // Overnight: endHour can exceed 24. Label wraps mod 24 so an
      // hour=25 reads as "01:00" while the grid coordinate keeps
      // counting up linearly.
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

// Hours only (for horizontal header)
const hours = computed(() => {
  const result: string[] = [];
  for (let h = props.startHour; h < props.endHour; h++) {
    const displayH = ((h % 24) + 24) % 24;
    result.push(`${String(displayH).padStart(2, '0')}:00`);
  }
  return result;
});

const totalMinutes = computed(() => (props.endHour - props.startHour) * 60);

/** Slot rows are `1fr` (stretch to fit) unless the caller pins a height. */
const slotRowTemplate = computed(() =>
  props.slotHeight ? `repeat(${slots.value.length}, ${props.slotHeight}px)` : `repeat(${slots.value.length}, 1fr)`,
);

// ── All-day band ──
// Columns are resources when there are resources (a whole-day booking belongs
// to one table, not to the day), and a single day column otherwise. Spanning
// is therefore off in the resource case, which the packer handles.

const timedEvents = computed(() => props.events.filter((e) => !e.allDay));

const bandColumns = computed<AllDayColumn[]>(() => {
  const dayStart = new Date(props.date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  if (!hasResources.value) {
    return [{ key: 'day', start: dayStart, end: dayEnd }];
  }
  return props.resources.map((r) => ({
    key: r.id,
    start: dayStart,
    end: dayEnd,
    resourceId: r.id,
  }));
});

// ── Scroll position ──

const scrollEl = ref<HTMLElement | null>(null);

function applyScrollToHour() {
  const h = props.scrollToHour;
  if (h === undefined || !scrollEl.value || !props.slotHeight) return;
  const slotsPerHour = 60 / props.slotDuration;
  scrollEl.value.scrollTop = Math.max(0, (h - props.startHour) * slotsPerHour * props.slotHeight);
}

watch(() => [props.scrollToHour, props.startHour, props.slotHeight], () => void nextTick(applyScrollToHour));

// ── Now line ──

const nowMinutes = ref(0);
let nowTimer: ReturnType<typeof setInterval> | null = null;

function updateNow() {
  const now = new Date();
  nowMinutes.value = now.getHours() * 60 + now.getMinutes();
}

onMounted(() => {
  updateNow();
  nowTimer = setInterval(updateNow, 60_000);
  void nextTick(applyScrollToHour);
});

onUnmounted(() => {
  if (nowTimer) clearInterval(nowTimer);
});

const nowLinePosition = computed(() => {
  const startMin = props.startHour * 60;
  const endMin = props.endHour * 60;
  let now = nowMinutes.value;
  if (endMin > 1440 && now < startMin) now += 1440;
  if (now < startMin || now > endMin) return null;
  return ((now - startMin) / totalMinutes.value) * 100;
});

const isToday = computed(() => {
  const today = new Date();
  return (
    props.date.getFullYear() === today.getFullYear() &&
    props.date.getMonth() === today.getMonth() &&
    props.date.getDate() === today.getDate()
  );
});

// ── Event positioning ──

/** Day-window timestamps that honour endHour > 24 for overnight venues —
 *  an event starting at 01:30 on the next calendar day is still "today's
 *  service" if startHour=18, endHour=26 (close 02:00). */
function dayWindow(): { start: number; end: number } {
  const mid = new Date(props.date);
  mid.setHours(0, 0, 0, 0);
  const base = mid.getTime();
  return {
    start: base + props.startHour * 60 * 60_000,
    end: base + props.endHour * 60 * 60_000,
  };
}

function eventsForResource(resourceId: string) {
  const win = dayWindow();
  return timedEvents.value
    .filter((ev) => {
      // With no resources there is one implicit column that takes everything,
      // so an event without a resourceId is not silently dropped.
      if (hasResources.value && ev.resourceId !== resourceId) return false;
      return ev.start.getTime() >= win.start && ev.start.getTime() < win.end;
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

const laidOutByResource = computed<Map<string, LaidOutItem[]>>(() => {
  const out = new Map<string, LaidOutItem[]>();
  for (const r of effectiveResources.value) out.set(r.id, packDayEvents(eventsForResource(r.id)));
  return out;
});

function itemsForResource(resourceId: string): LaidOutItem[] {
  return laidOutByResource.value.get(resourceId) ?? [];
}

// ── Resize ──

const bodyEl = ref<HTMLElement | null>(null);

const { previewFor, isResizing, onHandlePointerDown, nudge } = useGridResize({
  axis: () => (props.orientation === 'horizontal' ? 'horizontal' : 'vertical'),
  container: bodyEl,
  totalMinutes,
  stepMinutes: computed(() => props.resizeStepMinutes),
  onCommit: (payload) => emit('eventResize', payload),
});

/** Start/end actually rendered — the live preview while dragging a handle. */
function range(event: CalendarEvent): { start: Date; end: Date } {
  return previewFor(event.id) ?? { start: event.start, end: event.end };
}

/** Keyboard equivalents of resize and move, per UX spec §14. */
function onEventKeydown(e: KeyboardEvent, event: CalendarEvent, resourceId: string) {
  const step = props.resizeStepMinutes;
  const along = props.orientation === 'horizontal'
    ? { grow: 'ArrowRight', shrink: 'ArrowLeft' }
    : { grow: 'ArrowDown', shrink: 'ArrowUp' };
  if (e.shiftKey && (e.key === along.grow || e.key === along.shrink)) {
    e.preventDefault();
    nudge(event, 'end', e.key === along.grow ? step : -step);
  } else if (e.altKey && (e.key === along.grow || e.key === along.shrink)) {
    e.preventDefault();
    const delta = (e.key === along.grow ? step : -step) * 60_000;
    emit('eventDrop', {
      event,
      resourceId,
      start: new Date(event.start.getTime() + delta),
      end: new Date(event.end.getTime() + delta),
    });
  }
}

function eventStyleVertical(event: CalendarEvent, lane: number, laneCount: number) {
  const mid = new Date(props.date);
  mid.setHours(0, 0, 0, 0);
  const startMs = mid.getTime() + props.startHour * 60 * 60_000;
  const { start: evStart, end: evEnd } = range(event);
  const evStartMin = (evStart.getTime() - startMs) / 60_000;
  let evEndMin = (evEnd.getTime() - startMs) / 60_000;
  if (evEndMin <= evStartMin) evEndMin += 24 * 60;
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

function eventStyleHorizontal(event: CalendarEvent, lane: number, laneCount: number) {
  const mid = new Date(props.date);
  mid.setHours(0, 0, 0, 0);
  const startMs = mid.getTime() + props.startHour * 60 * 60_000;
  const { start: evStart, end: evEnd } = range(event);
  const evStartMin = (evStart.getTime() - startMs) / 60_000;
  let evEndMin = (evEnd.getTime() - startMs) / 60_000;
  if (evEndMin <= evStartMin) evEndMin += 24 * 60;
  const left = (evStartMin / totalMinutes.value) * 100;
  const width = Math.max(((evEndMin - evStartMin) / totalMinutes.value) * 100, 4);
  const heightPct = 100 / Math.max(1, laneCount);
  const topPct = heightPct * lane;
  return {
    left: `${left}%`,
    width: `${width}%`,
    top: `${topPct}%`,
    height: `${heightPct}%`,
  };
}

function clusterStyleVertical(item: { bucketStart: Date; bucketEnd: Date }) {
  const mid = new Date(props.date);
  mid.setHours(0, 0, 0, 0);
  const startMs = mid.getTime() + props.startHour * 60 * 60_000;
  const s = (item.bucketStart.getTime() - startMs) / 60_000;
  let e = (item.bucketEnd.getTime() - startMs) / 60_000;
  if (e <= s) e += 24 * 60;
  const top = (s / totalMinutes.value) * 100;
  const height = ((e - s) / totalMinutes.value) * 100;
  return { top: `${top}%`, height: `${height}%`, left: '0%', width: '100%' };
}

function clusterStyleHorizontal(item: { bucketStart: Date; bucketEnd: Date }) {
  const mid = new Date(props.date);
  mid.setHours(0, 0, 0, 0);
  const startMs = mid.getTime() + props.startHour * 60 * 60_000;
  const s = (item.bucketStart.getTime() - startMs) / 60_000;
  let e = (item.bucketEnd.getTime() - startMs) / 60_000;
  if (e <= s) e += 24 * 60;
  const left = (s / totalMinutes.value) * 100;
  const width = Math.max(((e - s) / totalMinutes.value) * 100, 4);
  return { left: `${left}%`, width: `${width}%`, top: '0%', height: '100%' };
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function timeLabel(event: CalendarEvent): string {
  const { start, end } = range(event);
  return `${formatTime(start)} - ${formatTime(end)}`;
}

// ── Keyboard navigation over the whole-hour cells ──
// Roving tabindex: the grid is one tab stop, arrows move by an hour or a
// resource column, Enter creates in the focused slot.

const activeCell = ref<{ col: number; hour: number }>({ col: 0, hour: 0 });
const cellEls = ref<Record<string, HTMLElement>>({});
const slotsPerHour = computed(() => 60 / props.slotDuration);
const hourCount = computed(() => props.endHour - props.startHour);

function cellKey(col: number, hour: number) {
  return `${col}:${hour}`;
}

function setCellEl(el: Element | null, col: number, hour: number) {
  if (el instanceof HTMLElement) cellEls.value[cellKey(col, hour)] = el;
}

async function moveCell(col: number, hour: number) {
  const c = Math.min(effectiveResources.value.length - 1, Math.max(0, col));
  const h = Math.min(hourCount.value - 1, Math.max(0, hour));
  activeCell.value = { col: c, hour: h };
  await nextTick();
  cellEls.value[cellKey(c, h)]?.focus();
}

function isActiveCell(col: number, slotIndex: number): boolean {
  const slot = slots.value[slotIndex];
  if (!slot || slot.minute !== 0) return false;
  return activeCell.value.col === col && activeCell.value.hour === slot.hour - props.startHour;
}

function onCellKeydown(e: KeyboardEvent, col: number, slotIndex: number) {
  const slot = slots.value[slotIndex];
  if (!slot) return;
  const hour = slot.hour - props.startHour;
  // In horizontal (Gantt) orientation the time axis runs left-to-right, so
  // left/right must move through time and up/down through resources.
  const horizontal = props.orientation === 'horizontal';
  const timeBack = horizontal ? 'ArrowLeft' : 'ArrowUp';
  const timeFwd = horizontal ? 'ArrowRight' : 'ArrowDown';
  const colBack = horizontal ? 'ArrowUp' : 'ArrowLeft';
  const colFwd = horizontal ? 'ArrowDown' : 'ArrowRight';
  switch (e.key) {
    case timeFwd: e.preventDefault(); void moveCell(col, hour + 1); break;
    case timeBack: e.preventDefault(); void moveCell(col, hour - 1); break;
    case colFwd: e.preventDefault(); void moveCell(col + 1, hour); break;
    case colBack: e.preventDefault(); void moveCell(col - 1, hour); break;
    case 'Home': e.preventDefault(); void moveCell(col, 0); break;
    case 'End': e.preventDefault(); void moveCell(col, hourCount.value - 1); break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      onSlotClick(effectiveResources.value[col]?.id ?? '', slotIndex);
      break;
    default: break;
  }
}

function cellAriaLabel(col: number, slotIndex: number): string {
  const slot = slots.value[slotIndex];
  if (!slot) return '';
  const res = effectiveResources.value[col];
  const day = props.date.toLocaleDateString(props.locale, { weekday: 'long', day: 'numeric', month: 'long' });
  return res && res.label ? `${res.label}, ${day} ${slot.label}` : `${day} ${slot.label}`;
}

// ── Slot click ──

function onSlotClick(resourceId: string, slotIndex: number) {
  const slot = slots.value[slotIndex];
  const start = new Date(props.date);
  start.setHours(slot.hour, slot.minute, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + props.slotDuration);
  emit('slotClick', { resourceId, start, end });
}
</script>

<template>
  <!-- ════════════════════════════════════════════════ -->
  <!-- VERTICAL: time top-to-bottom, resources as cols -->
  <!--                                                  -->
  <!-- Single scroll container wraps header + body so   -->
  <!-- the y-scrollbar reduces BOTH widths equally,     -->
  <!-- keeping header columns aligned with body cols    -->
  <!-- even when the resource set overflows.            -->
  <!-- ════════════════════════════════════════════════ -->
  <div
    v-if="!isHorizontal"
    class="flex flex-col h-full border border-sd-border rounded-sd-md bg-white overflow-hidden"
  >
    <div
      ref="scrollEl"
      class="flex-1 min-h-0 overflow-y-auto flex flex-col"
    >
      <!-- Header (sticky inside the scroll container) -->
      <div
        class="grid sticky top-0 z-20 bg-white shrink-0 border-b border-sd-border"
        :style="{ gridTemplateColumns: vColTemplate }"
      >
        <div
          class="border-r border-sd-border"
          :style="{ height: cfg.headerHeight }"
        />
        <!-- With no resources there is one implicit column; the header cell
             carries the date instead of a resource name. -->
        <div
          v-if="!hasResources"
          class="border-r-0 flex flex-col justify-center px-3"
          :style="{ height: cfg.headerHeight }"
        >
          <div :class="[cfg.headerFont, 'text-sd-text truncate']">
            {{ date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }) }}
          </div>
        </div>
        <div
          v-for="resource in resources"
          v-else
          :key="resource.id"
          class="border-r border-sd-border last:border-r-0 flex flex-col justify-center px-3"
          :style="{ height: cfg.headerHeight }"
        >
          <div :class="[cfg.headerFont, 'text-sd-text truncate']">
            {{ resource.label }}
          </div>
          <div
            v-if="resource.subtitle"
            :class="[cfg.headerSubFont, 'text-sd-text-muted truncate']"
          >
            {{ resource.subtitle }}
          </div>
        </div>
      </div>

      <!-- Pinned all-day band. Renders nothing unless an event carries
           allDay, so existing callers see an unchanged layout. -->
      <div
        class="sticky z-20 shrink-0"
        :style="{ top: cfg.headerHeight }"
      >
        <SdCalendarAllDayBand
          :columns="bandColumns"
          :events="events"
          :column-template="vColTemplate"
          :label="allDayLabel"
          :size="size === 'touch' ? 'touch' : 'md'"
          @event-click="(e) => emit('eventClick', e)"
        />
      </div>

      <!-- Body.
           Without `slotHeight` the rows are `1fr`, so the body must be
           `flex-1` to give them a definite height to divide — that is the
           stretch-to-fit behaviour every existing caller relies on.
           With `slotHeight` the rows are fixed px and the body must size to
           its content instead, or the absolutely positioned events overlay
           (`inset-0`, percentage tops) would map onto the shorter flex box
           and every event would be drawn at the wrong time. -->
      <div
        ref="bodyEl"
        class="relative"
        :class="slotHeight ? 'shrink-0' : 'flex-1 min-h-0'"
        role="grid"
        :aria-label="ariaLabel"
      >
        <div
          class="grid"
          :class="slotHeight ? '' : 'h-full'"
          :style="{
            gridTemplateColumns: vColTemplate,
            gridTemplateRows: slotRowTemplate,
          }"
        >
          <template
            v-for="(slot, si) in slots"
            :key="`${slot.hour}-${slot.minute}`"
          >
            <div
              class="border-r border-sd-border flex items-start justify-end pr-2 select-none relative"
              :class="cfg.timeFont + ' text-sd-text-muted'"
            >
              <span
                v-if="slot.minute === 0"
                class="absolute top-0 right-2"
              >{{ slot.label }}</span>
            </div>
            <div
              v-for="(resource, ri) in effectiveResources"
              :key="`${resource.id}-${si}`"
              :ref="(el) => slot.minute === 0 && setCellEl(el as Element | null, ri, slot.hour - startHour)"
              class="border-r border-sd-border last:border-r-0 cursor-pointer transition-colors hover:bg-sd-purple-subtle/30"
              :class="slot.minute === 0 ? 'border-t border-t-sd-border sd-focus-ring-always' : 'border-t border-t-sd-border/40'"
              :role="slot.minute === 0 ? 'gridcell' : undefined"
              :tabindex="slot.minute === 0 ? (isActiveCell(ri, si) ? 0 : -1) : undefined"
              :aria-label="slot.minute === 0 ? cellAriaLabel(ri, si) : undefined"
              @click="onSlotClick(resource.id, si)"
              @keydown="slot.minute === 0 && onCellKeydown($event, ri, si)"
              @dragover="onSlotDragOver"
              @drop="onSlotDrop(resource.id, si)"
            />
          </template>
        </div>

        <!-- Events overlay — lane-packed (Tier A) for 1–4 concurrent,
           collapsed to a single cluster block (Tier B) for 5+. -->
        <div
          class="absolute inset-0 grid pointer-events-none"
          :style="{ gridTemplateColumns: vColTemplate }"
        >
          <div />
          <div
            v-for="resource in effectiveResources"
            :key="'ov-' + resource.id"
            class="relative"
          >
            <template
              v-for="(item, idx) in itemsForResource(resource.id)"
              :key="idx"
            >
              <div
                v-if="item.kind === 'event'"
                class="absolute pointer-events-auto z-10 px-0.5 group/ev"
                :class="isResizing(item.event.id) ? 'z-20' : ''"
                :style="eventStyleVertical(item.event, item.lane, item.laneCount)"
                @keydown="onEventKeydown($event, item.event, resource.id)"
              >
                <SdCalendarEvent
                  :title="item.event.title"
                  :subtitle="item.event.subtitle"
                  :time-label="timeLabel(item.event)"
                  :status="item.event.status ?? 'confirmed'"
                  :color="item.event.color"
                  :size="cfg.eventSize"
                  :draggable="draggable"
                  class="h-full"
                  @click="emit('eventClick', item.event)"
                  @dragstart="(e) => onEventDragStart(item.event, e)"
                  @dragend="onEventDragEnd"
                />
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
                class="absolute pointer-events-auto z-10 left-0.5 right-0.5 rounded-md bg-sd-orange/15 border border-sd-orange/40 text-sd-orange flex items-center justify-center gap-1.5 cursor-pointer hover:bg-sd-orange/25 transition-colors"
                :style="clusterStyleVertical(item)"
                @click="emit('clusterClick', { events: item.events, bucketStart: item.bucketStart, bucketEnd: item.bucketEnd })"
              >
                <span class="font-bold text-sm">{{ item.events.length }}</span>
                <span class="text-[10px] uppercase tracking-wide font-semibold">Reserv.</span>
              </button>
            </template>
          </div>
        </div>

        <!-- Now line (horizontal) -->
        <div
          v-if="showNowLine && isToday && nowLinePosition !== null"
          class="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
          :style="{ top: `${nowLinePosition}%` }"
        >
          <div class="w-2 h-2 rounded-full bg-sd-error -ml-1 shrink-0" />
          <div class="flex-1 h-[2px] bg-sd-error" />
        </div>
      </div>
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════ -->
  <!-- HORIZONTAL: time left-to-right, resources as rows   -->
  <!--                                                      -->
  <!-- Single scroll container wraps the hour header + the -->
  <!-- resource rows so the y-scrollbar (active when many   -->
  <!-- tables overflow vertically) reduces BOTH widths      -->
  <!-- equally — header hour columns then stay aligned with -->
  <!-- the in-row time lanes.                               -->
  <!-- ════════════════════════════════════════════════════ -->
  <div
    v-else
    class="flex flex-col h-full border border-sd-border rounded-sd-md bg-white overflow-hidden"
  >
    <div
      ref="scrollEl"
      class="flex-1 min-h-0 overflow-y-auto"
    >
      <!-- Hour header (one cell per hour, not per slot) -->
      <div
        class="grid sticky top-0 z-20 bg-white shrink-0 border-b border-sd-border"
        :style="{ gridTemplateColumns: hHeaderColTemplate }"
      >
        <div
          class="border-r border-sd-border relative z-10 bg-white"
          :style="{ height: cfg.timeHeaderHeight }"
        />
        <div
          v-for="(hour, hi) in hours"
          :key="`hhr-${hi}`"
          class="flex items-end pb-1 select-none"
          :class="[cfg.timeFont, 'text-sd-text-muted']"
          :style="{ height: cfg.timeHeaderHeight }"
        >
          <span
            v-if="hi > 0"
            class="-ml-3"
          >{{ hour }}</span>
          <span
            v-else
            class="pl-0.5"
          >{{ hour }}</span>
        </div>
      </div>

      <!-- Body: resource rows with fine slot grid lines.
         No overflow on this wrapper — the parent .overflow-y-auto owns
         scrolling so header + body stay column-aligned. -->
      <div
        ref="bodyEl"
        class="relative"
        role="grid"
        :aria-label="ariaLabel"
      >
        <!-- Resource rows -->
        <div
          v-for="(resource, ri) in effectiveResources"
          :key="resource.id"
          class="flex"
          :class="ri < effectiveResources.length - 1 ? 'border-b border-sd-border' : ''"
          :style="{ height: cfg.resourceRowHeight }"
        >
          <!-- Resource label (fixed width) -->
          <div
            class="shrink-0 border-r border-sd-border flex flex-col justify-center px-3"
            :style="{ width: cfg.resourceMinWidth }"
          >
            <div :class="[cfg.headerFont, 'text-sd-text truncate']">
              {{ resource.label }}
            </div>
            <div
              v-if="resource.subtitle"
              :class="[cfg.headerSubFont, 'text-sd-text-muted truncate']"
            >
              {{ resource.subtitle }}
            </div>
          </div>

          <!-- Time lane (relative for events) -->
          <div class="flex-1 relative">
            <!-- Hour grid lines (strong) and sub-hour lines (faint) -->
            <div class="absolute inset-0 flex">
              <div
                v-for="(slot, si) in slots"
                :key="`gl-${resource.id}-${si}`"
                :ref="(el) => slot.minute === 0 && setCellEl(el as Element | null, ri, slot.hour - startHour)"
                class="flex-1 cursor-pointer transition-colors hover:bg-sd-purple-subtle/30"
                :class="slot.minute === 0 ? 'border-l border-sd-border sd-focus-ring-always' : (slot.minute === 30 ? 'border-l border-sd-border/25' : '')"
                :role="slot.minute === 0 ? 'gridcell' : undefined"
                :tabindex="slot.minute === 0 ? (isActiveCell(ri, si) ? 0 : -1) : undefined"
                :aria-label="slot.minute === 0 ? cellAriaLabel(ri, si) : undefined"
                @click="onSlotClick(resource.id, si)"
                @keydown="slot.minute === 0 && onCellKeydown($event, ri, si)"
                @dragover="onSlotDragOver"
                @drop="onSlotDrop(resource.id, si)"
              />
            </div>

            <!-- Events — horizontal lane-packed (Tier A) / clustered (Tier B). -->
            <template
              v-for="(item, idx) in itemsForResource(resource.id)"
              :key="idx"
            >
              <div
                v-if="item.kind === 'event'"
                class="absolute pointer-events-auto z-10 py-0.5 group/ev"
                :class="isResizing(item.event.id) ? 'z-20' : ''"
                :style="eventStyleHorizontal(item.event, item.lane, item.laneCount)"
                @keydown="onEventKeydown($event, item.event, resource.id)"
              >
                <SdCalendarEvent
                  :title="item.event.title"
                  :subtitle="item.event.subtitle"
                  :time-label="timeLabel(item.event)"
                  :status="item.event.status ?? 'confirmed'"
                  :color="item.event.color"
                  :size="cfg.eventSize"
                  :draggable="draggable"
                  orientation="horizontal"
                  class="w-full h-full"
                  @click="emit('eventClick', item.event)"
                  @dragstart="(e) => onEventDragStart(item.event, e)"
                  @dragend="onEventDragEnd"
                />
                <!-- Left/right handles: in the Gantt orientation the time
                     axis runs horizontally, so the edges are the sides. -->
                <template v-if="resizable">
                  <div
                    class="absolute top-0.5 bottom-0.5 left-0 w-2 cursor-ew-resize touch-none
                           opacity-0 group-hover/ev:opacity-100 focus-within:opacity-100 transition-opacity"
                    data-sd-resize-handle
                    @pointerdown="onHandlePointerDown($event, item.event, 'start')"
                    @dragstart.prevent
                  >
                    <div class="my-auto ml-0.5 w-1 h-6 rounded-full bg-sd-text/40" />
                  </div>
                  <div
                    class="absolute top-0.5 bottom-0.5 right-0 w-2 cursor-ew-resize touch-none
                           opacity-0 group-hover/ev:opacity-100 focus-within:opacity-100 transition-opacity"
                    data-sd-resize-handle
                    @pointerdown="onHandlePointerDown($event, item.event, 'end')"
                    @dragstart.prevent
                  >
                    <div class="my-auto ml-0.5 w-1 h-6 rounded-full bg-sd-text/40" />
                  </div>
                </template>
              </div>
              <button
                v-else
                type="button"
                class="absolute pointer-events-auto z-10 top-0.5 bottom-0.5 rounded-md bg-sd-orange/15 border border-sd-orange/40 text-sd-orange flex items-center justify-center gap-1.5 cursor-pointer hover:bg-sd-orange/25 transition-colors"
                :style="clusterStyleHorizontal(item)"
                @click="emit('clusterClick', { events: item.events, bucketStart: item.bucketStart, bucketEnd: item.bucketEnd })"
              >
                <span class="font-bold text-sm">{{ item.events.length }}</span>
              </button>
            </template>
          </div>
        </div>

        <!-- Now line (vertical) -->
        <div
          v-if="showNowLine && isToday && nowLinePosition !== null"
          class="absolute top-0 bottom-0 z-30 pointer-events-none"
          :style="{ left: cfg.resourceMinWidth, right: '0' }"
        >
          <div
            class="absolute top-0 bottom-0 h-full flex flex-col items-center"
            :style="{ left: `${nowLinePosition}%` }"
          >
            <div class="w-2 h-2 rounded-full bg-sd-error -mt-1 shrink-0" />
            <div class="w-[2px] flex-1 min-h-0 bg-sd-error" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
