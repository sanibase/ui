<script setup lang="ts">
import { ref } from 'vue';
import { SdScrollPills } from '@sanibase/ui';
import type { PillOption } from '@sanibase/ui';

const activePill = ref<string | number | null>(null);
const activePosPill = ref<string | number | null>(null);

const categories: PillOption[] = [
  { label: 'Pizza', value: 'pizza', count: 12 },
  { label: 'Pasta', value: 'pasta', count: 8 },
  { label: 'Salads', value: 'salads', count: 5 },
  { label: 'Desserts', value: 'desserts', count: 6 },
  { label: 'Drinks', value: 'drinks', count: 15 },
  { label: 'Starters', value: 'starters', count: 4 },
  { label: 'Specials', value: 'specials', count: 3 },
  { label: 'Sides', value: 'sides', count: 7 },
  { label: 'Kids Menu', value: 'kids', count: 4 },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdScrollPills</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Horizontally scrollable category/filter pills with optional counts.</p>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Desktop (md)</h2>
    <section class="mb-10">
      <div class="bg-white rounded-sd-md border border-sd-border p-4">
        <SdScrollPills v-model="activePill" :options="categories" />
        <p class="text-xs text-sd-text-muted mt-3">Selected: {{ activePill ?? 'All' }}</p>
      </div>
    </section>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">POS Touch</h2>
    <section class="mb-10">
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-4">
        <SdScrollPills v-model="activePosPill" :options="categories" size="touch" />
      </div>
    </section>
  </div>
</template>
