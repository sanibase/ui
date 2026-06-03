<script setup lang="ts">
import { ref } from 'vue';
import { SdGeoMap } from '@sanibase/ui';
import type { GeoTopology } from '@sanibase/ui';

const topology = ref<GeoTopology>('world');

// Sample per-country counts (ISO 3166-1 alpha-2), as Umami's country metric
// reports them.
const worldPoints = [
  { code: 'CH', value: 220 },
  { code: 'DE', value: 95 },
  { code: 'FR', value: 40 },
  { code: 'IT', value: 28 },
  { code: 'GB', value: 33 },
  { code: 'US', value: 60 },
  { code: 'BR', value: 12 },
  { code: 'IN', value: 18 },
  { code: 'JP', value: 9 },
  { code: 'AU', value: 7 },
];
const europePoints = [
  { code: 'CH', value: 220 },
  { code: 'DE', value: 95 },
  { code: 'FR', value: 40 },
  { code: 'IT', value: 28 },
  { code: 'GB', value: 33 },
  { code: 'AT', value: 21 },
  { code: 'ES', value: 14 },
  { code: 'NL', value: 11 },
  { code: 'PL', value: 6 },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdGeoMap</h1>
    <p class="text-sd-text-secondary text-sm mb-6">
      Country-level visitor choropleth (Insights). Countries are filled heat-coloured by visit
      count. Two baked topologies: <code>world</code> (Natural Earth projection) and
      <code>europe</code> (LAEA-Europe). Geometry from Natural Earth (public domain) via world-atlas
      — baked + pre-projected at build time, no runtime map library. Keyed by ISO 3166-1 alpha-2.
    </p>
    <div class="flex items-center gap-2 mb-4">
      <button
        v-for="t in (['world', 'europe'] as GeoTopology[])"
        :key="t"
        type="button"
        class="px-3 py-1.5 text-sm font-medium rounded-sd border"
        :class="topology === t ? 'bg-sd-orange text-white border-sd-orange' : 'border-sd-border text-sd-text-muted'"
        @click="topology = t"
      >
        {{ t }}
      </button>
    </div>
    <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-3xl">
      <SdGeoMap :topology="topology" :points="topology === 'europe' ? europePoints : worldPoints" />
    </div>
  </div>
</template>
