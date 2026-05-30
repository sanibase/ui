<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { CalendarEvent } from './calendar/types';
import SdCalendarEvent from './SdCalendarEvent.vue';
import { type LaidOutItem, packDayEvents } from './calendar/lane-packer';

export type WeekGridSize = 'sm' | 'md' | 'touch';

export interface SdCalendarWeekGridProps {
  /** Any date within the week to display (week starts Monday) */
  date: Date;
  /** Events to display */
  events: CalendarEvent[];
  /** Start hour (0-23) */
  startHour?: number;
  /** End hour (0-23) */
  endHour?: number;
  /** Show the "now" line */
  showNowLine?: boolean;
  /** Component size. sm = compact stacked cards, md/touch = time grid */
  size?: WeekGridSize;
  /** When true, events are draggable and slots become drop targets. */
  draggable?: boolean;
}

const props = withDefaults(defineProps<SdCalendarWeekGridProps>(), {
  startHour: 7,
  endHour: 22,
  showNowLine: true,
  size: 'md',
  draggable: false,
});

const emit = defineEmits<{
  dayClick: [date: Date];
  eventClick: [event: CalendarEvent];
  eventDrop: [payload: { event: CalendarEvent; resourceId: string; start: Date; end: Date }];
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
  const newStart = new Date(date);
  newStart.setHours(slot.hour, slot.minute, 0, 0);
  const durationMs = droppedEvent.end.getTime() - droppedEvent.start.getTime();
  const newEnd = new Date(newStart.getTime() + durationMs);
  // Week view doesn't have resources — preserve the event's existing resourceId.
  emit('eventDrop', {
    event: droppedEvent,
    resourceId: droppedEvent.resourceId,
    start: newStart,
    end: newEnd,
  });
  draggingEventId.value = null;
}

const isCompact = computed(() => props.size === 'sm');

// ── Week days ──

const weekDays = computed(() => {
  const d = new Date(props.date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);

  const days: { date: Date; dayName: string; dayNum: number; isToday: boolean; isWeekend: boolean }[] = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    days.push({
      date: current,
      dayName: current.toLocaleDateString('de-CH', { weekday: 'short' }),
      dayNum: current.getDate(),
      isToday:
        current.getFullYear() === today.getFullYear() &&
        current.getMonth() === today.getMonth() &&
        current.getDate() === today.getDate(),
      isWeekend: current.getDay() === 0 || current.getDay() === 6,
    });
  }
  return days;
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
  // For overnight grids (endMin > 1440) the early hours of "tomorrow"
  // also fall inside the window; offset nowMinutes by +24h so 01:00
  // reads as 1500min not 60.
  let now = nowMinutes.value;
  if (endMin > 1440 && now < startMin) now += 1440;
  if (now < startMin || now > endMin) return null;
  return ((now - startMin) / totalMinutes.value) * 100;
});

const isTodayInWeek = computed(() => weekDays.value.some((d) => d.isToday));

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
  return props.events
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

/** Event y/height + x/width relative to its day-column. Lane info comes
 *  from the lane-packer; overnight cross-midnight events get their end
 *  bumped by +24h so height stays positive. The reference frame is
 *  minutes-since-(date-midnight + startHour), so a 22:00–02:00 booking
 *  with startHour=18, endHour=26 lays out cleanly. */
function eventStyleGrid(event: CalendarEvent, date: Date, lane: number, laneCount: number) {
  const mid = new Date(date);
  mid.setHours(0, 0, 0, 0);
  const startMs = mid.getTime() + props.startHour * 60 * 60_000;
  let evStartMin = (event.start.getTime() - startMs) / 60_000;
  let evEndMin = (event.end.getTime() - startMs) / 60_000;
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
  let s = (item.bucketStart.getTime() - startMs) / 60_000;
  let e = (item.bucketEnd.getTime() - startMs) / 60_000;
  if (e <= s) e += 24 * 60;
  const top = (s / totalMinutes.value) * 100;
  const height = ((e - s) / totalMinutes.value) * 100;
  return { top: `${top}%`, height: `${height}%`, left: '0%', width: '100%' };
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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
  };
});

const colTemplate = computed(
  () => `${gridCfg.value.timeColWidth} repeat(7, 1fr)`,
);
</script>

<template>
  <!-- ════ COMPACT (sm): stacked card list per day ════ -->
  <div
    v-if="isCompact"
    class="flex flex-col h-full border border-sd-border rounded-sd-md bg-white overflow-hidden"
  >
    <!-- Day headers -->
    <div class="grid grid-cols-7 shrink-0 border-b border-sd-border">
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
    <div class="grid grid-cols-7 flex-1 min-h-0 overflow-y-auto">
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

  <!-- ════ GRID (md/touch): time axis + 7 day columns ════ -->
  <div
    v-else
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

    <!-- Time grid body -->
    <div class="relative">
      <div
        class="grid"
        :style="{
          gridTemplateColumns: colTemplate,
          gridTemplateRows: `repeat(${slots.length}, ${size === 'touch' ? '18px' : '14px'})`,
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

          <!-- Day cells -->
          <div
            v-for="(day, di) in weekDays"
            :key="`${di}-${si}`"
            class="border-r border-sd-border last:border-r-0 cursor-pointer transition-colors hover:bg-sd-purple-subtle/30"
            :class="[
              slot.minute === 0 ? 'border-t border-t-sd-border' : (slot.minute === 30 ? 'border-t border-t-sd-border/30' : ''),
              day.isWeekend ? 'bg-sd-bg-alt/20' : '',
            ]"
            @click="emit('dayClick', day.date)"
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
              class="absolute pointer-events-auto z-10 px-0.5"
              :style="eventStyleGrid(item.event, day.date, item.lane, item.laneCount)"
            >
              <SdCalendarEvent
                :title="item.event.title"
                :subtitle="item.event.subtitle"
                :time-label="`${formatTime(item.event.start)} - ${formatTime(item.event.end)}`"
                :status="item.event.status ?? 'confirmed'"
                :color="item.event.color"
                :size="gridCfg.eventSize"
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
