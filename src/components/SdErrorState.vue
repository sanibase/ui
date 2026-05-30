<script setup lang="ts">
export interface SdErrorStateProps {
  title: string;
  description?: string;
  retryLabel?: string;
}

withDefaults(defineProps<SdErrorStateProps>(), {
  retryLabel: 'Retry',
});

const emit = defineEmits<{
  retry: [];
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-6 text-center">
    <div
      v-if="$slots.icon"
      class="text-sd-error/70 mb-4"
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
    <button
      v-else-if="retryLabel"
      type="button"
      class="mt-4 px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-sd-error hover:bg-sd-error-dark transition-colors"
      @click="emit('retry')"
    >
      {{ retryLabel }}
    </button>
  </div>
</template>
