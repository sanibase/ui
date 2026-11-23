<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { usePrimeVue } from 'primevue/config';
import { SdDatePicker, type SdDatePickerLegendItem } from '@sanibase/ui';

// ── One calendar (SaniDesk SD-596): the forms of the approved mockup, relative
// to today so the page keeps working (on Mon 23.11.2026 it is the mockup). ──
const primevue = usePrimeVue();
const savedLocale = { ...primevue.config.locale };
const german = ref(true);
function setGerman(on: boolean) {
  german.value = on;
  Object.assign(primevue.config.locale ?? {}, on ? {
    firstDayOfWeek: 1,
    dayNamesMin: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    monthNames: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    monthNamesShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  } : savedLocale);
}
onMounted(() => setGerman(true));
onBeforeUnmount(() => setGerman(false));

const now = new Date();
const day = (offset: number, h = 0) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, h);
const monday = day(-((now.getDay() + 6) % 7));
const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const lastWeek = { start: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 7), end: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 1) };
const noSession = [firstOfMonth, new Date(lastWeek.start.getFullYear(), lastWeek.start.getMonth(), lastWeek.start.getDate() + 1)];

const ocField = ref<Date | null>(day(-5));
const ocTag = ref<Date | null>(day(-4));
const ocWeek = ref<Date | null>(new Date(lastWeek.start.getFullYear(), lastWeek.start.getMonth(), lastWeek.start.getDate() + 3));
const ocRange = ref<Date[] | null>([day(-13), day(-5)]);
const ocDateTime = ref<Date | null>(day(-1, 18));
const ocMonth = ref<Date | null>(new Date(now.getFullYear(), now.getMonth() - 1, 1));
const ocBlocked = ref<Date | null>(day(1));
const blockedDays = Array.from({ length: now.getDate() - 1 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), i + 1));
const tagLegend: SdDatePickerLegendItem[] = [
  { label: 'gewählt', swatch: 'selected' },
  { label: 'heute', swatch: 'today' },
  { label: 'Hell: an diesem Tag war die Kasse zu (keine Sitzung).' },
];
const weekLegend: SdDatePickerLegendItem[] = [
  { label: 'gewählte Woche', swatch: 'band' },
  { label: 'heute', swatch: 'today' },
  { label: 'Hell: an diesem Tag war die Kasse zu (keine Sitzung).' },
];

// ── size="lg": the till's touch calendar, in the till's boxes ──
const tillDate = ref<Date | null>(day(0));
const tillN2Date = ref<Date | null>(day(0));
const tillWide = ref<Date | null>(day(-4));
const tillDateTime = ref<Date | null>(day(1, 19));
const tillField = ref<Date | null>(null);
const tillMonth = ref<Date | null>(null);
// A venue's business day: after midnight it is still yesterday.
const businessDay = day(-1);
const shownMonth = ref('');
function onShown(m: { year: number; month: number }) {
  shownMonth.value = `${m.year}-${String(m.month).padStart(2, '0')}`;
}

const basicDate = ref<Date | null>(null);
const preselected = ref<Date | null>(new Date());
const dateTime = ref<Date | null>(null);
const timeOnly = ref<Date | null>(null);
const monthVal = ref<Date | null>(null);
const rangeVal = ref<Date[] | null>(null);
const errorDate = ref<Date | null>(null);
const smDate = ref<Date | null>(null);
const mdDate = ref<Date | null>(null);
const lgDate = ref<Date | null>(null);
const touchDate = ref<Date | null>(null);
const deskDate = ref<Date | null>(null);
const touchPosDate = ref<Date | null>(null);
const inlineDate = ref<Date | null>(new Date());

const minDate = new Date();
const maxDate = new Date();
maxDate.setMonth(maxDate.getMonth() + 3);
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdDatePicker</h1>
    <p class="text-sd-text-secondary text-sm mb-8">
      Wraps PrimeVue DatePicker with SaniDesk styling. Purple selection, all sizes.
    </p>

    <!-- One calendar (SD-596) -->
    <section
      class="mb-10"
      data-testid="one-calendar"
    >
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-1">
        One calendar (SD-596)
      </h2>
      <p class="text-sd-text-secondary text-sm mb-4">
        Every form at the same 320 px: chosen purple, today an orange ring, muted days light, a week as a light band.
        <button
          type="button"
          class="underline ml-2"
          @click="setGerman(!german)"
        >
          {{ german ? 'English locale' : 'Deutsch' }}
        </button>
      </p>
      <div class="flex flex-wrap gap-x-10 gap-y-8 items-start">
        <div
          class="w-[320px] h-[420px]"
          data-testid="oc-field"
        >
          <h3 class="text-sm font-semibold mb-2">
            1. Datumsfeld
          </h3>
          <SdDatePicker
            v-model="ocField"
            label="Datum"
          />
        </div>
        <div data-testid="oc-tag">
          <h3 class="text-sm font-semibold mb-2">
            2. Abschlüsse, Tag
          </h3>
          <SdDatePicker
            v-model="ocTag"
            inline
            :muted-dates="noSession"
            muted-label="keine Sitzung"
            :legend="tagLegend"
          />
        </div>
        <div data-testid="oc-week">
          <h3 class="text-sm font-semibold mb-2">
            3. Abschlüsse, Woche
          </h3>
          <SdDatePicker
            v-model="ocWeek"
            inline
            :muted-dates="noSession"
            muted-label="keine Sitzung"
            :highlight-range="lastWeek"
            :legend="weekLegend"
          />
        </div>
        <div data-testid="oc-range">
          <h3 class="text-sm font-semibold mb-2">
            Von bis
          </h3>
          <SdDatePicker
            v-model="ocRange"
            inline
            range
          />
        </div>
        <div data-testid="oc-datetime">
          <h3 class="text-sm font-semibold mb-2">
            Datum und Zeit
          </h3>
          <SdDatePicker
            v-model="ocDateTime"
            inline
            mode="datetime"
          />
        </div>
        <div data-testid="oc-month">
          <h3 class="text-sm font-semibold mb-2">
            Monat
          </h3>
          <SdDatePicker
            v-model="ocMonth"
            inline
            mode="month"
          />
        </div>
        <div data-testid="oc-blocked">
          <h3 class="text-sm font-semibold mb-2">
            Gesperrte Tage
          </h3>
          <SdDatePicker
            v-model="ocBlocked"
            inline
            :disabled-dates="blockedDays"
          />
        </div>
      </div>
    </section>

    <!-- size="lg": the till -->
    <section
      class="mb-10"
      data-testid="lg-calendar"
    >
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-1">
        size="lg": the till's "Datum wählen"
      </h2>
      <p class="text-sd-text-secondary text-sm mb-4">
        Touch size: as wide as its box up to 420 px, never wider. Days 17 to 18 px, round targets 48 px (about 40 px in the N2's 328 px sheet), arrows and header 44 px.
      </p>
      <div class="flex flex-wrap gap-x-10 gap-y-8 items-start">
        <div>
          <h3 class="text-sm font-semibold mb-2">
            Kasse / Z108 dialog (448 px, px-6)
          </h3>
          <div
            class="w-[448px] max-w-full bg-white rounded-xl border border-sd-border px-6 py-4 flex justify-center"
            data-testid="lg-dialog"
          >
            <SdDatePicker
              v-model="tillDate"
              inline
              size="lg"
              :min-date="day(0)"
            />
          </div>
        </div>
        <div>
          <h3 class="text-sm font-semibold mb-2">
            N2 sheet (328 px, px-2)
          </h3>
          <div
            class="w-[328px] bg-white rounded-xl border border-sd-border px-2 py-4 flex justify-center"
            data-testid="lg-n2"
          >
            <SdDatePicker
              v-model="tillN2Date"
              inline
              size="lg"
              :min-date="day(0)"
            />
          </div>
        </div>
        <div>
          <h3 class="text-sm font-semibold mb-2">
            A wide box (600 px): capped at 420, with legend
          </h3>
          <div
            class="w-[600px] max-w-full bg-white rounded-xl border border-sd-border p-4"
            data-testid="lg-wide"
          >
            <SdDatePicker
              v-model="tillWide"
              inline
              size="lg"
              :muted-dates="noSession"
              muted-label="keine Sitzung"
              :highlight-range="lastWeek"
              :legend="weekLegend"
            />
          </div>
        </div>
        <div>
          <h3 class="text-sm font-semibold mb-2">
            Datum und Zeit, lg
          </h3>
          <div
            class="w-[448px] max-w-full bg-white rounded-xl border border-sd-border px-6 py-4 flex justify-center"
            data-testid="lg-datetime"
          >
            <SdDatePicker
              v-model="tillDateTime"
              inline
              size="lg"
              mode="datetime"
            />
          </div>
        </div>
        <div>
          <h3 class="text-sm font-semibold mb-2">
            Monat, lg
          </h3>
          <div
            class="w-[448px] max-w-full bg-white rounded-xl border border-sd-border px-6 py-4 flex justify-center"
            data-testid="lg-month"
          >
            <SdDatePicker
              v-model="tillMonth"
              inline
              size="lg"
              mode="month"
            />
          </div>
        </div>
        <div
          class="w-[400px] h-[600px]"
          data-testid="lg-field"
        >
          <h3 class="text-sm font-semibold mb-2">
            Field, lg (popup)
          </h3>
          <SdDatePicker
            v-model="tillField"
            label="Datum"
            size="lg"
            placeholder="Datum wählen"
          />
        </div>
      </div>
    </section>

    <!-- today + label -->
    <section
      class="mb-10"
      data-testid="today-demo"
    >
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-1">
        today and label
      </h2>
      <p class="text-sd-text-secondary text-sm mb-4">
        `today` set to yesterday (a venue after midnight): the ring moves. The label names the calendar (aria-labelledby); a field's label points at its input. Shown month: {{ shownMonth || 'not moved yet' }}
      </p>
      <SdDatePicker
        :model-value="null"
        inline
        label="Geschäftstag"
        :today="businessDay"
        @month-change="onShown"
      />
    </section>

    <!-- Basic -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Basic</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdDatePicker v-model="basicDate" label="Date" placeholder="Pick a date..." />
        <SdDatePicker v-model="preselected" label="Pre-selected" />
        <p class="text-xs text-sd-text-muted">Value: {{ basicDate }}</p>
      </div>
    </section>

    <!-- Modes -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Modes</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdDatePicker v-model="dateTime" label="Date + Time" mode="datetime" placeholder="Pick date and time..." />
        <SdDatePicker v-model="timeOnly" label="Time Only" mode="time" placeholder="Pick a time..." />
        <SdDatePicker v-model="monthVal" label="Month" mode="month" placeholder="Pick a month..." />
      </div>
    </section>

    <!-- Range -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Range Selection</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-md">
        <SdDatePicker v-model="rangeVal" label="Date Range" range placeholder="Start - End" hint="Click two dates to select a range" />
      </div>
    </section>

    <!-- Constraints -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Constraints</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdDatePicker label="Min/Max Date" placeholder="Next 3 months only" :min-date="minDate" :max-date="maxDate" hint="Today to 3 months from now" />
      </div>
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">States</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdDatePicker v-model="errorDate" label="With Error" error="Date is required" placeholder="..." />
        <SdDatePicker label="Disabled" :model-value="new Date()" disabled />
      </div>
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Sizes</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdDatePicker v-model="smDate" label="sm (32px)" size="sm" placeholder="Pick date..." />
        <SdDatePicker v-model="mdDate" label="md (38px)" size="md" placeholder="Pick date..." />
        <SdDatePicker v-model="lgDate" label="lg (46px)" size="lg" placeholder="Pick date..." />
        <SdDatePicker v-model="touchDate" label="touch (56px)" size="touch" placeholder="Pick date..." />
      </div>
    </section>

    <!-- Inline -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Inline Calendar</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-sm">
        <SdDatePicker v-model="inlineDate" inline />
        <p class="text-xs text-sd-text-muted mt-3">Selected: {{ inlineDate?.toLocaleDateString('de-CH') }}</p>
      </div>
    </section>

    <!-- Desktop vs Touch -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Desktop vs Touch</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-sd-md border border-sd-border p-6">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">Desktop (md)</h3>
          <SdDatePicker v-model="deskDate" label="Booking Date" size="md" placeholder="Pick date..." />
        </div>
        <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-6">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">Touch / POS (touch)</h3>
          <SdDatePicker v-model="touchPosDate" label="Booking Date" size="touch" placeholder="Pick date..." />
        </div>
      </div>
    </section>
  </div>
</template>
