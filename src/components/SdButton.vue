<script setup lang="ts">
import { computed } from 'vue';

export type ButtonVariant =
  | 'primary'
  | 'primary-outline'
  | 'secondary'
  | 'secondary-outline'
  | 'success'
  | 'success-outline'
  | 'warning'
  | 'warning-outline'
  | 'info'
  | 'info-outline'
  | 'danger'
  | 'danger-outline'
  | 'ghost'
  | 'hero-primary'
  | 'hero-secondary';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'touch';

export interface SdButtonProps {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
  icon?: boolean;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
}

const props = withDefaults(defineProps<SdButtonProps>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  block: false,
  icon: false,
  type: 'button',
});

const isDisabled = computed(() => props.disabled || props.loading);
const tag = computed(() => (props.href ? 'a' : 'button'));

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-[6px]',
  md: 'h-[38px] px-4 text-sm gap-2 rounded-lg',
  lg: 'h-[46px] px-6 text-[15px] gap-2 rounded-lg',
  touch: 'h-14 px-6 text-base gap-2.5 rounded-xl',
};

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: 'w-8 h-8 rounded-[6px]',
  md: 'w-[38px] h-[38px] rounded-lg',
  lg: 'w-[46px] h-[46px] rounded-lg',
  touch: 'w-14 h-14 rounded-xl',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'text-white font-semibold',
    'bg-sd-orange',
    'hover:bg-sd-orange-dark hover:shadow-sd-orange-sm',
    'active:scale-[0.97]',
  ].join(' '),
  'primary-outline': [
    'text-sd-orange font-semibold',
    'bg-white border border-sd-orange',
    'hover:bg-sd-orange hover:text-white',
    'active:scale-[0.97]',
  ].join(' '),
  secondary: [
    'text-white font-semibold',
    'bg-sd-purple',
    'hover:bg-sd-purple-dark hover:shadow-sd-purple-sm',
    'active:scale-[0.97]',
  ].join(' '),
  'secondary-outline': [
    'text-sd-purple font-semibold',
    'bg-white border border-sd-purple',
    'hover:bg-sd-purple hover:text-white',
    'active:scale-[0.97]',
  ].join(' '),
  success: [
    'text-white font-semibold',
    'bg-sd-success',
    'hover:bg-sd-success-dark',
    'active:scale-[0.97]',
  ].join(' '),
  'success-outline': [
    'text-sd-success font-semibold',
    'bg-white border border-sd-success',
    'hover:bg-sd-success hover:text-white',
    'active:scale-[0.97]',
  ].join(' '),
  warning: [
    'text-white font-semibold',
    'bg-sd-warning',
    'hover:bg-sd-warning-dark',
    'active:scale-[0.97]',
  ].join(' '),
  'warning-outline': [
    'text-sd-warning font-semibold',
    'bg-white border border-sd-warning',
    'hover:bg-sd-warning hover:text-white',
    'active:scale-[0.97]',
  ].join(' '),
  info: [
    'text-white font-semibold',
    'bg-sd-info',
    'hover:bg-sd-info-dark',
    'active:scale-[0.97]',
  ].join(' '),
  'info-outline': [
    'text-sd-info font-semibold',
    'bg-white border border-sd-info',
    'hover:bg-sd-info hover:text-white',
    'active:scale-[0.97]',
  ].join(' '),
  danger: [
    'text-white font-semibold',
    'bg-sd-error',
    'hover:bg-sd-error-dark',
    'active:scale-[0.97]',
  ].join(' '),
  'danger-outline': [
    'text-sd-error font-semibold',
    'bg-white border border-sd-error',
    'hover:bg-sd-error hover:text-white',
    'active:scale-[0.97]',
  ].join(' '),
  ghost: [
    'text-sd-text-secondary font-medium',
    'bg-transparent',
    'hover:bg-sd-bg-surface',
    'active:scale-[0.97]',
  ].join(' '),
  'hero-primary': [
    'text-white font-semibold',
    'sd-btn-hero-primary rounded-full',
    'hover:-translate-y-0.5',
    'active:scale-[0.97]',
  ].join(' '),
  'hero-secondary': [
    'text-white font-semibold',
    'sd-btn-hero-secondary rounded-full',
    'hover:-translate-y-0.5',
    'active:scale-[0.97]',
  ].join(' '),
};

const classes = computed(() => [
  'inline-flex items-center justify-center no-underline whitespace-nowrap',
  'transition-all duration-150 cursor-pointer select-none touch-manipulation',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sd-orange/30 focus-visible:ring-offset-2',
  props.icon ? iconSizeClasses[props.size] : sizeClasses[props.size],
  variantClasses[props.variant],
  props.block ? 'w-full' : '',
  isDisabled.value ? 'opacity-40 pointer-events-none' : '',
]);
</script>

<template>
  <component
    :is="tag"
    :type="href ? undefined : type"
    :href="href"
    :disabled="!href && isDisabled ? true : undefined"
    :class="classes"
  >
    <svg
      v-if="loading"
      class="animate-spin shrink-0"
      :class="size === 'sm' ? 'w-3.5 h-3.5' : size === 'touch' ? 'w-5 h-5' : 'w-4 h-4'"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        class="opacity-25"
      />
      <path
        d="M12 2a10 10 0 019.95 9"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        class="opacity-75"
      />
    </svg>
    <slot name="icon-left" />
    <span
      v-if="label || $slots.default"
      class="inline-flex items-center"
    >
      <slot>{{ label }}</slot>
    </span>
    <slot name="icon-right" />
  </component>
</template>

<style>
.sd-btn-hero-primary {
  background: var(--sd-gradient-brand);
  box-shadow: var(--sd-shadow-orange);
}
.sd-btn-hero-primary:hover {
  box-shadow: var(--sd-shadow-orange-hover);
}
.sd-btn-hero-secondary {
  background: var(--sd-gradient-purple);
  box-shadow: var(--sd-shadow-purple);
}
.sd-btn-hero-secondary:hover {
  box-shadow: var(--sd-shadow-purple-hover);
}
</style>
