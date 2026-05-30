<script setup lang="ts">
import { computed } from 'vue';
import { PhTrendDown, PhTrendUp } from '@phosphor-icons/vue';

export type StatVariant = 'purple' | 'success' | 'warning' | 'error' | 'info' | 'orange';

export interface SdStatCardProps {
  value: string | number;
  label: string;
  variant?: StatVariant;
  /**
   * Period-over-period change as a signed percentage (e.g. 18 for +18%,
   * -3 for -3%). Renders a coloured trend chip next to the value. Omit to
   * hide the chip entirely (backward compatible).
   */
  delta?: number;
  /**
   * Whether a positive delta is a good thing (green). Defaults to true.
   * Set false for metrics where down is good — e.g. bounce rate.
   */
  deltaPositiveIsGood?: boolean;
}

const props = withDefaults(defineProps<SdStatCardProps>(), {
  variant: 'purple',
  deltaPositiveIsGood: true,
});

const variantClasses: Record<StatVariant, { icon: string }> = {
  purple: { icon: 'bg-sd-purple-light text-sd-purple' },
  orange: { icon: 'bg-sd-orange/10 text-sd-orange' },
  success: { icon: 'bg-sd-success-light text-sd-success' },
  warning: { icon: 'bg-sd-warning-light text-sd-warning' },
  error: { icon: 'bg-sd-error-light text-sd-error' },
  info: { icon: 'bg-sd-info-light text-sd-info' },
};

const hasDelta = computed(() => props.delta !== undefined);
const deltaUp = computed(() => (props.delta ?? 0) >= 0);
/** Green when the direction matches what's "good" for this metric. */
const deltaIsGood = computed(() => deltaUp.value === props.deltaPositiveIsGood);
const deltaChipClass = computed(() => {
  if ((props.delta ?? 0) === 0) return 'bg-sd-bg-alt text-sd-text-muted';
  return deltaIsGood.value ? 'bg-sd-success-light text-sd-success' : 'bg-sd-error-light text-sd-error';
});
const deltaLabel = computed(() => {
  const d = props.delta ?? 0;
  return `${d > 0 ? '+' : ''}${d}%`;
});
</script>

<template>
  <div class="bg-white rounded-sd-md border border-sd-border p-5 flex items-center gap-4">
    <div
      v-if="$slots.icon"
      class="w-11 h-11 rounded-sd flex items-center justify-center shrink-0"
      :class="variantClasses[variant].icon"
    >
      <slot name="icon" />
    </div>
    <div class="min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <div class="text-xl font-bold text-sd-text font-heading leading-tight">
          {{ value }}
        </div>
        <span
          v-if="hasDelta"
          class="inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums"
          :class="deltaChipClass"
        >
          <component
            :is="deltaUp ? PhTrendUp : PhTrendDown"
            :size="12"
            weight="bold"
          />
          {{ deltaLabel }}
        </span>
      </div>
      <div class="text-[13px] text-sd-text-muted mt-0.5">
        {{ label }}
      </div>
    </div>
  </div>
</template>
