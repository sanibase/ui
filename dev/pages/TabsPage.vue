<script setup lang="ts">
import { ref } from 'vue';
import { SdTabs } from '@sanibase/ui';
import type { TabItem } from '@sanibase/ui';

const activeTab = ref<string | number>('all');

const orderTabs: TabItem[] = [
  { label: 'All', value: 'all', count: 156 },
  { label: 'Pending', value: 'pending', count: 12 },
  { label: 'Preparing', value: 'preparing', count: 5 },
  { label: 'Ready', value: 'ready', count: 3 },
  { label: 'Done', value: 'done', count: 128 },
  { label: 'Cancelled', value: 'cancelled', count: 8 },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdTabs</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Underline-style tab switcher with optional counts.</p>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Order Status Tabs</h2>
    <section class="mb-10">
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <SdTabs v-model="activeTab" :tabs="orderTabs" />
        <div class="mt-4 text-sm text-sd-text-muted">Showing: {{ activeTab }} orders</div>
      </div>
    </section>
  </div>
</template>
