<script setup lang="ts">
import { computed, useSlots } from 'vue';
import DatePicker from 'primevue/datepicker';
import type { DatePickerPassThroughMethodOptions } from 'primevue/datepicker';
import {
  bandKeys,
  bandPart,
  keySet,
  metaKey,
  type PickerDayMeta,
  type SdCalendarDay,
  type SdDateRange,
  toLocalDate,
} from './date-picker-days';

export type { SdCalendarDay, SdDateRange } from './date-picker-days';

export type DatePickerSize = 'sm' | 'md' | 'lg' | 'touch';
export type DatePickerMode = 'date' | 'datetime' | 'time' | 'month' | 'year';

/** The mark drawn in front of a legend line; a line without one is a note under the row. */
export type SdDatePickerLegendSwatch = 'selected' | 'today' | 'band' | 'muted' | 'disabled';

export interface SdDatePickerLegendItem {
  label: string;
  swatch?: SdDatePickerLegendSwatch;
}

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
  /**
   * Days drawn light but still pickable (Abschlüsse: a day the till had no
   * session). Inside a week band they stay light.
   */
  mutedDates?: SdCalendarDay[];
  /** Read out and shown as a tooltip on a muted day, after its number (e.g. "no session"). */
  mutedLabel?: string;
  /**
   * A run of days drawn as a light purple band (a chosen week, or "von bis"
   * with `fillEnds`). With `range` and a complete value the band follows the
   * value by itself; this prop wins when both are there.
   */
  highlightRange?: SdDateRange | null;
  /** Days that cannot be picked: struck through, skipped by a click. */
  disabledDates?: SdCalendarDay[];
  /**
   * Lines under the grid, only drawn when given (or when the `legend` slot is
   * filled). A line with a `swatch` sits in the first row, one without is a
   * note under it.
   */
  legend?: SdDatePickerLegendItem[];
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
  mutedDates: () => [],
  mutedLabel: undefined,
  highlightRange: null,
  disabledDates: () => [],
  legend: () => [],
});

/** The month the calendar shows, `month` 1-based (Jan = 1). */
export interface SdDatePickerShownMonth {
  year: number;
  month: number;
}

const emit = defineEmits<{
  'update:modelValue': [value: Date | Date[] | (Date | null)[] | null];
  /**
   * The calendar moved to another month (arrows, header, keyboard), so a
   * caller that marks days (mutedDates) can load that month's marks.
   */
  monthChange: [shown: SdDatePickerShownMonth];
}>();

defineSlots<{
  /** Replaces the legend's lines; the legend is drawn when this slot is filled. */
  legend?: () => unknown;
}>();
const slots = useSlots();

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

// PrimeVue's month-change counts months from 1, its year-change from 0.
function onMonthChange(e: { month: number; year: number }) {
  emit('monthChange', { year: e.year, month: e.month });
}
function onYearChange(e: { month: number; year: number }) {
  emit('monthChange', { year: e.year, month: e.month + 1 });
}

// ── Day styling (SD-596 "one calendar") ──────────────────────────────────
// PrimeVue draws the grid, the keyboard and the aria; the kit only marks
// cells through pass-through attributes, and the stylesheet below reads them.

const mutedKeys = computed(() => keySet(props.mutedDates));

/** PrimeVue's own `disabledDates` takes local-midnight Dates. */
const pickerDisabledDates = computed<Date[] | undefined>(() => {
  const out = props.disabledDates.map(toLocalDate).filter((d): d is Date => d !== null);
  return out.length ? out : undefined;
});

/** The band: the prop, or a complete "von bis" value of a range field. */
const band = computed(() => {
  if (props.highlightRange) return bandKeys(props.highlightRange);
  const v = props.modelValue;
  if (props.range && Array.isArray(v) && v[0] && v[1]) {
    return bandKeys({ start: v[0], end: v[1], fillEnds: true });
  }
  return null;
});

const hasLegend = computed(() => props.legend.length > 0 || !!slots.legend);
const legendMarks = computed(() => props.legend.filter((i) => i.swatch));
const legendNotes = computed(() => props.legend.filter((i) => !i.swatch));

interface MonthCellContext {
  monthIndex: number;
}
interface YearCellContext {
  year: { value: number };
}

/** Pass-through: data attributes on the day cells, months and years. */
const pt = computed(() => {
  const muted = mutedKeys.value;
  const run = band.value;
  const mutedLabel = props.mutedLabel;
  return {
    dayCell: ({ context }: DatePickerPassThroughMethodOptions) => {
      const date = context.date as PickerDayMeta & { otherMonth?: boolean };
      const meta: PickerDayMeta = { ...date, otherMonth: context.otherMonth };
      const attrs: Record<string, string | undefined> = {};
      if (meta.otherMonth) return attrs;
      const isMuted = muted.has(metaKey(meta));
      if (isMuted) {
        attrs['data-sd-muted'] = '';
        if (mutedLabel) {
          attrs['aria-label'] = `${meta.day}, ${mutedLabel}`;
          attrs.title = mutedLabel;
        }
      }
      const part = bandPart(meta, run);
      if (part) {
        attrs['data-sd-band'] = part.kind;
        if (part.start) attrs['data-sd-band-start'] = '';
        if (part.end) attrs['data-sd-band-end'] = '';
        const key = metaKey(meta);
        if (part.kind === 'range' && run && (key === run.start || key === run.end)) attrs['data-sd-fill'] = '';
      }
      return attrs;
    },
    month: ({ instance, context }: DatePickerPassThroughMethodOptions) => {
      const now = new Date();
      const { monthIndex } = context as unknown as MonthCellContext;
      const current = (instance as { currentYear?: number }).currentYear === now.getFullYear() && monthIndex === now.getMonth();
      return current ? { 'data-sd-current': '' } : {};
    },
    year: ({ context }: DatePickerPassThroughMethodOptions) => {
      const { year } = context as unknown as YearCellContext;
      return year?.value === new Date().getFullYear() ? { 'data-sd-current': '' } : {};
    },
  };
});

const panelClass = computed(() => ['sd-calendar', `sd-calendar-${props.size}`]);
</script>

<template>
  <div
    :class="[inline && !useNative ? 'sd-datepicker-inline' : 'w-full', sizeClasses[size].wrapper, error ? 'sd-datepicker-error' : '']"
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
      :disabled-dates="pickerDisabledDates"
      :panel-class="panelClass"
      :pt="pt"
      fluid
      append-to="body"
      @update:model-value="onUpdate"
      @month-change="onMonthChange"
      @year-change="onYearChange"
    >
      <template
        v-if="hasLegend"
        #footer
      >
        <div
          class="sd-calendar-legend"
          data-testid="sd-datepicker-legend"
        >
          <slot name="legend">
            <div
              v-if="legendMarks.length"
              class="sd-calendar-legend-marks"
            >
              <span
                v-for="item in legendMarks"
                :key="item.label"
                class="sd-calendar-legend-mark"
              >
                <span
                  class="sd-calendar-swatch"
                  :class="`sd-calendar-swatch-${item.swatch}`"
                  aria-hidden="true"
                />{{ item.label }}
              </span>
            </div>
            <p
              v-for="item in legendNotes"
              :key="item.label"
              class="sd-calendar-legend-note"
            >
              {{ item.label }}
            </p>
          </slot>
        </div>
      </template>
    </DatePicker>

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

/* ── Inline: as wide as the calendar, so a centring parent centres it ── */
.sd-datepicker-inline {
  width: fit-content;
  max-width: 100%;
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


<!--
  The calendar panel (SaniDesk SD-596 "one calendar", owner 2026-11-23).

  Unscoped: the popup is teleported to <body> (append-to="body"), out of reach
  of scoped :deep(). Every rule hangs off `.sd-calendar`, the panel class this
  component sets, so a bare PrimeVue DatePicker elsewhere is left alone.
  `!important` beats the Aura theme's own rules and the inline width PrimeVue
  writes on the popup (it would otherwise grow to the input's width).

  One size everywhere: 320 px, round 36 px days, chosen purple, today an
  orange ring, the day under the pointer light purple, days of the
  neighbouring months not drawn (they stay in the DOM so PrimeVue's arrow
  keys can still step across the month edge; a focused one shows its number).
-->
<style>
.p-datepicker-panel.sd-calendar {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
  box-sizing: border-box;
  background: var(--sd-bg, #ffffff) !important;
  color: var(--sd-text, #1a1a2e) !important;
  border: 1px solid var(--sd-border, #ebebf0) !important;
  border-radius: 12px !important;
  padding: 16px !important;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
  z-index: 600;
}
.p-datepicker-panel.sd-calendar:not(.p-datepicker-timeonly) {
  width: 320px !important;
  min-width: 320px !important;
  max-width: calc(100vw - 16px);
}
.p-datepicker-panel.sd-calendar.p-datepicker-panel-inline {
  display: block;
  box-shadow: none !important;
  overflow: visible;
}
.p-datepicker-panel.sd-calendar.p-datepicker-timeonly {
  padding: 10px 12px !important;
}

/* ── Header: arrows, month and year to pick ── */
.sd-calendar .p-datepicker-header {
  padding: 0 0 8px !important;
  border: 0 !important;
  background: transparent !important;
}
.sd-calendar .p-datepicker-prev-button,
.sd-calendar .p-datepicker-next-button {
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  border-radius: 8px !important;
  border: 1.5px solid var(--sd-neutral-edge, #8e9cb1) !important;
  background: var(--sd-bg, #ffffff) !important;
  color: var(--sd-neutral-ink, #5b6678) !important;
}
.sd-calendar .p-datepicker-prev-button:not(:disabled):hover,
.sd-calendar .p-datepicker-next-button:not(:disabled):hover {
  background: var(--sd-neutral-wash, #f1f3f6) !important;
}
.sd-calendar .p-datepicker-title {
  gap: 4px !important;
  font-weight: 600 !important;
}
.sd-calendar .p-datepicker-select-month,
.sd-calendar .p-datepicker-select-year {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 7px !important;
  border-radius: 7px !important;
  font-size: 14px;
  font-weight: 600 !important;
  color: var(--sd-text, #1a1a2e) !important;
}
/* The caret says "pick me": month and year open PrimeVue's month and year views. */
.sd-calendar .p-datepicker-select-month::after,
.sd-calendar .p-datepicker-select-year::after {
  content: '';
  width: 5px;
  height: 5px;
  margin-top: -3px;
  border-right: 1.5px solid var(--sd-text-muted, #7e7e96);
  border-bottom: 1.5px solid var(--sd-text-muted, #7e7e96);
  transform: rotate(45deg);
}
.sd-calendar .p-datepicker-select-month:enabled:hover,
.sd-calendar .p-datepicker-select-year:enabled:hover {
  background: var(--sd-purple-light, #f0e8f5) !important;
}
.sd-calendar .p-datepicker-decade {
  font-size: 14px;
  font-weight: 600;
}

/* ── Day grid ── */
.sd-calendar .p-datepicker-day-view {
  margin: 0 !important;
  width: 100%;
  table-layout: fixed;
  border-collapse: separate !important;
  border-spacing: 0 4px !important;
  font-size: 13.5px !important;
}
.sd-calendar .p-datepicker-weekday-cell {
  padding: 4px 0 !important;
  text-align: center;
}
.sd-calendar .p-datepicker-weekday {
  font-size: 11px;
  font-weight: 600 !important;
  color: var(--sd-text-muted, #7e7e96) !important;
}
.sd-calendar .p-datepicker-day-cell {
  position: relative;
  height: 36px;
  padding: 0 !important;
  text-align: center;
}
.sd-calendar .p-datepicker-day {
  position: relative;
  z-index: 1;
  width: 36px !important;
  height: 36px !important;
  margin: 0 auto;
  border-radius: 9999px !important;
  border: 2px solid transparent !important;
  background: transparent !important;
  color: var(--sd-text, #1a1a2e) !important;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  opacity: 1;
}
.sd-calendar .p-datepicker-day:not(.p-disabled):not(.p-datepicker-day-selected):hover {
  background: rgb(var(--sd-purple-rgb, 139 90 159) / 0.12) !important;
}
.sd-calendar .p-datepicker-day:focus-visible {
  outline: none !important;
  box-shadow:
    0 0 0 2px rgb(var(--sd-focus-inner-rgb, 255 140 66)),
    0 0 0 4px rgb(var(--sd-focus-outer-rgb, 26 26 46)) !important;
}
/* Today: an orange ring, also on a chosen day. */
.sd-calendar .p-datepicker-today > .p-datepicker-day {
  border-color: var(--sd-orange, #ff8c42) !important;
}
/* Chosen: filled purple. A range's in-between days are the band's, not filled. */
.sd-calendar .p-datepicker-day.p-datepicker-day-selected,
.sd-calendar [data-sd-fill] > .p-datepicker-day {
  background: var(--sd-purple, #8b5a9f) !important;
  color: #ffffff !important;
}
.sd-calendar .p-datepicker-day.p-datepicker-day-selected-range {
  background: transparent !important;
  color: var(--sd-text, #1a1a2e) !important;
}
/* Muted (light): still pickable. */
.sd-calendar [data-sd-muted] > .p-datepicker-day:not(.p-datepicker-day-selected) {
  color: var(--sd-text-muted, #7e7e96) !important;
  opacity: 0.55;
}
/* Not pickable (disabledDates, minDate, maxDate): struck through. */
.sd-calendar .p-datepicker-day-cell:not(.p-datepicker-other-month) > .p-datepicker-day.p-disabled {
  color: var(--sd-text-muted, #7e7e96) !important;
  opacity: 0.55;
  text-decoration: line-through;
  cursor: default;
}
/* Neighbouring months: not drawn; a day reached by the arrow keys shows its number. */
.sd-calendar .p-datepicker-other-month > .p-datepicker-day {
  color: transparent !important;
  background: transparent !important;
  text-decoration: none;
  pointer-events: none;
}
.sd-calendar .p-datepicker-other-month > .p-datepicker-day:focus {
  color: var(--sd-text-muted, #7e7e96) !important;
}

/* ── The band (a chosen week, or "von bis") ── */
.sd-calendar [data-sd-band]::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--sd-purple-light, #f0e8f5);
}
.sd-calendar [data-sd-band-start]::before,
.sd-calendar tr > [data-sd-band]:first-child::before {
  border-start-start-radius: 18px;
  border-end-start-radius: 18px;
}
.sd-calendar [data-sd-band-end]::before,
.sd-calendar tr > [data-sd-band]:last-child::before {
  border-start-end-radius: 18px;
  border-end-end-radius: 18px;
}
/* A week: the band alone carries the choice, its days purple and bold. */
.sd-calendar [data-sd-band='week'] > .p-datepicker-day,
.sd-calendar [data-sd-band='week'] > .p-datepicker-day.p-datepicker-day-selected {
  background: transparent !important;
  color: var(--sd-purple-dark, #6a3d82) !important;
  font-weight: 600;
}
.sd-calendar [data-sd-band='week'] > .p-datepicker-day:not(.p-disabled):hover {
  background: rgb(var(--sd-purple-rgb, 139 90 159) / 0.12) !important;
}
/* A muted day stays readable inside the band. */
.sd-calendar [data-sd-band][data-sd-muted] > .p-datepicker-day,
.sd-calendar [data-sd-band][data-sd-muted] > .p-datepicker-day.p-datepicker-day-selected {
  color: var(--sd-text-muted, #7e7e96) !important;
  font-weight: 400;
  opacity: 0.75;
}

/* ── Month and year views ── */
.sd-calendar .p-datepicker-month-view,
.sd-calendar .p-datepicker-year-view {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin: 4px 0 0 !important;
}
.sd-calendar .p-datepicker-year-view {
  grid-template-columns: repeat(2, 1fr);
}
.sd-calendar .p-datepicker-month,
.sd-calendar .p-datepicker-year {
  width: auto !important;
  padding: 9px 0 !important;
  border-radius: 9px !important;
  border: 2px solid transparent !important;
  background: transparent !important;
  color: var(--sd-text, #1a1a2e) !important;
  font-size: 14px;
}
.sd-calendar .p-datepicker-month[data-sd-current],
.sd-calendar .p-datepicker-year[data-sd-current] {
  border-color: var(--sd-orange, #ff8c42) !important;
}
.sd-calendar .p-datepicker-month:not(.p-disabled):not(.p-datepicker-month-selected):hover,
.sd-calendar .p-datepicker-year:not(.p-disabled):not(.p-datepicker-year-selected):hover {
  background: rgb(var(--sd-purple-rgb, 139 90 159) / 0.12) !important;
}
.sd-calendar .p-datepicker-month.p-datepicker-month-selected,
.sd-calendar .p-datepicker-year.p-datepicker-year-selected {
  background: var(--sd-purple, #8b5a9f) !important;
  color: #ffffff !important;
}
.sd-calendar .p-datepicker-month.p-disabled,
.sd-calendar .p-datepicker-year.p-disabled {
  color: var(--sd-text-muted, #7e7e96) !important;
  opacity: 0.55;
  text-decoration: line-through;
}
.sd-calendar .p-datepicker-month:focus-visible,
.sd-calendar .p-datepicker-year:focus-visible {
  outline: none !important;
  box-shadow:
    0 0 0 2px rgb(var(--sd-focus-inner-rgb, 255 140 66)),
    0 0 0 4px rgb(var(--sd-focus-outer-rgb, 26 26 46)) !important;
}

/* ── Hour and minute, under the grid ── */
.sd-calendar .p-datepicker-time-picker {
  gap: 16px !important;
  border-block-start: 1px solid var(--sd-border, #ebebf0) !important;
  margin-top: 8px;
  padding: 10px 0 0 !important;
}
.sd-calendar.p-datepicker-timeonly .p-datepicker-time-picker {
  border: 0 !important;
  margin: 0;
  padding: 0 !important;
}
.sd-calendar .p-datepicker-time-picker > div {
  gap: 2px !important;
}
.sd-calendar .p-datepicker-time-picker span {
  font-size: 15px !important;
  font-variant-numeric: tabular-nums;
  color: var(--sd-text, #1a1a2e);
}
.sd-calendar .p-datepicker-time-picker .p-button {
  width: 32px !important;
  height: 28px !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 7px !important;
  background: transparent !important;
  color: var(--sd-neutral-ink, #5b6678) !important;
}
.sd-calendar .p-datepicker-time-picker .p-button:hover {
  background: var(--sd-purple-light, #f0e8f5) !important;
}

/* ── Legend (only when the caller gives one) ── */
.sd-calendar-legend {
  margin-top: 8px;
  border-top: 1px solid var(--sd-border, #ebebf0);
  padding-top: 10px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--sd-text-muted, #7e7e96);
}
.sd-calendar-legend-marks {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}
.sd-calendar-legend-mark {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.sd-calendar-legend-note {
  margin: 6px 0 0;
}
.sd-calendar-legend-note:first-child {
  margin-top: 0;
}
.sd-calendar-swatch {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  box-sizing: border-box;
}
.sd-calendar-swatch-selected {
  background: var(--sd-purple, #8b5a9f);
}
.sd-calendar-swatch-today {
  border: 2px solid var(--sd-orange, #ff8c42);
}
.sd-calendar-swatch-band {
  width: 20px;
  border-radius: 5px;
  background: var(--sd-purple-light, #f0e8f5);
}
.sd-calendar-swatch-muted {
  background: var(--sd-text-muted, #7e7e96);
  opacity: 0.35;
}
.sd-calendar-swatch-disabled {
  width: 12px;
  height: 2px;
  border-radius: 1px;
  background: var(--sd-text-muted, #7e7e96);
}
</style>
