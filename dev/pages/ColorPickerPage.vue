<script setup lang="ts">
import { ref } from 'vue';
import { SdColorPicker } from '@sanibase/ui';

const brand = ref('#8B5A9F');
const accent = ref('#FF8C42');
const withPresets = ref('#22c55e');
const smColor = ref('#3b82f6');
const mdColor = ref('#8B5A9F');
const touchColor = ref('#ef4444');

const brandPresets = ['#8B5A9F', '#FF8C42', '#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#1a1a2e', '#6366f1'];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdColorPicker</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Color input with hex display, live preview, and optional presets.</p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Basic</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-xs">
        <SdColorPicker v-model="brand" label="Brand Color" />
        <p class="text-xs text-sd-text-muted mt-3">Value: {{ brand }}</p>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">With Preset Swatches</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-sm">
        <SdColorPicker v-model="withPresets" label="Theme Color" :presets="brandPresets" />
        <p class="text-xs text-sd-text-muted mt-3">Value: {{ withPresets }}</p>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Live Preview</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-sm">
        <SdColorPicker v-model="accent" label="Accent Color" />
        <div class="mt-4 p-4 rounded-sd-sm" :style="{ backgroundColor: accent + '15' }">
          <p class="text-sm font-medium" :style="{ color: accent }">Preview text in your accent color</p>
          <button
            class="mt-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            :style="{ backgroundColor: accent }"
          >
            Sample Button
          </button>
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Sizes</h2>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white rounded-sd-md border border-sd-border p-5">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">sm</h3>
          <SdColorPicker v-model="smColor" size="sm" label="Color" />
        </div>
        <div class="bg-white rounded-sd-md border border-sd-border p-5">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">md (default)</h3>
          <SdColorPicker v-model="mdColor" size="md" label="Color" />
        </div>
        <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">touch</h3>
          <SdColorPicker v-model="touchColor" size="touch" label="Color" />
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Disabled</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-xs">
        <SdColorPicker model-value="#8B5A9F" label="Locked Color" disabled />
      </div>
    </section>
  </div>
</template>
