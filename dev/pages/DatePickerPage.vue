<script setup lang="ts">
import { ref } from 'vue';
import { SdDatePicker } from '@sanibase/ui';

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
