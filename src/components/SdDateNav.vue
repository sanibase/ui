<script setup lang="ts">
import { computed } from 'vue';
import type { CalendarNavLabels, CalendarViewMode } from './calendar/types';
import { formatRangeLabel, FULL_WEEK_DAYS, stepRange } from './calendar/day-range';

export type DateNavSize = 'sm' | 'md' | 'touch';

export interface SdDateNavProps {
  /** Current date displayed */
  modelValue: Date;
  /** Active view mode */
  viewMode?: CalendarViewMode;
  /** Show view mode toggle buttons */
  showViewToggle?: boolean;
  /**
   * Modes offered by the toggle, in order. Defaults to the three that
   * existed before `agenda` was added, so no caller's toggle grows a button
   * it did not ask for.
   */
  viewModes?: CalendarViewMode[];
  /**
   * First day of the week: 1 = Monday (default), 0 = Sunday. Must match the
   * grid below the nav, or the week label names a different week than the one
   * that is drawn.
   */
  weekStartsOn?: 0 | 1;
  /**
   * How many day columns the week grid below is drawing, 1 to 7. Defaults to
   * 7. Must match `SdCalendarWeekGrid`'s own `visibleDays`, or the header
   * reads `10. Aug. - 16. Aug.` over three columns, which is a lie about what
   * the user is looking at.
   *
   * It changes two things in week mode: the label spans the window rather
   * than the calendar week, and prev/next steps by the window's width so
   * paging neither skips a day nor repeats one.
   */
  visibleDays?: number;
  /** Component size */
  size?: DateNavSize;
  /** Custom label override (replaces auto-generated date label) */
  label?: string;
  /** Intl locale for the auto-generated date label. */
  locale?: string;
  /**
   * Chrome strings. The design system carries no i18n, so the host passes
   * them in; anything omitted falls back to the English default this
   * component has always shipped.
   */
  labels?: CalendarNavLabels;
}

const props = withDefaults(defineProps<SdDateNavProps>(), {
  viewMode: 'day',
  showViewToggle: true,
  viewModes: () => ['day', 'week', 'month'],
  weekStartsOn: 1,
  visibleDays: FULL_WEEK_DAYS,
  size: 'md',
  locale: 'de-CH',
  labels: () => ({}),
});

const emit = defineEmits<{
  'update:modelValue': [value: Date];
  'update:viewMode': [value: CalendarViewMode];
}>();

const defaultModeLabels: Record<CalendarViewMode, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  agenda: 'Agenda',
};

const modeButtons = computed(() =>
  props.viewModes.map((value) => ({
    value,
    label: props.labels[value] ?? defaultModeLabels[value],
  })),
);

const todayLabel = computed(() => props.labels.today ?? 'Today');

const dateLabel = computed(() => {
  if (props.label) return props.label;

  const d = props.modelValue;
  const locale = props.locale;

  if (props.viewMode === 'day') {
    return d.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  if (props.viewMode === 'agenda') {
    // Agenda is a forward-looking window, so the label names its first day.
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  }

  if (props.viewMode === 'week') {
    // Formatted from the same rule the grid lays its columns out from, so the
    // header cannot name a range the grid is not drawing. The hand-rolled
    // `getDate() - getDay() + 1` this replaced was Monday-only and, on a
    // Sunday, named the *following* week.
    return formatRangeLabel(d, props.visibleDays, props.weekStartsOn, locale);
  }

  // month
  return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
});

function navigate(direction: -1 | 0 | 1) {
  if (direction === 0) {
    emit('update:modelValue', new Date());
    return;
  }

  const next = new Date(props.modelValue);
  if (props.viewMode === 'day') {
    next.setDate(next.getDate() + direction);
  } else if (props.viewMode === 'agenda') {
    // Agenda pages by week, which is the granularity that reads as "next"
    // in a list of days.
    next.setDate(next.getDate() + direction * 7);
  } else if (props.viewMode === 'week') {
    // One window width, whatever that window is: +/-7 at the default, +/-3 for
    // a 3-day grid. Stepping by a fixed week under a narrow window would skip
    // four days every press.
    emit('update:modelValue', stepRange(props.modelValue, direction, props.visibleDays));
    return;
  } else {
    next.setMonth(next.getMonth() + direction);
  }
  emit('update:modelValue', next);
}

const sizeMap: Record<DateNavSize, {
  wrapper: string;
  navBtn: string;
  todayBtn: string;
  label: string;
  toggleBtn: string;
  icon: number;
}> = {
  sm: {
    wrapper: 'gap-2',
    navBtn: 'w-7 h-7 rounded-[6px]',
    todayBtn: 'h-7 px-2.5 text-xs rounded-[6px]',
    label: 'text-sm font-semibold',
    toggleBtn: 'h-7 px-2.5 text-xs rounded-[6px]',
    icon: 14,
  },
  md: {
    wrapper: 'gap-3',
    navBtn: 'w-9 h-9 rounded-lg',
    todayBtn: 'h-9 px-3.5 text-[13px] rounded-lg',
    label: 'text-base font-semibold',
    toggleBtn: 'h-9 px-3.5 text-[13px] rounded-lg',
    icon: 16,
  },
  touch: {
    wrapper: 'gap-3',
    navBtn: 'w-12 h-12 rounded-xl',
    todayBtn: 'h-12 px-5 text-base rounded-xl',
    label: 'text-lg font-semibold',
    toggleBtn: 'h-12 px-5 text-base rounded-xl',
    icon: 22,
  },
};

const s = computed(() => sizeMap[props.size]);
</script>

<template>
  <div
    class="flex items-center flex-wrap"
    :class="s.wrapper"
  >
    <!-- Prev / Today / Next -->
    <div class="flex items-center gap-1">
      <button
        type="button"
        class="inline-flex items-center justify-center border border-sd-border bg-white text-sd-text-secondary hover:bg-sd-orange/5 hover:text-sd-orange active:scale-[0.95] transition-all cursor-pointer"
        :class="s.navBtn"
        aria-label="Previous"
        @click="navigate(-1)"
      >
        <svg
          :width="s.icon"
          :height="s.icon"
          viewBox="0 0 256 256"
          fill="none"
        >
          <polyline
            points="160,208 80,128 160,48"
            stroke="currentColor"
            stroke-width="24"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
          />
        </svg>
      </button>

      <button
        type="button"
        class="inline-flex items-center justify-center border border-sd-border bg-white text-sd-text-secondary font-medium hover:bg-sd-orange/5 hover:text-sd-orange active:scale-[0.95] transition-all cursor-pointer"
        :class="s.todayBtn"
        @click="navigate(0)"
      >
        {{ todayLabel }}
      </button>

      <button
        type="button"
        class="inline-flex items-center justify-center border border-sd-border bg-white text-sd-text-secondary hover:bg-sd-orange/5 hover:text-sd-orange active:scale-[0.95] transition-all cursor-pointer"
        :class="s.navBtn"
        aria-label="Next"
        @click="navigate(1)"
      >
        <svg
          :width="s.icon"
          :height="s.icon"
          viewBox="0 0 256 256"
          fill="none"
        >
          <polyline
            points="96,48 176,128 96,208"
            stroke="currentColor"
            stroke-width="24"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
          />
        </svg>
      </button>
    </div>

    <!-- Date label -->
    <span
      class="text-sd-text select-none"
      :class="s.label"
    >{{ dateLabel }}</span>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- View mode toggle -->
    <div
      v-if="showViewToggle"
      class="flex items-center bg-sd-bg-alt border border-sd-border rounded-lg p-0.5"
    >
      <button
        v-for="mode in modeButtons"
        :key="mode.value"
        type="button"
        class="inline-flex items-center justify-center font-medium transition-all cursor-pointer"
        :class="[
          s.toggleBtn,
          viewMode === mode.value
            ? 'bg-sd-orange text-white shadow-sm'
            : 'bg-transparent text-sd-text-muted hover:text-sd-text',
        ]"
        @click="emit('update:viewMode', mode.value)"
      >
        {{ mode.label }}
      </button>
    </div>
  </div>
</template>
