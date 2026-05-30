<script setup lang="ts">
import { computed } from 'vue';

export type RadioSize = 'sm' | 'md' | 'lg' | 'touch';

export interface RadioOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SdRadioProps {
  modelValue?: string | number | null;
  options: RadioOption[];
  label?: string;
  size?: RadioSize;
  disabled?: boolean;
  direction?: 'horizontal' | 'vertical';
}

const props = withDefaults(defineProps<SdRadioProps>(), {
  modelValue: null,
  size: 'md',
  disabled: false,
  direction: 'vertical',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
}>();

function select(value: string | number) {
  if (props.disabled) return;
  emit('update:modelValue', value);
}

const sizeClasses: Record<RadioSize, { circle: string; dot: string; label: string; gap: string }> = {
  sm: { circle: 'w-4 h-4', dot: 'w-2 h-2', label: 'text-[13px]', gap: 'gap-2' },
  md: { circle: 'w-[18px] h-[18px]', dot: 'w-2.5 h-2.5', label: 'text-sm', gap: 'gap-2.5' },
  lg: { circle: 'w-5 h-5', dot: 'w-3 h-3', label: 'text-[15px]', gap: 'gap-3' },
  touch: { circle: 'w-6 h-6', dot: 'w-3.5 h-3.5', label: 'text-base', gap: 'gap-3' },
};

function circleClasses(value: string | number, optDisabled?: boolean) {
  const selected = props.modelValue === value;
  return [
    'shrink-0 rounded-full border-2 transition-all duration-150 flex items-center justify-center',
    sizeClasses[props.size].circle,
    selected
      ? 'border-sd-orange bg-white'
      : 'border-sd-gray bg-white hover:border-sd-orange/50',
    (props.disabled || optDisabled) ? 'opacity-40' : 'cursor-pointer',
  ];
}
</script>

<template>
  <div class="w-full">
    <p
      v-if="label"
      class="block font-medium text-sd-text-muted mb-2"
      :class="size === 'sm' ? 'text-xs' : size === 'touch' ? 'text-sm' : 'text-[13px]'"
    >
      {{ label }}
    </p>

    <div :class="direction === 'horizontal' ? 'flex flex-wrap gap-4' : 'flex flex-col gap-2'">
      <label
        v-for="opt in options"
        :key="opt.value"
        class="inline-flex items-center select-none"
        :class="[
          sizeClasses[size].gap,
          (disabled || opt.disabled) ? 'opacity-40 pointer-events-none' : 'cursor-pointer',
        ]"
        @click.prevent="!(disabled || opt.disabled) && select(opt.value)"
      >
        <span :class="circleClasses(opt.value, opt.disabled)">
          <span
            v-if="modelValue === opt.value"
            class="rounded-full bg-sd-orange transition-transform duration-150"
            :class="sizeClasses[size].dot"
          />
        </span>
        <span
          class="text-sd-text"
          :class="sizeClasses[size].label"
        >{{ opt.label }}</span>
      </label>
    </div>
  </div>
</template>
