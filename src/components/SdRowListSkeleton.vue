<script setup lang="ts">
/**
 * One skeleton row. Internal to SdRowList, not exported.
 *
 * It exists so the initial-load skeleton and the load-more boundary skeleton
 * cannot drift apart, which they already had: the boundary rows were missing
 * the trailing meta bar, so a list grew a chip on its last three rows the
 * moment it finished paginating.
 */
import { computed } from 'vue';
import { skeletonLineWidths } from '../utils/skeleton-rhythm';

export interface SdRowListSkeletonProps {
  /** Padding and gap classes, shared with the real row. */
  sizeClass: string;
  /** Avatar block size classes. */
  avatarClass: string;
  /** Height class for the title bar. */
  titleHeightClass: string;
  /** Number of text bars. */
  lines: number;
  /** Fixed row height in px, when the list pins rows to a uniform height. */
  height?: number;
}

const props = defineProps<SdRowListSkeletonProps>();

const widths = computed(() => skeletonLineWidths(props.lines));
</script>

<template>
  <div
    class="flex items-center bg-white border border-sd-border rounded-sd-md animate-pulse"
    :class="sizeClass"
    :style="height ? { height: `${height}px` } : undefined"
  >
    <div
      class="shrink-0 rounded-sd bg-sd-bg-alt"
      :class="avatarClass"
    />
    <div class="flex-1 min-w-0 space-y-2">
      <div
        v-for="(w, i) in widths"
        :key="i"
        class="bg-sd-bg-alt rounded"
        :class="[i === 0 ? titleHeightClass : 'h-2.5', w]"
      />
    </div>
    <div class="shrink-0 bg-sd-bg-alt rounded w-16 h-5" />
  </div>
</template>
