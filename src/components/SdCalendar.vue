<script setup lang="ts">
import { computed } from 'vue';
import type { CalendarEvent, CalendarResource, CalendarViewMode, TimeAxisOrientation } from './calendar/types';
import SdDateNav from './SdDateNav.vue';
import SdCalendarDayGrid from './SdCalendarDayGrid.vue';
import SdCalendarWeekGrid from './SdCalendarWeekGrid.vue';
import SdCalendarMonth from './SdCalendarMonth.vue';
import type { DayGridSize } from './SdCalendarDayGrid.vue';

export type CalendarSize = 'sm' | 'md' | 'touch';

export interface SdCalendarProps {
  /** Current date */
  date: Date;
  /** Active view mode */
  viewMode?: CalendarViewMode;
  /** Resources for day view columns */
  resources?: CalendarResource[];
  /** Events to display */
  events: CalendarEvent[];
  /** Start hour (day/week grids) */
  startHour?: number;
  /** End hour (day/week grids) */
  endHour?: number;
  /** Day view time axis orientation */
  orientation?: TimeAxisOrientation;
  /** Show navigation header */
  showNav?: boolean;
  /** Show the "now" line */
  showNowLine?: boolean;
  /** Max events per day in month view */
  monthMaxVisible?: number;
  /** Component size */
  size?: CalendarSize;
  /** When true, events are draggable and slots/days become drop targets. */
  draggable?: boolean;
}

const props = withDefaults(defineProps<SdCalendarProps>(), {
  viewMode: 'week',
  resources: () => [],
  startHour: 7,
  endHour: 22,
  orientation: 'vertical',
  showNav: true,
  showNowLine: true,
  monthMaxVisible: 3,
  size: 'md',
  draggable: false,
});

const emit = defineEmits<{
  'update:date': [value: Date];
  'update:viewMode': [value: CalendarViewMode];
  slotClick: [payload: { resourceId: string; start: Date; end: Date }];
  eventClick: [event: CalendarEvent];
  dayClick: [date: Date];
  eventDrop: [payload: { event: CalendarEvent; resourceId: string; start: Date; end: Date }];
  /** Concurrency overflow — the underlying grid collapses 5+ events at
   *  the same time bucket into a single cluster block; tapping it
   *  bubbles up the list so the host can render a popover/detail. */
  clusterClick: [payload: { events: CalendarEvent[]; bucketStart: Date; bucketEnd: Date }];
}>();

const date = computed({
  get: () => props.date,
  set: (v: Date) => emit('update:date', v),
});

const viewMode = computed({
  get: () => props.viewMode,
  set: (v: CalendarViewMode) => emit('update:viewMode', v),
});

const gridSize = computed((): DayGridSize => props.size);
</script>

<template>
  <div class="flex flex-col h-full gap-3">
    <!-- ── Navigation header ── -->
    <SdDateNav
      v-if="showNav"
      v-model="date"
      v-model:view-mode="viewMode"
      :size="size === 'touch' ? 'touch' : 'md'"
      class="shrink-0"
    />

    <!-- ── Slot for extra controls (filters, toggles, etc.) ── -->
    <slot name="toolbar" />

    <!-- ── Active view ── -->
    <div class="flex-1 min-h-0">
      <!-- Day -->
      <SdCalendarDayGrid
        v-if="viewMode === 'day'"
        :date="date"
        :resources="resources"
        :events="events"
        :start-hour="startHour"
        :end-hour="endHour"
        :orientation="orientation"
        :show-now-line="showNowLine"
        :size="gridSize"
        :draggable="draggable"
        class="h-full"
        @slot-click="(p) => emit('slotClick', p)"
        @event-click="(e) => emit('eventClick', e)"
        @event-drop="(p) => emit('eventDrop', p)"
        @cluster-click="(p) => emit('clusterClick', p)"
      />

      <!-- Week -->
      <SdCalendarWeekGrid
        v-else-if="viewMode === 'week'"
        :date="date"
        :events="events"
        :start-hour="startHour"
        :end-hour="endHour"
        :show-now-line="showNowLine"
        :size="gridSize"
        :draggable="draggable"
        class="h-full"
        @event-click="(e) => emit('eventClick', e)"
        @day-click="(d) => emit('dayClick', d)"
        @event-drop="(p) => emit('eventDrop', p)"
        @cluster-click="(p) => emit('clusterClick', p)"
      />

      <!-- Month -->
      <SdCalendarMonth
        v-else
        :date="date"
        :events="events"
        :max-visible="monthMaxVisible"
        :size="gridSize"
        class="h-full"
        @event-click="(e) => emit('eventClick', e)"
        @day-click="(d) => emit('dayClick', d)"
      />
    </div>
  </div>
</template>
