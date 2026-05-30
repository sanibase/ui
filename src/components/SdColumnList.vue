<script setup lang="ts">
import { computed } from 'vue';

export type ColumnListSize = 'sm' | 'md' | 'touch';
export type ColumnListMode = 'auto' | 'single' | 'scroll';

export interface SdColumnListProps {
  /** 'auto' = split into balanced columns when overflow. 'single' = one column, scrolls if overflow. 'scroll' = single column, always scrollable. */
  mode?: ColumnListMode;
  /** Maximum height before splitting (auto mode) or scrolling (single/scroll mode) */
  maxHeight?: string;
  /** Minimum column width (auto mode only) */
  minColumnWidth?: string;
  /** Gap between items */
  gap?: string;
  size?: ColumnListSize;
}

const props = withDefaults(defineProps<SdColumnListProps>(), {
  mode: 'auto',
  maxHeight: '100%',
  minColumnWidth: '160px',
  gap: '4px',
  size: 'md',
});

const style = computed(() => {
  if (props.mode === 'auto') {
    return {
      columnWidth: props.minColumnWidth,
      columnGap: props.gap,
      columnFill: 'balance' as const,
      height: props.maxHeight,
    };
  }
  return {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: props.gap,
    maxHeight: props.maxHeight,
    overflowY: 'auto' as const,
  };
});
</script>

<template>
  <div
    class="sd-column-list"
    :class="mode !== 'auto' ? 'sd-column-scroll' : ''"
    :style="style"
  >
    <slot />
  </div>
</template>

<style scoped>
.sd-column-list {
  overflow: hidden;
}
.sd-column-list > :deep(*) {
  break-inside: avoid;
}
.sd-column-scroll {
  overflow: hidden auto !important;
}
.sd-column-scroll::-webkit-scrollbar { width: 4px; }
.sd-column-scroll::-webkit-scrollbar-track { background: transparent; }
.sd-column-scroll::-webkit-scrollbar-thumb { background: var(--sd-border); border-radius: 2px; }
</style>
