<script setup lang="ts">
import { ref } from 'vue';
import { SdInput } from '@sanibase/ui';
import type { InputSize } from '@sanibase/ui';
import { PhEnvelope, PhLock, PhMagnifyingGlass, PhUser, PhPhone } from '@phosphor-icons/vue';

const text = ref('');
const email = ref('');
const password = ref('');
const search = ref('');
const errorVal = ref('');
const disabledVal = ref('Pre-filled value');
const clearableVal = ref('Some text to clear');
const priceVal = ref('');
const weightVal = ref('');
const swissNum = ref('50000');

const sizes: { name: string; size: InputSize }[] = [
  { name: 'sm (32px)', size: 'sm' },
  { name: 'md (38px)', size: 'md' },
  { name: 'lg (46px)', size: 'lg' },
  { name: 'touch (56px)', size: 'touch' },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdInput</h1>
    <p class="text-sd-text-secondary text-sm mb-8">
      Text input with label, hint, error, icons, and all sizes. Purple focus ring.
    </p>

    <!-- Basic -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Basic</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdInput v-model="text" label="Full Name" placeholder="Enter your name" />
        <SdInput v-model="email" label="Email" placeholder="you@example.com" type="email" required />
        <SdInput v-model="password" label="Password" placeholder="Min 8 characters" type="password" hint="Must contain a number and special character" />
      </div>
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Sizes</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdInput
          v-for="s in sizes"
          :key="s.size"
          :size="s.size"
          :label="s.name"
          placeholder="Type something..."
        />
      </div>
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">States</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdInput v-model="errorVal" label="With Error" placeholder="Enter email" error="This email is already taken" />
        <SdInput label="With Hint" placeholder="e.g. Gleis 56" hint="Your business display name" />
        <SdInput v-model="disabledVal" label="Disabled" disabled />
        <SdInput label="Read Only" model-value="Read-only content" readonly />
      </div>
    </section>

    <!-- Clearable -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Clearable</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdInput v-model="clearableVal" label="Search" placeholder="Type to search..." clearable>
          <template #icon-left><PhMagnifyingGlass :size="16" weight="regular" /></template>
        </SdInput>
      </div>
    </section>

    <!-- Prefix / Suffix -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Prefix / Suffix</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdInput v-model="priceVal" label="Price" placeholder="0.00" prefix="CHF" type="number" />
        <SdInput v-model="weightVal" label="Weight" placeholder="0" suffix="kg" type="number" />
        <SdInput label="Website" placeholder="example.com" prefix="https://" />
      </div>
    </section>

    <!-- Swiss Number Format -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Swiss Number Format</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdInput v-model="swissNum" label="Revenue" prefix="CHF" type="swiss-number" hint="Formats as 50'000.00 (Swiss standard)" />
        <p class="text-xs text-sd-text-muted">Raw value: {{ swissNum }}</p>
      </div>
    </section>

    <!-- With Icons -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">With Icons</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdInput v-model="search" placeholder="Search...">
          <template #icon-left><PhMagnifyingGlass :size="16" weight="regular" /></template>
        </SdInput>
        <SdInput label="Email" placeholder="you@example.com" type="email">
          <template #icon-left><PhEnvelope :size="16" weight="regular" /></template>
        </SdInput>
        <SdInput v-model="password" label="Password" placeholder="Enter password" type="password">
          <template #icon-left><PhLock :size="16" weight="regular" /></template>
        </SdInput>
        <SdInput label="Phone" placeholder="+41 79 000 00 00" type="tel">
          <template #icon-left><PhPhone :size="16" weight="regular" /></template>
        </SdInput>
      </div>
    </section>

    <!-- Desktop vs Touch -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Desktop vs Touch</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-sd-md border border-sd-border p-6">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">
            Desktop (md) -- admin panel
          </h3>
          <div class="space-y-3">
            <SdInput label="Customer Name" placeholder="Search customer..." size="md">
              <template #icon-left><PhUser :size="16" weight="regular" /></template>
            </SdInput>
            <SdInput label="Email" placeholder="customer@email.com" size="md">
              <template #icon-left><PhEnvelope :size="16" weight="regular" /></template>
            </SdInput>
            <SdInput label="Phone" placeholder="+41 79 000 00 00" size="md">
              <template #icon-left><PhPhone :size="16" weight="regular" /></template>
            </SdInput>
          </div>
        </div>

        <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-6">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">
            Touch / POS (touch) -- finger input
          </h3>
          <div class="space-y-3">
            <SdInput label="Customer Name" placeholder="Search customer..." size="touch">
              <template #icon-left><PhUser :size="20" weight="bold" /></template>
            </SdInput>
            <SdInput label="Email" placeholder="customer@email.com" size="touch">
              <template #icon-left><PhEnvelope :size="20" weight="bold" /></template>
            </SdInput>
            <SdInput label="Phone" placeholder="+41 79 000 00 00" size="touch">
              <template #icon-left><PhPhone :size="20" weight="bold" /></template>
            </SdInput>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
