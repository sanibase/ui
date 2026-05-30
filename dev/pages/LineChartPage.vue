<script setup lang="ts">
import { SdLineChart } from '@sanibase/ui';

const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const single = [{ label: 'Pageviews', data: [320, 280, 410, 390, 520, 610, 240] }];

const dual = [
  { label: 'Pageviews', data: [320, 280, 410, 390, 520, 610, 240], color: '#FF8C42' },
  { label: 'Visitors', data: [180, 150, 220, 210, 280, 330, 140], color: '#8B5A9F' },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdLineChart</h1>
    <p class="text-sd-text-secondary text-sm mb-8">
      Chart.js line/area chart for time-series (Insights analytics). SSR-safe — renders after mount.
    </p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Two series (pageviews + visitors)</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-2xl">
        <SdLineChart :labels="labels" :series="dual" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Single series, no legend</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-2xl">
        <SdLineChart :labels="labels" :series="single" :height="200" hide-legend />
      </div>
    </section>
  </div>
</template>
