<script setup lang="ts">
import { computed } from 'vue';
import type { CalendarViewMode } from './calendar/types';

export type DateNavSize = 'sm' | 'md' | 'touch';

export interface SdDateNavProps {
  /** Current date displayed */
  modelValue: Date;
  /** Active view mode */
  viewMode?: CalendarViewMode;
  /** Show view mode toggle buttons */
  showViewToggle?: boolean;
  /** Component size */
  size?: DateNavSize;
  /** Custom label override (replaces auto-generated date label) */
  label?: string;
}

const props = withDefaults(defineProps<SdDateNavProps>(), {
  viewMode: 'day',
  showViewToggle: true,
  size: 'md',
});

const emit = defineEmits<{
  'update:modelValue': [value: Date];
  'update:viewMode': [value: CalendarViewMode];
}>();

const viewModes: { value: CalendarViewMode; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const dateLabel = computed(() => {
  if (props.label) return props.label;

  const d = props.modelValue;
  const locale = 'de-CH';

  if (props.viewMode === 'day') {
    return d.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  if (props.viewMode === 'week') {
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay() + 1); // Monday
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = (dt: Date) =>
      dt.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    return `${fmt(start)} - ${fmt(end)} ${end.getFullYear()}`;
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
  } else if (props.viewMode === 'week') {
    next.setDate(next.getDate() + direction * 7);
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
        Today
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
        v-for="mode in viewModes"
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
