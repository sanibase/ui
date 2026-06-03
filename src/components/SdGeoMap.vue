<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

export interface GeoMapPoint {
  /** ISO 3166-1 alpha-2 country code as analytics reports it (e.g. "DE"). */
  code: string;
  /** Visitor count for this country. */
  value: number;
}

export type GeoTopology = 'world' | 'europe';

export interface SdGeoMapProps {
  /** Which baked map to render. */
  topology: GeoTopology;
  /** Per-country counts; codes are matched case-insensitively. */
  points: GeoMapPoint[];
}

const props = defineProps<SdGeoMapProps>();

interface GeoCountry {
  code: string;
  name: string;
  path: string;
}

// Geo assets are dynamically imported so each ships as its own chunk, loaded
// only when (and which) map is shown — never in other pages' bundles. Mirrors
// the lazy-data approach in SdSwissMap.
const viewBox = ref('0 0 1000 500');
const shapes = ref<GeoCountry[]>([]);
const loaded = ref(false);

async function loadTopology(topology: GeoTopology): Promise<void> {
  loaded.value = false;
  if (topology === 'europe') {
    const m = await import('../data/europe-countries');
    viewBox.value = m.EUROPE_VIEWBOX;
    shapes.value = m.EUROPE_COUNTRIES;
  } else {
    const m = await import('../data/world-countries');
    viewBox.value = m.WORLD_VIEWBOX;
    shapes.value = m.WORLD_COUNTRIES;
  }
  loaded.value = true;
}

onMounted(() => loadTopology(props.topology));
watch(() => props.topology, (t) => loadTopology(t));

/** code (upper) -> summed value. Tolerates duplicate / lower-case codes. */
const valueByCode = computed(() => {
  const m = new Map<string, number>();
  for (const p of props.points) {
    if (!p.code) continue;
    const k = p.code.toUpperCase();
    m.set(k, (m.get(k) ?? 0) + p.value);
  }
  return m;
});

const maxValue = computed(() => Math.max(...valueByCode.value.values(), 1));

/** Heat opacity for a filled country: light (few) → strong (many). */
function heat(value: number): number {
  return Math.min(0.9, 0.35 + Math.sqrt(value / maxValue.value) * 0.55);
}

interface RenderShape extends GeoCountry {
  value: number;
  opacity: number;
}

const rendered = computed<RenderShape[]>(() =>
  shapes.value.map((c) => {
    const value = valueByCode.value.get(c.code) ?? 0;
    return { ...c, value, opacity: value > 0 ? heat(value) : 0 };
  }),
);

const hovered = ref<RenderShape | null>(null);

/** Aspect ratio straight from the baked viewBox ("0 0 W H") so the box always
 *  hugs the map regardless of which topology/projection is loaded. */
const aspectRatio = computed(() => {
  const [, , w, h] = viewBox.value.split(' ');
  return w && h ? `${w} / ${h}` : '2 / 1';
});
</script>

<template>
  <div
    class="relative w-full"
    :style="{ aspectRatio }"
  >
    <svg
      v-if="loaded"
      :viewBox="viewBox"
      class="w-full h-full"
      role="img"
      :aria-label="topology === 'europe' ? 'Visitor map of Europe' : 'Visitor world map'"
    >
      <path
        v-for="c in rendered"
        :key="c.code"
        :d="c.path"
        :fill="c.value > 0 ? '#FF8C42' : '#eef0f4'"
        :fill-opacity="c.value > 0 ? (hovered?.code === c.code ? 0.95 : c.opacity) : 1"
        stroke="#d6d8e0"
        stroke-width="0.5"
        stroke-linejoin="round"
        :class="c.value > 0 ? 'cursor-pointer' : ''"
        @mouseenter="c.value > 0 ? (hovered = c) : null"
        @mouseleave="hovered = null"
      >
        <title v-if="c.value > 0">{{ c.name }}: {{ c.value }}</title>
      </path>
    </svg>

    <!-- reserved-space placeholder until the geo chunk loads -->
    <div
      v-else
      class="absolute inset-0 flex items-center justify-center"
    >
      <div class="w-6 h-6 rounded-full border-2 border-sd-border border-t-sd-orange animate-spin" />
    </div>

    <!-- hover label -->
    <div
      v-if="hovered"
      class="pointer-events-none absolute top-2 left-2 bg-sd-text text-white text-xs font-medium rounded px-2 py-1 tabular-nums"
    >
      {{ hovered.name }} · {{ hovered.value }}
    </div>

    <!-- heat legend (wordless: light → strong = fewer → more visitors) -->
    <div class="absolute bottom-2 left-2 flex items-center gap-1.5">
      <span class="text-[10px] text-sd-text-muted">−</span>
      <span
        class="h-1.5 w-16 rounded-full"
        style="background: linear-gradient(to right, rgba(255,140,66,0.3), rgba(255,140,66,0.95))"
      />
      <span class="text-[10px] text-sd-text-muted">+</span>
    </div>

    <!-- attribution (Natural Earth is public domain; credited as good practice) -->
    <div class="absolute bottom-1 right-1.5 text-[10px] text-sd-text-muted/60">
      Natural Earth
    </div>
  </div>
</template>
