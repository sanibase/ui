<script setup lang="ts">
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface SdSpinnerProps {
  size?: SpinnerSize;
  label?: string;
}

withDefaults(defineProps<SdSpinnerProps>(), {
  size: 'md',
});

const sizeClasses: Record<SpinnerSize, { svg: string; text: string }> = {
  sm: { svg: 'w-4 h-4', text: 'text-xs' },
  md: { svg: 'w-5 h-5', text: 'text-sm' },
  lg: { svg: 'w-8 h-8', text: 'text-sm' },
  xl: { svg: 'w-12 h-12', text: 'text-base' },
};
</script>

<template>
  <div
    class="inline-flex items-center gap-2"
    role="status"
  >
    <svg
      class="animate-spin text-sd-orange"
      :class="sizeClasses[size].svg"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="3"
        class="opacity-20"
      />
      <path
        d="M12 2a10 10 0 019.95 9"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
    </svg>
    <span
      v-if="label"
      class="text-sd-text-muted"
      :class="sizeClasses[size].text"
    >{{ label }}</span>
  </div>
</template>
