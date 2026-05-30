<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { CalendarEvent, CalendarResource, EventStatus } from './calendar/types';
import type { TimeAxisOrientation } from './calendar/types';
import SdCalendarEvent from './SdCalendarEvent.vue';
import { type LaidOutItem, packDayEvents } from './calendar/lane-packer';

export type DayGridSize = 'sm' | 'md' | 'touch';

export interface SdCalendarDayGridProps {
  /** Date to display */
  date: Date;
  /** Resources — columns (vertical) or rows (horizontal) */
  resources: CalendarResource[];
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
}

const props = withDefaults(defineProps<SdCalendarDayGridProps>(), {
  startHour: 7,
  endHour: 22,
  slotDuration: 15,
  orientation: 'vertical',
  showNowLine: true,
  size: 'md',
  draggable: false,
});

const emit = defineEmits<{
  slotClick: [payload: { resourceId: string; start: Date; end: Date }];
  eventClick: [event: CalendarEvent];
  eventDrop: [payload: { event: CalendarEvent; resourceId: string; start: Date; end: Date }];
  clusterClick: [payload: { events: CalendarEvent[]; bucketStart: Date; bucketEnd: Date }];
}>();

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
  () => `${cfg.value.timeColWidth} repeat(${props.resources.length}, minmax(${cfg.value.resourceMinWidth}, 1fr))`,
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
  return props.events
    .filter((ev) => ev.resourceId === resourceId && ev.start.getTime() >= win.start && ev.start.getTime() < win.end)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

const laidOutByResource = computed<Map<string, LaidOutItem[]>>(() => {
  const out = new Map<string, LaidOutItem[]>();
  for (const r of props.resources) out.set(r.id, packDayEvents(eventsForResource(r.id)));
  return out;
});

function itemsForResource(resourceId: string): LaidOutItem[] {
  return laidOutByResource.value.get(resourceId) ?? [];
}

function eventStyleVertical(event: CalendarEvent, lane: number, laneCount: number) {
  const mid = new Date(props.date);
  mid.setHours(0, 0, 0, 0);
  const startMs = mid.getTime() + props.startHour * 60 * 60_000;
  const evStartMin = (event.start.getTime() - startMs) / 60_000;
  let evEndMin = (event.end.getTime() - startMs) / 60_000;
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
  const evStartMin = (event.start.getTime() - startMs) / 60_000;
  let evEndMin = (event.end.getTime() - startMs) / 60_000;
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
    <div class="flex-1 min-h-0 overflow-y-auto flex flex-col">
      <!-- Header (sticky inside the scroll container) -->
      <div
        class="grid sticky top-0 z-20 bg-white shrink-0 border-b border-sd-border"
        :style="{ gridTemplateColumns: vColTemplate }"
      >
        <div
          class="border-r border-sd-border"
          :style="{ height: cfg.headerHeight }"
        />
        <div
          v-for="resource in resources"
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

      <!-- Body — flex-1 so the 1fr grid-rows have a definite height to divide -->
      <div class="relative flex-1 min-h-0">
        <div
          class="grid h-full"
          :style="{
            gridTemplateColumns: vColTemplate,
            gridTemplateRows: `repeat(${slots.length}, 1fr)`,
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
              v-for="resource in resources"
              :key="`${resource.id}-${si}`"
              class="border-r border-sd-border last:border-r-0 cursor-pointer transition-colors hover:bg-sd-purple-subtle/30"
              :class="slot.minute === 0 ? 'border-t border-t-sd-border' : 'border-t border-t-sd-border/40'"
              @click="onSlotClick(resource.id, si)"
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
            v-for="resource in resources"
            :key="'ov-' + resource.id"
            class="relative"
          >
            <template
              v-for="(item, idx) in itemsForResource(resource.id)"
              :key="idx"
            >
              <div
                v-if="item.kind === 'event'"
                class="absolute pointer-events-auto z-10 px-0.5"
                :style="eventStyleVertical(item.event, item.lane, item.laneCount)"
              >
                <SdCalendarEvent
                  :title="item.event.title"
                  :subtitle="item.event.subtitle"
                  :time-label="`${formatTime(item.event.start)} - ${formatTime(item.event.end)}`"
                  :status="item.event.status ?? 'confirmed'"
                  :color="item.event.color"
                  :size="cfg.eventSize"
                  :draggable="draggable"
                  class="h-full"
                  @click="emit('eventClick', item.event)"
                  @dragstart="(e) => onEventDragStart(item.event, e)"
                  @dragend="onEventDragEnd"
                />
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
    <div class="flex-1 min-h-0 overflow-y-auto">
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
      <div class="relative">
        <!-- Resource rows -->
        <div
          v-for="(resource, ri) in resources"
          :key="resource.id"
          class="flex"
          :class="ri < resources.length - 1 ? 'border-b border-sd-border' : ''"
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
                class="flex-1 cursor-pointer transition-colors hover:bg-sd-purple-subtle/30"
                :class="slot.minute === 0 ? 'border-l border-sd-border' : (slot.minute === 30 ? 'border-l border-sd-border/25' : '')"
                @click="onSlotClick(resource.id, si)"
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
                class="absolute pointer-events-auto z-10 py-0.5"
                :style="eventStyleHorizontal(item.event, item.lane, item.laneCount)"
              >
                <SdCalendarEvent
                  :title="item.event.title"
                  :subtitle="item.event.subtitle"
                  :time-label="`${formatTime(item.event.start)} - ${formatTime(item.event.end)}`"
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
