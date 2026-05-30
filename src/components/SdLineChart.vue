<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import Chart from 'primevue/chart';

export interface LineSeries {
  /** Legend label, e.g. "Pageviews". */
  label: string;
  /** Y values, one per `labels` entry. */
  data: number[];
  /** Line + area colour (hex). Defaults to brand orange. */
  color?: string;
}

export interface SdLineChartProps {
  /** X-axis labels (already formatted for display). */
  labels: string[];
  /** One or more series to overlay. */
  series: LineSeries[];
  /** Pixel height of the chart canvas. */
  height?: number;
  /** Hide the legend (single-series charts often don't need it). */
  hideLegend?: boolean;
}

const props = withDefaults(defineProps<SdLineChartProps>(), {
  height: 260,
  hideLegend: false,
});

const DEFAULT_COLOR = '#FF8C42';
const MUTED = '#6b6b80';
const GRID = 'rgba(0,0,0,0.06)';

/** Translucent fill from a hex colour (appends 8-bit alpha). */
function withAlpha(hex: string, alpha = '24'): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alpha}` : hex;
}

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.series.map((s) => {
    const color = s.color ?? DEFAULT_COLOR;
    return {
      label: s.label,
      data: s.data,
      borderColor: color,
      backgroundColor: withAlpha(color),
      fill: true,
      tension: 0.35,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: color,
    };
  }),
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: {
      display: !props.hideLegend,
      position: 'top' as const,
      align: 'end' as const,
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        boxHeight: 8,
        color: MUTED,
        font: { family: 'Inter', size: 12 },
      },
    },
    tooltip: {
      backgroundColor: '#1a1a2e',
      titleFont: { family: 'Inter', size: 12 },
      bodyFont: { family: 'Inter', size: 12 },
      padding: 10,
      cornerRadius: 8,
      displayColors: true,
      usePointStyle: true,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: MUTED, font: { family: 'Inter', size: 11 }, maxRotation: 0, autoSkip: true },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      grid: { color: GRID },
      ticks: { color: MUTED, font: { family: 'Inter', size: 11 }, precision: 0 },
      border: { display: false },
    },
  },
}));

// chart.js touches `window`/canvas, so only render after mount. Keeps the
// component safe under Nuxt SSR and the Vite gallery without <ClientOnly>.
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});
</script>

<template>
  <div :style="{ height: `${height}px` }">
    <Chart
      v-if="mounted"
      type="line"
      :data="chartData"
      :options="chartOptions"
      class="h-full w-full"
    />
  </div>
</template>
