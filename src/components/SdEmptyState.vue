<script setup lang="ts">
export interface SdEmptyStateProps {
  title: string;
  description?: string;
}

defineProps<SdEmptyStateProps>();
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-6 text-center">
    <div
      v-if="$slots.icon"
      class="text-sd-text-muted/30 mb-4"
    >
      <slot name="icon" />
    </div>
    <h3 class="text-base font-semibold text-sd-text mb-1">
      {{ title }}
    </h3>
    <p
      v-if="description"
      class="text-[13px] text-sd-text-muted max-w-xs"
    >
      {{ description }}
    </p>
    <div
      v-if="$slots.action"
      class="mt-4"
    >
      <slot name="action" />
    </div>
  </div>
</template>
