<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

export interface SwissMapPoint {
  /** City/town name as reported by analytics (e.g. "Schlieren"). */
  name: string;
  /** Visitor count for this place. */
  value: number;
}

export interface SdSwissMapProps {
  points: SwissMapPoint[];
}

const props = defineProps<SdSwissMapProps>();

/** Must match scripts/gen-swiss-geo.mjs norm() exactly. */
function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

interface Canton {
  iso: string;
  name: string;
  path: string;
}

// Geo assets (~1 MB combined) are dynamically imported so they ship as their
// own chunks, loaded only when this map mounts — never in other pages' bundles.
const viewBox = ref('0 0 800 513');
const cantons = ref<Canton[]>([]);
const lakes = ref<string[]>([]);
const municipalities = ref<Record<string, string>>({});
// name -> containing municipality key (fill that Gemeinde) | [x,y] (bubble fallback)
const towns = ref<Record<string, string | [number, number]>>({});
const loaded = ref(false);

onMounted(async () => {
  const [c, m, l, t] = await Promise.all([
    import('../data/swiss-cantons'),
    import('../data/swiss-municipalities'),
    import('../data/swiss-lakes'),
    import('../data/swiss-towns'),
  ]);
  viewBox.value = c.SWISS_VIEWBOX;
  cantons.value = c.SWISS_CANTONS;
  municipalities.value = m.SWISS_MUNICIPALITIES;
  lakes.value = l.SWISS_LAKES;
  towns.value = t.SWISS_TOWNS;
  loaded.value = true;
});

const maxValue = computed(() => Math.max(...props.points.map((p) => p.value), 1));
/** Heat opacity for a filled municipality: light (few) → strong (many). */
function heat(value: number): number {
  return Math.min(0.9, 0.35 + Math.sqrt(value / maxValue.value) * 0.55);
}

/** Resolve a place name to its municipality key: direct, else its containing Gemeinde. */
function muniKeyFor(name: string): string | null {
  const key = norm(name);
  if (municipalities.value[key]) return key;
  const t = towns.value[key];
  return typeof t === 'string' && municipalities.value[t] ? t : null;
}

interface FilledArea extends SwissMapPoint {
  path: string;
  opacity: number;
}
interface FallbackDot extends SwissMapPoint {
  x: number;
  y: number;
  r: number;
}

// Each point fills the municipality it resolves to (its own Gemeinde, or the
// one physically containing the locality, e.g. Emmenbrücke → Emmen). Multiple
// points resolving to the same Gemeinde merge (counts summed).
const areas = computed<FilledArea[]>(() => {
  if (!loaded.value) return [];
  const byMuni = new Map<string, FilledArea>();
  for (const p of props.points) {
    const mk = muniKeyFor(p.name);
    if (!mk) continue;
    const cur = byMuni.get(mk);
    if (cur) cur.value += p.value;
    else byMuni.set(mk, { name: p.name, value: p.value, path: municipalities.value[mk]!, opacity: 0 });
  }
  return [...byMuni.values()].map((a) => ({ ...a, opacity: heat(a.value) }));
});

// Only places GeoNames knows but that lie outside every municipality (rare,
// near borders) keep a small bubble — so nothing silently disappears.
const dots = computed<FallbackDot[]>(() => {
  if (!loaded.value) return [];
  const out: FallbackDot[] = [];
  for (const p of props.points) {
    if (muniKeyFor(p.name)) continue;
    const t = towns.value[norm(p.name)];
    if (!Array.isArray(t)) continue;
    out.push({ ...p, x: t[0], y: t[1], r: 4 + Math.sqrt(p.value / maxValue.value) * 10 });
  }
  return out;
});

const hovered = ref<SwissMapPoint | null>(null);
</script>

<template>
  <div
    class="relative w-full"
    style="aspect-ratio: 800 / 513"
  >
    <svg
      v-if="loaded"
      :viewBox="viewBox"
      class="w-full h-full"
      role="img"
      aria-label="Visitor map of Switzerland"
    >
      <!-- canton base -->
      <path
        v-for="c in cantons"
        :key="c.iso || c.name"
        :d="c.path"
        fill="#eef0f4"
        stroke="#d6d8e0"
        stroke-width="0.6"
        stroke-linejoin="round"
      />
      <!-- lakes -->
      <path
        v-for="(d, i) in lakes"
        :key="'lake' + i"
        :d="d"
        fill="#d3e3f3"
        stroke="#aecbe8"
        stroke-width="0.4"
        stroke-linejoin="round"
      />
      <!-- visited municipalities, filled (the city's actual footprint) -->
      <path
        v-for="a in areas"
        :key="'area' + a.name"
        :d="a.path"
        fill="#FF8C42"
        :fill-opacity="hovered?.name === a.name ? 0.95 : a.opacity"
        stroke="#e8761f"
        stroke-width="0.6"
        stroke-linejoin="round"
        class="cursor-pointer"
        @mouseenter="hovered = a"
        @mouseleave="hovered = null"
      >
        <title>{{ a.name }}: {{ a.value }}</title>
      </path>
      <!-- fallback bubbles for unmatched names -->
      <circle
        v-for="d in dots"
        :key="'dot' + d.name"
        :cx="d.x"
        :cy="d.y"
        :r="d.r"
        fill="#FF8C42"
        :fill-opacity="hovered?.name === d.name ? 0.9 : 0.5"
        stroke="#e8761f"
        stroke-width="0.8"
        class="cursor-pointer"
        @mouseenter="hovered = d"
        @mouseleave="hovered = null"
      >
        <title>{{ d.name }}: {{ d.value }}</title>
      </circle>
    </svg>

    <!-- reserved-space placeholder until the geo chunks load -->
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

    <!-- attribution (required by the CC-BY / PD sources) -->
    <div class="absolute bottom-1 right-1.5 text-[10px] text-sd-text-muted/60">
      geoBoundaries · GeoNames · Natural Earth
    </div>
  </div>
</template>
