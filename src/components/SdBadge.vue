<script setup lang="ts">
export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'purple' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface SdBadgeProps {
  label?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

withDefaults(defineProps<SdBadgeProps>(), {
  variant: 'neutral',
  size: 'md',
  dot: false,
});

const variantClasses: Record<BadgeVariant, { bg: string; dot: string }> = {
  success: { bg: 'bg-sd-success-light text-sd-success border border-sd-success/20', dot: 'bg-sd-success' },
  warning: { bg: 'bg-sd-warning-light text-sd-warning border border-sd-warning/20', dot: 'bg-sd-warning' },
  error: { bg: 'bg-sd-error-light text-sd-error border border-sd-error/20', dot: 'bg-sd-error' },
  info: { bg: 'bg-sd-info-light text-sd-info border border-sd-info/20', dot: 'bg-sd-info' },
  purple: { bg: 'bg-sd-purple-subtle text-sd-purple border border-sd-purple/20', dot: 'bg-sd-purple' },
  neutral: { bg: 'bg-sd-bg-alt text-sd-text-muted border border-sd-border', dot: 'bg-sd-text-muted' },
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-[11px] px-2 py-0.5',
  lg: 'text-xs px-2.5 py-1',
};
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 font-semibold rounded-[6px] whitespace-nowrap"
    :class="[variantClasses[variant].bg, sizeClasses[size]]"
  >
    <span
      v-if="dot"
      class="w-1.5 h-1.5 rounded-full shrink-0"
      :class="variantClasses[variant].dot"
    />
    <slot>{{ label }}</slot>
  </span>
</template>
