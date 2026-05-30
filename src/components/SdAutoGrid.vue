<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

export type AutoGridSize = 'sm' | 'md' | 'touch';

export interface SdAutoGridProps {
  /** Total number of items */
  count: number;
  /** Minimum column width in pixels */
  minWidth?: number;
  /** Maximum columns allowed */
  maxCols?: number;
  /** Grid gap in pixels */
  gap?: number;
  /** Size preset — overrides minWidth */
  size?: AutoGridSize;
}

const props = withDefaults(defineProps<SdAutoGridProps>(), {
  minWidth: 200,
  maxCols: 6,
  gap: 16,
  size: 'md',
});

const containerRef = ref<HTMLElement>();
const containerWidth = ref(0);

const sizeDefaults: Record<AutoGridSize, number> = {
  sm: 160,
  md: 200,
  touch: 240,
};

const effectiveMinWidth = computed(() => sizeDefaults[props.size] ?? props.minWidth);

const cols = computed(() => {
  if (containerWidth.value === 0) return 1;
  const maxByWidth = Math.floor((containerWidth.value + props.gap) / (effectiveMinWidth.value + props.gap));
  const clamped = Math.min(Math.max(maxByWidth, 1), props.maxCols);
  // Don't use more columns than items
  return Math.min(clamped, props.count || 1);
});

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${cols.value}, minmax(0, 1fr))`,
  gap: `${props.gap}px`,
}));

let observer: ResizeObserver | null = null;

onMounted(() => {
  if (!containerRef.value) return;
  containerWidth.value = containerRef.value.offsetWidth;
  observer = new ResizeObserver((entries) => {
    containerWidth.value = entries[0].contentRect.width;
  });
  observer.observe(containerRef.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<template>
  <div
    ref="containerRef"
    :style="gridStyle"
  >
    <slot :cols="cols" />
  </div>
</template>
