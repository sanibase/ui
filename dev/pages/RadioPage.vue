<script setup lang="ts">
import { ref } from 'vue';
import { SdRadio } from '@sanibase/ui';
import type { RadioOption } from '@sanibase/ui';

const radio1 = ref<string | number>('cash');
const radio2 = ref<string | number>('thermal');
const radioSm = ref<string | number>('thermal');
const radioMd = ref<string | number>('thermal');
const radioLg = ref<string | number>('thermal');
const radioTouch = ref<string | number>('thermal');
const deskRadio = ref<string | number>('thermal');
const touchRadio = ref<string | number>('thermal');

const paymentOptions: RadioOption[] = [
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
  { label: 'Stripe', value: 'stripe' },
  { label: 'Invoice', value: 'invoice', disabled: true },
];

const printerOptions: RadioOption[] = [
  { label: 'Thermal (80mm)', value: 'thermal' },
  { label: 'A4', value: 'a4' },
  { label: 'Label', value: 'label' },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdRadio</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Radio group with vertical/horizontal layout and all sizes.</p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Basic (vertical)</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdRadio v-model="radio1" :options="paymentOptions" label="Payment Method" />
        <p class="text-xs text-sd-text-muted">Selected: {{ radio1 }}</p>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Horizontal</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-lg">
        <SdRadio v-model="radio2" :options="printerOptions" label="Printer Format" direction="horizontal" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Sizes</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-6 max-w-md">
        <SdRadio v-model="radioSm" :options="printerOptions" label="sm" size="sm" />
        <SdRadio v-model="radioMd" :options="printerOptions" label="md (default)" size="md" />
        <SdRadio v-model="radioLg" :options="printerOptions" label="lg" size="lg" />
        <SdRadio v-model="radioTouch" :options="printerOptions" label="touch" size="touch" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Desktop vs Touch</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-sd-md border border-sd-border p-6">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">Desktop (md)</h3>
          <SdRadio v-model="deskRadio" :options="printerOptions" label="Printer" size="md" direction="horizontal" />
        </div>
        <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-6">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">Touch / POS (touch)</h3>
          <SdRadio v-model="touchRadio" :options="printerOptions" label="Printer" size="touch" direction="horizontal" />
        </div>
      </div>
    </section>
  </div>
</template>
