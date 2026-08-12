<script setup lang="ts">
import { computed } from 'vue';
import type {
  CalendarEvent,
  CalendarNavLabels,
  CalendarResizePayload,
  CalendarResource,
  CalendarViewMode,
  TimeAxisOrientation,
} from './calendar/types';
import SdDateNav from './SdDateNav.vue';
import SdCalendarDayGrid from './SdCalendarDayGrid.vue';
import SdCalendarWeekGrid from './SdCalendarWeekGrid.vue';
import SdCalendarMonth from './SdCalendarMonth.vue';
import SdCalendarAgenda from './SdCalendarAgenda.vue';
import type { DayGridSize } from './SdCalendarDayGrid.vue';
import { FULL_WEEK_DAYS } from './calendar/day-range';

export type CalendarSize = 'sm' | 'md' | 'touch';

export interface SdCalendarProps {
  /** Current date */
  date: Date;
  /** Active view mode */
  viewMode?: CalendarViewMode;
  /**
   * View modes offered by the nav toggle, in order.
   *
   * Defaults to the three modes that existed before agenda was added, so an
   * existing caller's toggle does not silently grow a fourth button. Pass
   * `['month', 'week', 'day', 'agenda']` to offer agenda.
   */
  viewModes?: CalendarViewMode[];
  /**
   * Resources for day view columns. Optional — leave empty for a personal
   * calendar and the day view renders one implicit column with every event.
   */
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
  /** When true, events grow resize handles and emit `eventResize`. */
  resizable?: boolean;
  /** Snap granularity for a resize, in minutes. */
  resizeStepMinutes?: number;
  /** Scroll the day/week grid so this hour sits at the top. */
  scrollToHour?: number;
  /** Fixed slot row height in px. Makes a wide hour window scroll, not squash. */
  slotHeight?: number;
  /** First day of the week: 1 = Monday (default), 0 = Sunday. */
  weekStartsOn?: 0 | 1;
  /**
   * How many day columns the week view draws, 1 to 7. Defaults to 7.
   *
   * Set it to 3 for a phone: seven columns at 390px come out near 43px each
   * and every event renders as an unreadable sliver. Below 7 the week view
   * becomes a rolling window anchored on `date` (a 3-day window cannot be
   * week-aligned, since 3 does not divide 7), and the nav's label and its
   * prev/next step follow the same window, so the header never names a range
   * the grid is not drawing.
   *
   * It affects the week view only. Day, month and agenda ignore it. The view
   * toggle's own caption is the host's (`navLabels.week`) — a host offering
   * three days should say so there.
   */
  visibleDays?: number;
  /** How many days the agenda view covers. */
  agendaDays?: number;
  /**
   * Intl locale for date formatting. The design system carries no i18n, so
   * the host supplies both the locale and the chrome strings.
   */
  locale?: string;
  /** Chrome strings (Heute / Tag / Woche / Monat / Agenda / Ganztags). */
  navLabels?: CalendarNavLabels;
}

const props = withDefaults(defineProps<SdCalendarProps>(), {
  viewMode: 'week',
  viewModes: () => ['day', 'week', 'month'],
  resources: () => [],
  startHour: 7,
  endHour: 22,
  orientation: 'vertical',
  showNav: true,
  showNowLine: true,
  monthMaxVisible: 3,
  size: 'md',
  draggable: false,
  resizable: false,
  resizeStepMinutes: 15,
  weekStartsOn: 1,
  visibleDays: FULL_WEEK_DAYS,
  agendaDays: 30,
  locale: 'de-CH',
  navLabels: () => ({}),
});

const emit = defineEmits<{
  'update:date': [value: Date];
  'update:viewMode': [value: CalendarViewMode];
  slotClick: [payload: { resourceId: string; start: Date; end: Date }];
  eventClick: [event: CalendarEvent];
  dayClick: [date: Date];
  eventDrop: [payload: { event: CalendarEvent; resourceId: string; start: Date; end: Date }];
  /** A top/bottom (or left/right) handle drag, or its keyboard equivalent. */
  eventResize: [payload: CalendarResizePayload];
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

const allDayLabel = computed(() => props.navLabels.allDay ?? 'Ganztags');
</script>

<template>
  <div class="flex flex-col h-full gap-3">
    <!-- ── Navigation header ── -->
    <SdDateNav
      v-if="showNav"
      v-model="date"
      v-model:view-mode="viewMode"
      :view-modes="viewModes"
      :week-starts-on="weekStartsOn"
      :visible-days="visibleDays"
      :locale="locale"
      :labels="navLabels"
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
        :resizable="resizable"
        :resize-step-minutes="resizeStepMinutes"
        :scroll-to-hour="scrollToHour"
        :slot-height="slotHeight"
        :locale="locale"
        :all-day-label="allDayLabel"
        class="h-full"
        @slot-click="(p) => emit('slotClick', p)"
        @event-click="(e) => emit('eventClick', e)"
        @event-drop="(p) => emit('eventDrop', p)"
        @event-resize="(p) => emit('eventResize', p)"
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
        :resizable="resizable"
        :resize-step-minutes="resizeStepMinutes"
        :scroll-to-hour="scrollToHour"
        :slot-height="slotHeight"
        :week-starts-on="weekStartsOn"
        :visible-days="visibleDays"
        :locale="locale"
        :all-day-label="allDayLabel"
        class="h-full"
        @event-click="(e) => emit('eventClick', e)"
        @day-click="(d) => emit('dayClick', d)"
        @event-drop="(p) => emit('eventDrop', p)"
        @event-resize="(p) => emit('eventResize', p)"
        @cluster-click="(p) => emit('clusterClick', p)"
      />

      <!-- Agenda -->
      <SdCalendarAgenda
        v-else-if="viewMode === 'agenda'"
        :date="date"
        :events="events"
        :days="agendaDays"
        :size="gridSize"
        :locale="locale"
        :all-day-label="allDayLabel"
        class="h-full"
        @event-click="(e) => emit('eventClick', e)"
        @day-click="(d) => emit('dayClick', d)"
      />

      <!-- Month -->
      <SdCalendarMonth
        v-else
        :date="date"
        :events="events"
        :max-visible="monthMaxVisible"
        :more-label="navLabels.more ?? 'more'"
        :size="gridSize"
        class="h-full"
        @event-click="(e) => emit('eventClick', e)"
        @day-click="(d) => emit('dayClick', d)"
      />
    </div>
  </div>
</template>
