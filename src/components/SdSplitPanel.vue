<script setup lang="ts">
export type SplitRatio = '1/3' | '1/2' | '2/5' | '3/5';

export interface SdSplitPanelProps {
  /** Width ratio of left panel */
  ratio?: SplitRatio;
  /** Breakpoint below which panels stack */
  stackBelow?: 'sm' | 'md' | 'lg';
  /** Gap between panels */
  gap?: 'none' | 'sm' | 'md' | 'lg';
  /** Whether panels have borders */
  bordered?: boolean;
  /** Reverse stack order on mobile (show right panel first) */
  reverseStack?: boolean;
}

withDefaults(defineProps<SdSplitPanelProps>(), {
  ratio: '1/3',
  stackBelow: 'lg',
  gap: 'md',
  bordered: true,
  reverseStack: false,
});

const ratioClasses: Record<SplitRatio, { left: string; right: string }> = {
  '1/3': { left: 'lg:w-1/3', right: 'lg:w-2/3' },
  '1/2': { left: 'lg:w-1/2', right: 'lg:w-1/2' },
  '2/5': { left: 'lg:w-2/5', right: 'lg:w-3/5' },
  '3/5': { left: 'lg:w-3/5', right: 'lg:w-2/5' },
};

// Override breakpoint prefix in ratio classes at render time
const breakpointRatios: Record<string, Record<SplitRatio, { left: string; right: string }>> = {
  sm: {
    '1/3': { left: 'sm:w-1/3', right: 'sm:w-2/3' },
    '1/2': { left: 'sm:w-1/2', right: 'sm:w-1/2' },
    '2/5': { left: 'sm:w-2/5', right: 'sm:w-3/5' },
    '3/5': { left: 'sm:w-3/5', right: 'sm:w-2/5' },
  },
  md: {
    '1/3': { left: 'md:w-1/3', right: 'md:w-2/3' },
    '1/2': { left: 'md:w-1/2', right: 'md:w-1/2' },
    '2/5': { left: 'md:w-2/5', right: 'md:w-3/5' },
    '3/5': { left: 'md:w-3/5', right: 'md:w-2/5' },
  },
  lg: ratioClasses,
};

const gapClasses: Record<string, string> = {
  none: 'gap-0',
  sm: 'gap-3',
  md: 'gap-5',
  lg: 'gap-8',
};

const stackBreakpoint: Record<string, string> = {
  sm: 'sm:flex-row',
  md: 'md:flex-row',
  lg: 'lg:flex-row',
};
</script>

<template>
  <div
    class="flex flex-col w-full"
    :class="[
      stackBreakpoint[stackBelow],
      gapClasses[gap],
      reverseStack ? 'flex-col-reverse' : '',
    ]"
  >
    <!-- Left panel -->
    <div
      class="w-full min-w-0 shrink-0"
      :class="[
        (breakpointRatios[stackBelow] || ratioClasses)[ratio].left,
        bordered ? 'bg-white rounded-sd-md border border-sd-border overflow-hidden' : '',
      ]"
    >
      <slot name="left" />
    </div>

    <!-- Right panel -->
    <div
      class="w-full min-w-0 flex-1"
      :class="[
        (breakpointRatios[stackBelow] || ratioClasses)[ratio].right,
        bordered ? 'bg-white rounded-sd-md border border-sd-border overflow-hidden' : '',
      ]"
    >
      <slot name="right" />
    </div>
  </div>
</template>
