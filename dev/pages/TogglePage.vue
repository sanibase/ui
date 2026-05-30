<script setup lang="ts">
import { ref } from 'vue';
import { SdToggle } from '@sanibase/ui';

const toggle1 = ref(true);
const toggle2 = ref(false);
const toggle3 = ref(true);
const sizeSm = ref(true);
const sizeMd = ref(true);
const sizeLg = ref(true);
const sizeTouch = ref(true);
const deskToggle = ref(true);
const touchToggle = ref(true);
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdToggle</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Toggle switch with label and all sizes. Purple when on.</p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Basic</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdToggle v-model="toggle1" label="Auto-accept bookings" />
        <SdToggle v-model="toggle2" label="Enable notifications" />
        <SdToggle v-model="toggle3" label="Require PIN for POS" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">States</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdToggle :model-value="true" label="Disabled ON" disabled />
        <SdToggle :model-value="false" label="Disabled OFF" disabled />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Sizes</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdToggle v-model="sizeSm" label="sm" size="sm" />
        <SdToggle v-model="sizeMd" label="md (default)" size="md" />
        <SdToggle v-model="sizeLg" label="lg" size="lg" />
        <SdToggle v-model="sizeTouch" label="touch" size="touch" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Desktop vs Touch</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-sd-md border border-sd-border p-6">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">Desktop (md)</h3>
          <SdToggle v-model="deskToggle" label="Kitchen notifications" size="md" />
        </div>
        <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-6">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">Touch / POS (touch)</h3>
          <SdToggle v-model="touchToggle" label="Kitchen notifications" size="touch" />
        </div>
      </div>
    </section>
  </div>
</template>
