<script setup lang="ts">
import { computed } from 'vue';

export type BarChartSize = 'sm' | 'md' | 'touch';

export interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

export interface SdBarChartProps {
  items: BarChartItem[];
  size?: BarChartSize;
  /** Show value labels on bars */
  showValues?: boolean;
  /** Format function for value labels */
  formatValue?: (value: number) => string;
  /** Max value (auto-calculated if not provided) */
  max?: number;
}

const props = withDefaults(defineProps<SdBarChartProps>(), {
  size: 'md',
  showValues: true,
});

const maxVal = computed(() => {
  if (props.max !== undefined) return props.max;
  return Math.max(...props.items.map(i => i.value), 1);
});

function pct(value: number): string {
  return `${Math.min((value / maxVal.value) * 100, 100)}%`;
}

function format(value: number): string {
  if (props.formatValue) return props.formatValue(value);
  return String(value);
}

const barHeight: Record<BarChartSize, string> = {
  sm: 'h-5',
  md: 'h-7',
  touch: 'h-10',
};

const labelClasses: Record<BarChartSize, string> = {
  sm: 'text-xs w-16',
  md: 'text-sm w-20',
  touch: 'text-base w-24',
};

const valueClasses: Record<BarChartSize, string> = {
  sm: 'text-[10px]',
  md: 'text-xs',
  touch: 'text-sm',
};

const gapClasses: Record<BarChartSize, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  touch: 'gap-3',
};

const defaultColor = '#FF8C42';
</script>

<template>
  <div
    class="flex flex-col"
    :class="gapClasses[size]"
  >
    <div
      v-for="item in items"
      :key="item.label"
      class="flex items-center gap-2"
    >
      <!-- Label -->
      <span
        class="text-sd-text-muted shrink-0 text-right truncate"
        :class="labelClasses[size]"
      >
        {{ item.label }}
      </span>

      <!-- Bar track -->
      <div
        class="flex-1 bg-sd-bg-alt rounded-sm overflow-hidden"
        :class="barHeight[size]"
      >
        <div
          class="h-full rounded-sm transition-all duration-300 ease-out flex items-center justify-end"
          :style="{
            width: pct(item.value),
            backgroundColor: item.color || defaultColor,
            minWidth: item.value > 0 ? '4px' : '0',
          }"
        >
          <span
            v-if="showValues && item.value > 0"
            class="font-medium tabular-nums px-1.5"
            :class="[
              valueClasses[size],
              parseFloat(pct(item.value)) > 20 ? 'text-white' : 'text-sd-text ml-1',
            ]"
            :style="parseFloat(pct(item.value)) <= 20 ? { position: 'relative', left: '100%', whiteSpace: 'nowrap' } : {}"
          >
            {{ format(item.value) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
