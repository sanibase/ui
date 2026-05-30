<script setup lang="ts">
import { SdBarChart } from '@sanibase/ui';
import type { BarChartItem } from '@sanibase/ui';

const revenue: BarChartItem[] = [
  { label: 'Mon', value: 1240 },
  { label: 'Tue', value: 890 },
  { label: 'Wed', value: 1560 },
  { label: 'Thu', value: 1320 },
  { label: 'Fri', value: 2100 },
  { label: 'Sat', value: 2450 },
  { label: 'Sun', value: 680 },
];

const categories: BarChartItem[] = [
  { label: 'Pizza', value: 42, color: '#FF8C42' },
  { label: 'Pasta', value: 28, color: '#8B5A9F' },
  { label: 'Salads', value: 15, color: '#22c55e' },
  { label: 'Drinks', value: 35, color: '#3b82f6' },
  { label: 'Desserts', value: 12, color: '#f59e0b' },
];

const orders: BarChartItem[] = [
  { label: 'Dine-in', value: 156 },
  { label: 'Takeaway', value: 89 },
  { label: 'Delivery', value: 67 },
  { label: 'Online', value: 34 },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdBarChart</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Simple CSS bar chart for reports and dashboards.</p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Weekly Revenue</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-lg">
        <SdBarChart
          :items="revenue"
          :format-value="(v: number) => `CHF ${v.toLocaleString()}`"
        />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Category Sales (custom colors)</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-lg">
        <SdBarChart :items="categories" :format-value="(v: number) => `${v} orders`" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Sizes</h2>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white rounded-sd-md border border-sd-border p-5">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">sm</h3>
          <SdBarChart :items="orders" size="sm" />
        </div>
        <div class="bg-white rounded-sd-md border border-sd-border p-5">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">md (default)</h3>
          <SdBarChart :items="orders" size="md" />
        </div>
        <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">touch</h3>
          <SdBarChart :items="orders" size="touch" />
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">No Values</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-sm">
        <SdBarChart :items="orders" :show-values="false" />
      </div>
    </section>
  </div>
</template>
