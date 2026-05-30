<script setup lang="ts">
import { computed } from 'vue';
import SdToggle from './SdToggle.vue';
import SdDatePicker from './SdDatePicker.vue';

export type HoursGridSize = 'sm' | 'md' | 'touch';

export interface TimePeriod {
  open: string;
  close: string;
}

export interface DaySchedule {
  day: string;
  enabled: boolean;
  periods: TimePeriod[];
}

export interface SdHoursGridProps {
  modelValue: DaySchedule[];
  label?: string;
  size?: HoursGridSize;
  disabled?: boolean;
  closedLabel?: string;
  addBreakLabel?: string;
  errorCloseBeforeOpen?: string;
  errorOverlap?: string;
}

const props = withDefaults(defineProps<SdHoursGridProps>(), {
  size: 'md',
  disabled: false,
  closedLabel: 'Closed',
  addBreakLabel: '+ Add break',
  errorCloseBeforeOpen: 'Open and close must differ',
  errorOverlap: 'Periods overlap',
});

const emit = defineEmits<{
  'update:modelValue': [value: DaySchedule[]];
}>();

function updateDay(index: number, patch: Partial<DaySchedule>) {
  const updated = props.modelValue.map((d, i) =>
    i === index ? { ...d, ...patch } : d,
  );
  emit('update:modelValue', updated);
}

function updatePeriod(dayIndex: number, periodIndex: number, field: 'open' | 'close', value: string) {
  const day = props.modelValue[dayIndex];
  const newPeriods = day.periods.map((p, pi) =>
    pi === periodIndex ? { ...p, [field]: value } : p,
  );
  updateDay(dayIndex, { periods: newPeriods });
}

function addPeriod(dayIndex: number) {
  const day = props.modelValue[dayIndex];
  const lastClose = day.periods.length > 0 ? day.periods[day.periods.length - 1].close : '12:00';
  updateDay(dayIndex, {
    periods: [...day.periods, { open: lastClose, close: '18:00' }],
  });
}

function removePeriod(dayIndex: number, periodIndex: number) {
  const day = props.modelValue[dayIndex];
  updateDay(dayIndex, {
    periods: day.periods.filter((_, pi) => pi !== periodIndex),
  });
}

function toggleDay(dayIndex: number, enabled: boolean) {
  const day = props.modelValue[dayIndex];
  updateDay(dayIndex, {
    enabled,
    periods: enabled && day.periods.length === 0
      ? [{ open: '09:00', close: '18:00' }]
      : day.periods,
  });
}

function timeStringToDate(time: string): Date | null {
  const m = time.match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  return new Date(2000, 0, 1, parseInt(m[1]!, 10), parseInt(m[2]!, 10));
}

function dateToTimeString(d: Date | null): string {
  if (!d) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function onTimePickerChange(value: Date | Date[] | (Date | null)[] | null, dayIndex: number, periodIndex: number, field: 'open' | 'close') {
  const single = Array.isArray(value) ? value[0] : value;
  const str = single ? dateToTimeString(single) : '';
  if (str) {
    updatePeriod(dayIndex, periodIndex, field, str);
  }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Validation errors keyed by "dayIndex-periodIndex" */
const periodErrors = computed<Record<string, string>>(() => {
  const errors: Record<string, string> = {};
  for (let di = 0; di < props.modelValue.length; di++) {
    const day = props.modelValue[di]!;
    if (!day.enabled || day.periods.length === 0) continue;

    for (let pi = 0; pi < day.periods.length; pi++) {
      const p = day.periods[pi]!;
      const openMin = timeToMinutes(p.open);
      const closeMin = timeToMinutes(p.close);
      // close === open is the only invalid case (zero-length period).
      // close < open is allowed: it represents an overnight wrap
      // (e.g. 17:00–02:00) which HoursService.isTimeInPeriods supports
      // natively. Bars and night venues need this.
      if (closeMin === openMin) {
        errors[`${di}-${pi}`] = props.errorCloseBeforeOpen;
      }
    }

    if (day.periods.length > 1) {
      const sorted = day.periods
        .map((p, pi) => ({ ...p, pi }))
        .sort((a, b) => a.open.localeCompare(b.open));
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i]!.close > sorted[i + 1]!.open) {
          const key = `${di}-${sorted[i + 1]!.pi}`;
          if (!errors[key]) {
            errors[key] = props.errorOverlap;
          }
        }
      }
    }
  }
  return errors;
});

const toggleSize: Record<HoursGridSize, 'sm' | 'md' | 'touch'> = {
  sm: 'sm',
  md: 'sm',
  touch: 'touch',
};

const labelClasses: Record<HoursGridSize, string> = {
  sm: 'text-xs mb-2',
  md: 'text-[13px] mb-3',
  touch: 'text-sm mb-4',
};

const rowPadding: Record<HoursGridSize, string> = {
  sm: 'py-2',
  md: 'py-2.5',
  touch: 'py-3.5',
};

const dayLabelClasses: Record<HoursGridSize, string> = {
  sm: 'text-xs w-16',
  md: 'text-sm w-20',
  touch: 'text-base w-24',
};

const closedClasses: Record<HoursGridSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  touch: 'text-base',
};

const datePickerSize: Record<HoursGridSize, 'sm' | 'md' | 'lg' | 'touch'> = {
  sm: 'sm',
  md: 'sm',
  touch: 'touch',
};

const timePickerWidth: Record<HoursGridSize, string> = {
  sm: 'w-[76px]',
  md: 'w-[80px]',
  touch: 'w-[110px]',
};

const dashClasses: Record<HoursGridSize, string> = {
  sm: 'text-[10px]',
  md: 'text-xs',
  touch: 'text-sm',
};

const periodGap: Record<HoursGridSize, string> = {
  sm: 'gap-1',
  md: 'gap-1.5',
  touch: 'gap-2',
};

const removeBtnClasses: Record<HoursGridSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
  touch: 'w-5 h-5',
};
</script>

<template>
  <div :class="disabled ? 'opacity-50 pointer-events-none' : ''">
    <div
      v-if="label"
      class="font-medium text-sd-text-muted"
      :class="labelClasses[size]"
    >
      {{ label }}
    </div>

    <div class="divide-y divide-sd-border">
      <div
        v-for="(day, di) in modelValue"
        :key="day.day"
        class="flex items-start gap-3"
        :class="rowPadding[size]"
      >
        <!-- Day label (left) -->
        <span
          class="font-medium text-sd-text shrink-0"
          :class="[dayLabelClasses[size], size === 'touch' ? 'pt-2.5' : size === 'md' ? 'pt-1.5' : 'pt-1']"
        >
          {{ day.day }}
        </span>

        <!-- Periods or Closed (middle) -->
        <div
          v-if="day.enabled"
          class="flex flex-col flex-1 min-w-0"
          :class="periodGap[size]"
        >
          <div
            v-for="(period, pi) in day.periods"
            :key="pi"
          >
            <div
              class="flex items-center gap-1.5"
              :class="periodErrors[`${di}-${pi}`] ? 'sd-hours-error' : ''"
            >
              <div
                :class="timePickerWidth[size]"
                class="shrink-0"
              >
                <SdDatePicker
                  mode="time"
                  :model-value="timeStringToDate(period.open)"
                  :size="datePickerSize[size]"
                  hour-format="24"
                  :show-icon="false"
                  :disabled="disabled"
                  @update:model-value="onTimePickerChange($event, di, pi, 'open')"
                />
              </div>
              <span
                class="text-sd-text-muted shrink-0"
                :class="dashClasses[size]"
              >-</span>
              <div
                :class="timePickerWidth[size]"
                class="shrink-0"
              >
                <SdDatePicker
                  mode="time"
                  :model-value="timeStringToDate(period.close)"
                  :size="datePickerSize[size]"
                  hour-format="24"
                  :show-icon="false"
                  :disabled="disabled"
                  @update:model-value="onTimePickerChange($event, di, pi, 'close')"
                />
              </div>

              <!-- Remove period (only if more than 1) -->
              <button
                v-if="day.periods.length > 1"
                type="button"
                class="text-sd-text-muted hover:text-sd-error transition-colors shrink-0 ml-0.5"
                :disabled="disabled"
                aria-label="Remove period"
                @click="removePeriod(di, pi)"
              >
                <svg
                  :class="removeBtnClasses[size]"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M4 4l8 8M12 4l-8 8"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>
            <p
              v-if="periodErrors[`${di}-${pi}`]"
              class="text-xs text-sd-error mt-0.5"
            >
              {{ periodErrors[`${di}-${pi}`] }}
            </p>
          </div>
          <!-- Add period -->
          <button
            type="button"
            class="text-sd-purple font-medium hover:underline transition-colors self-start"
            :class="size === 'touch' ? 'text-sm' : 'text-xs'"
            :disabled="disabled"
            @click="addPeriod(di)"
          >
            {{ addBreakLabel }}
          </button>
        </div>
        <span
          v-else
          class="text-sd-text-muted flex-1"
          :class="[closedClasses[size], size === 'touch' ? 'pt-3' : size === 'md' ? 'pt-1.5' : 'pt-1']"
        >
          {{ closedLabel }}
        </span>

        <!-- Toggle (right) -->
        <div
          class="shrink-0"
          :class="size === 'touch' ? 'pt-2.5' : size === 'md' ? 'pt-1' : 'pt-0.5'"
        >
          <SdToggle
            :model-value="day.enabled"
            :size="toggleSize[size]"
            :disabled="disabled"
            @update:model-value="toggleDay(di, $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sd-hours-error :deep(.p-datepicker-input) {
  border-color: var(--sd-error, #ef4444) !important;
}
.sd-hours-error :deep(.sd-native-input) {
  border-color: var(--sd-error, #ef4444) !important;
}
</style>
