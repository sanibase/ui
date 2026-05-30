<script setup lang="ts">
import { ref } from 'vue';
import { SdBottomSheet, SdButton } from '@sanibase/ui';

const sheetOpen = ref(false);

const modifiers = [
  { name: 'Extra Cheese', price: '+CHF 2.00' },
  { name: 'Gluten Free Base', price: '+CHF 3.50' },
  { name: 'Extra Sauce', price: '+CHF 1.00' },
  { name: 'Add Mushrooms', price: '+CHF 2.50' },
  { name: 'No Onions', price: 'Free' },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdBottomSheet</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Mobile-first overlay that slides up from the bottom. Used for POS modifiers, ordering options, mobile filters.</p>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Demo</h2>
    <section class="mb-10">
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <SdButton label="Open Bottom Sheet" variant="secondary" @click="sheetOpen = true" />

        <SdBottomSheet v-model:open="sheetOpen" title="Add Modifiers">
          <div class="space-y-2">
            <div
              v-for="mod in modifiers"
              :key="mod.name"
              class="flex items-center justify-between p-3 border border-sd-border rounded-lg hover:bg-sd-purple-subtle cursor-pointer transition-colors active:scale-[0.99]"
            >
              <span class="text-sm font-medium text-sd-text">{{ mod.name }}</span>
              <span class="text-sm text-sd-text-muted">{{ mod.price }}</span>
            </div>
          </div>
          <template #footer>
            <SdButton label="Add to Order -- CHF 27.00" variant="primary" block @click="sheetOpen = false" />
          </template>
        </SdBottomSheet>
      </div>
    </section>
  </div>
</template>
