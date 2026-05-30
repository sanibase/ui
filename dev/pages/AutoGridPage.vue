<script setup lang="ts">
import { SdAutoGrid, SdCard } from '@sanibase/ui';

const categories = [
  { title: 'Pizza', count: 12 },
  { title: 'Pasta', count: 8 },
  { title: 'Salads', count: 5 },
  { title: 'Desserts', count: 6 },
  { title: 'Drinks', count: 15 },
  { title: 'Starters', count: 4 },
  { title: 'Specials', count: 3 },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdAutoGrid</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Smart grid that auto-arranges items by count + width. Avoids orphan items on the last row.</p>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">7 items (uneven)</h2>
    <section class="mb-10">
      <SdAutoGrid :count="categories.length" :min-width="140" :gap="12">
        <SdCard v-for="cat in categories" :key="cat.title" padding="sm" hoverable>
          <div class="text-center py-2">
            <div class="text-lg font-bold text-sd-text font-heading">{{ cat.count }}</div>
            <div class="text-xs text-sd-text-muted mt-0.5">{{ cat.title }}</div>
          </div>
        </SdCard>
      </SdAutoGrid>
    </section>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">5 items</h2>
    <section class="mb-10">
      <SdAutoGrid :count="5" :min-width="140" :gap="12">
        <SdCard v-for="i in 5" :key="i" padding="sm" hoverable>
          <div class="text-center py-2">
            <div class="text-sm font-semibold text-sd-text">Item {{ i }}</div>
          </div>
        </SdCard>
      </SdAutoGrid>
    </section>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">3 items</h2>
    <section class="mb-10">
      <SdAutoGrid :count="3" :min-width="140" :gap="12">
        <SdCard v-for="i in 3" :key="i" padding="sm" hoverable>
          <div class="text-center py-2">
            <div class="text-sm font-semibold text-sd-text">Item {{ i }}</div>
          </div>
        </SdCard>
      </SdAutoGrid>
    </section>
  </div>
</template>
