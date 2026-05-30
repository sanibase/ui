<script setup lang="ts">
import { computed } from 'vue';
import DatePicker from 'primevue/datepicker';

export type DatePickerSize = 'sm' | 'md' | 'lg' | 'touch';
export type DatePickerMode = 'date' | 'datetime' | 'time' | 'month' | 'year';

export interface SdDatePickerProps {
  modelValue?: Date | Date[] | null;
  label?: string;
  placeholder?: string;
  size?: DatePickerSize;
  mode?: DatePickerMode;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  range?: boolean;
  minDate?: Date;
  maxDate?: Date;
  dateFormat?: string;
  hourFormat?: '12' | '24';
  inline?: boolean;
  showIcon?: boolean;
}

const props = withDefaults(defineProps<SdDatePickerProps>(), {
  modelValue: null,
  size: 'md',
  mode: 'date',
  disabled: false,
  required: false,
  range: false,
  hourFormat: '24',
  dateFormat: 'dd.mm.yy',
  inline: false,
  showIcon: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: Date | Date[] | (Date | null)[] | null];
}>();

const sizeClasses: Record<DatePickerSize, { label: string; wrapper: string }> = {
  sm: { label: 'text-xs mb-1', wrapper: 'sd-datepicker-sm' },
  md: { label: 'text-[13px] mb-1.5', wrapper: 'sd-datepicker-md' },
  lg: { label: 'text-sm mb-1.5', wrapper: 'sd-datepicker-lg' },
  touch: { label: 'text-sm mb-2', wrapper: 'sd-datepicker-touch' },
};

const showTime = computed(() => props.mode === 'datetime' || props.mode === 'time');
const timeOnly = computed(() => props.mode === 'time');
const view = computed(() => {
  if (props.mode === 'month') return 'month';
  if (props.mode === 'year') return 'year';
  return 'date';
});

/** Use native input on touch for time-only and date modes */
const useNative = computed(() => props.size === 'touch' && (props.mode === 'time' || props.mode === 'date' || props.mode === 'datetime'));

const nativeType = computed(() => {
  if (props.mode === 'time') return 'time';
  if (props.mode === 'datetime') return 'datetime-local';
  return 'date';
});

/** Convert Date to native input value string */
const nativeValue = computed(() => {
  const d = props.modelValue;
  if (!d || Array.isArray(d)) return '';
  if (props.mode === 'time') {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  if (props.mode === 'datetime') {
    const date = d.toISOString().slice(0, 16);
    return date;
  }
  // date
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
});

function onNativeChange(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  if (!val) {
    emit('update:modelValue', null);
    return;
  }
  if (props.mode === 'time') {
    const [h, m] = val.split(':').map(Number);
    const d = new Date(2000, 0, 1, h, m);
    emit('update:modelValue', d);
  } else if (props.mode === 'datetime') {
    emit('update:modelValue', new Date(val));
  } else {
    emit('update:modelValue', new Date(val + 'T00:00:00'));
  }
}

const nativeInputClasses: Record<DatePickerSize, string> = {
  sm: 'h-8 text-[13px] px-2.5',
  md: 'h-[38px] text-sm px-3',
  lg: 'h-[46px] text-[15px] px-3.5',
  touch: 'h-14 text-base px-4',
};

function onUpdate(value: Date | Date[] | (Date | null)[] | null | undefined) {
  emit('update:modelValue', value ?? null);
}
</script>

<template>
  <div
    class="w-full"
    :class="[sizeClasses[size].wrapper, error ? 'sd-datepicker-error' : '']"
  >
    <label
      v-if="label"
      class="block font-medium text-sd-text-muted"
      :class="sizeClasses[size].label"
    >
      {{ label }}
      <span
        v-if="required"
        class="text-sd-error"
      >*</span>
    </label>

    <!-- Native input for touch -->
    <input
      v-if="useNative"
      :type="nativeType"
      :value="nativeValue"
      :disabled="disabled"
      :placeholder="placeholder"
      :required="required"
      class="sd-native-input w-full rounded-lg border bg-white text-sd-text outline-none transition-all
             border-sd-border focus:border-sd-orange focus:ring-2 focus:ring-sd-orange/10"
      :class="[nativeInputClasses[size], error ? 'border-sd-error focus:ring-sd-error/20' : '']"
      @change="onNativeChange"
    >

    <!-- PrimeVue DatePicker for desktop -->
    <DatePicker
      v-else
      :model-value="modelValue"
      :date-format="dateFormat"
      :show-time="showTime"
      :time-only="timeOnly"
      :hour-format="hourFormat"
      :view="view"
      :selection-mode="range ? 'range' : 'single'"
      :min-date="minDate"
      :max-date="maxDate"
      :disabled="disabled"
      :placeholder="placeholder"
      :inline="inline"
      :show-icon="showIcon && !inline"
      fluid
      append-to="body"
      @update:model-value="onUpdate"
    />

    <p
      v-if="error"
      class="mt-1 text-xs text-sd-error font-medium"
    >
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      class="mt-1 text-xs text-sd-text-muted"
    >
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
/* ── Base input — match SdInput look ── */
:deep(.p-datepicker-input) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
  background: white !important;
  border: 1px solid var(--sd-border, #e2e0e6) !important;
  border-radius: 0.5rem !important;
  color: var(--sd-text, #1a1a2e) !important;
  outline: none !important;
  transition: border-color 150ms, box-shadow 150ms !important;
}
:deep(.p-datepicker-input::placeholder) {
  color: var(--sd-text-muted, #6b6b80) !important;
  opacity: 0.5 !important;
}
:deep(.p-datepicker-input:focus),
:deep(.p-datepicker-input:focus-within) {
  border-color: var(--sd-orange, #f97316) !important;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.1) !important;
}
/* Icon button (right side) */
:deep(.p-datepicker-dropdown) {
  color: var(--sd-text-muted, #6b6b80) !important;
  background: transparent !important;
  border: none !important;
}

/* ── Size variants (input only — panel styles are in the unscoped block) ── */
.sd-datepicker-sm :deep(.p-datepicker-input) {
  height: 32px !important;
  font-size: 13px !important;
  padding: 0 10px !important;
}
.sd-datepicker-md :deep(.p-datepicker-input) {
  height: 38px !important;
  font-size: 14px !important;
  padding: 0 12px !important;
}
.sd-datepicker-lg :deep(.p-datepicker-input) {
  height: 46px !important;
  font-size: 15px !important;
  padding: 0 14px !important;
}
.sd-datepicker-touch :deep(.p-datepicker-input) {
  height: 56px !important;
  font-size: 16px !important;
  padding: 0 16px !important;
}

/* ── Error state ── */
.sd-datepicker-error :deep(.p-datepicker-input) {
  border-color: var(--sd-error, #ef4444) !important;
}
.sd-datepicker-error :deep(.p-datepicker-input:focus) {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15) !important;
}

/* ── Native input: hide default icons, let tap open OS picker ── */
.sd-native-input::-webkit-calendar-picker-indicator {
  opacity: 0;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
</style>

<!-- Unscoped global styles target the teleported panel (append-to="body").
     Scoped :deep() can't reach DOM rendered outside the component instance,
     so the popup's appearance has to live here. -->
<style>
.p-datepicker-panel {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
  background: white !important;
  border: 1px solid var(--sd-border, #e2e0e6) !important;
  border-radius: 0.5rem !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  z-index: 600;
}
.p-datepicker-header {
  border-bottom: 1px solid var(--sd-border, #e2e0e6) !important;
}
.p-datepicker-prev-button,
.p-datepicker-next-button {
  color: var(--sd-text-muted, #6b6b80) !important;
}
.p-datepicker-prev-button:hover,
.p-datepicker-next-button:hover {
  color: var(--sd-text, #1a1a2e) !important;
  background: var(--sd-purple-subtle, #f3eef7) !important;
}
.p-datepicker-title button {
  color: var(--sd-text, #1a1a2e) !important;
  font-weight: 600 !important;
}
.p-datepicker-title button:hover {
  background: var(--sd-purple-subtle, #f3eef7) !important;
}

.p-datepicker-day-selected,
.p-datepicker-day-selected-range {
  background: var(--sd-orange, #f97316) !important;
  color: white !important;
}
.p-datepicker-day:not(.p-disabled):not(.p-datepicker-day-selected):hover {
  background: var(--sd-purple-subtle, #f3eef7) !important;
  color: var(--sd-orange, #f97316) !important;
}
.p-datepicker-today > .p-datepicker-day:not(.p-datepicker-day-selected) {
  color: var(--sd-orange, #f97316) !important;
  font-weight: 600;
}

.p-datepicker-month-selected,
.p-datepicker-year-selected {
  background: var(--sd-orange, #f97316) !important;
  color: white !important;
}
.p-datepicker-month:not(.p-disabled):not(.p-datepicker-month-selected):hover,
.p-datepicker-year:not(.p-disabled):not(.p-datepicker-year-selected):hover {
  background: var(--sd-purple-subtle, #f3eef7) !important;
  color: var(--sd-orange, #f97316) !important;
}
</style>
