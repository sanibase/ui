<script setup lang="ts">
import { SdColumnList } from '@sanibase/ui';
import type { PillOption } from '@sanibase/ui';

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
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdColumnList</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Vertical-first column layout. mode="auto" splits into balanced columns on overflow. mode="single" stays one column and scrolls.</p>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Modes</h2>
    <section class="mb-10">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-4">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">auto -- splits into columns</h3>
          <SdColumnList mode="auto" max-height="280px" min-column-width="120px" gap="6px">
            <button
              v-for="(cat, i) in categories"
              :key="cat.value"
              class="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1"
              :class="i === 0 ? 'bg-sd-purple text-white' : 'text-sd-text hover:bg-sd-purple-subtle'"
            >
              {{ cat.label }} <span class="text-xs opacity-60">{{ cat.count }}</span>
            </button>
          </SdColumnList>
        </div>

        <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-4">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">single -- vertical sidebar</h3>
          <SdColumnList mode="single" max-height="220px" gap="4px">
            <button
              v-for="(cat, i) in categories"
              :key="cat.value"
              class="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0"
              :class="i === 0 ? 'bg-sd-purple text-white' : 'text-sd-text hover:bg-sd-purple-subtle'"
            >
              {{ cat.label }} <span class="text-xs opacity-60">{{ cat.count }}</span>
            </button>
          </SdColumnList>
        </div>

        <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-4">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">single -- POS touch</h3>
          <SdColumnList mode="single" max-height="280px" gap="6px">
            <button
              v-for="(cat, i) in categories"
              :key="cat.value"
              class="w-full text-left px-4 py-3.5 rounded-xl text-base font-semibold transition-colors shrink-0 active:scale-[0.97]"
              :class="i === 0 ? 'bg-sd-purple text-white' : 'text-sd-text hover:bg-sd-purple-subtle border border-sd-border'"
            >
              {{ cat.label }} <span class="text-sm opacity-60 ml-1">{{ cat.count }}</span>
            </button>
          </SdColumnList>
        </div>
      </div>
    </section>
  </div>
</template>
