<script setup lang="ts">
import { SdSwissMap } from '@sanibase/ui';

const points = [
  { name: 'Zürich', value: 120 },
  { name: 'Schlieren', value: 18 },
  { name: 'Wollerau', value: 9 },
  { name: 'Bern', value: 40 },
  { name: 'Genève', value: 55 },
  { name: 'Lugano', value: 22 },
  { name: 'Basel', value: 33 },
  { name: 'St. Gallen', value: 14 },
  { name: 'Emmenbrücke', value: 6 }, // locality → fills its municipality (Emmen)
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdSwissMap</h1>
    <p class="text-sd-text-secondary text-sm mb-8">
      City-level visitor map of Switzerland (Insights). Visited municipalities are filled by their
      real footprint, heat-coloured by visit count, on a canton base with lakes. Geometry from
      geoBoundaries (cantons + Gemeinden, CC-BY), Natural Earth (lakes, PD), GeoNames (fallback
      centroids, CC-BY) — baked + pre-projected, no runtime map library.
    </p>
    <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-2xl">
      <SdSwissMap :points="points" />
    </div>
  </div>
</template>
