<script setup lang="ts">
import { ref } from 'vue';
import { SdCheckbox } from '@sanibase/ui';

const check1 = ref(true);
const check2 = ref(false);
const check3 = ref(false);
const stateChecked = ref(true);
const stateUnchecked = ref(false);
const stateIndet = ref(false);
const sizeSm = ref(true);
const sizeMd = ref(true);
const sizeLg = ref(true);
const sizeTouch = ref(true);
const deskCheck = ref(true);
const touchCheck = ref(true);
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdCheckbox</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Checkbox with label, indeterminate state, and all sizes.</p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Basic</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-3 max-w-md">
        <SdCheckbox v-model="check1" label="Active" />
        <SdCheckbox v-model="check2" label="Send email notification" />
        <SdCheckbox v-model="check3" label="Require phone number" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">States</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-3 max-w-md">
        <SdCheckbox v-model="stateChecked" label="Checked (click to toggle)" />
        <SdCheckbox v-model="stateUnchecked" label="Unchecked (click to toggle)" />
        <SdCheckbox v-model="stateIndet" indeterminate label="Indeterminate (select all)" />
        <SdCheckbox :model-value="true" label="Disabled checked" disabled />
        <SdCheckbox :model-value="false" label="Disabled unchecked" disabled />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Sizes</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-3 max-w-md">
        <SdCheckbox v-model="sizeSm" label="sm" size="sm" />
        <SdCheckbox v-model="sizeMd" label="md (default)" size="md" />
        <SdCheckbox v-model="sizeLg" label="lg" size="lg" />
        <SdCheckbox v-model="sizeTouch" label="touch" size="touch" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Desktop vs Touch</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-sd-md border border-sd-border p-6">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">Desktop (md)</h3>
          <SdCheckbox v-model="deskCheck" label="Auto-print receipt" size="md" />
        </div>
        <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-6">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">Touch / POS (touch)</h3>
          <SdCheckbox v-model="touchCheck" label="Auto-print receipt" size="touch" />
        </div>
      </div>
    </section>
  </div>
</template>
