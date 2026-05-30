<script setup lang="ts">
import { computed } from 'vue';

export type ToggleSize = 'sm' | 'md' | 'lg' | 'touch';

export interface SdToggleProps {
  modelValue?: boolean;
  label?: string;
  size?: ToggleSize;
  disabled?: boolean;
}

const props = withDefaults(defineProps<SdToggleProps>(), {
  modelValue: false,
  size: 'md',
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

function toggle() {
  if (props.disabled) return;
  emit('update:modelValue', !props.modelValue);
}

const sizeClasses: Record<ToggleSize, { track: string; knob: string; translate: string; label: string }> = {
  sm: { track: 'w-8 h-[18px]', knob: 'w-3.5 h-3.5', translate: 'translate-x-[14px]', label: 'text-[13px]' },
  md: { track: 'w-11 h-6', knob: 'w-[18px] h-[18px]', translate: 'translate-x-5', label: 'text-sm' },
  lg: { track: 'w-12 h-7', knob: 'w-5 h-5', translate: 'translate-x-[22px]', label: 'text-[15px]' },
  touch: { track: 'w-14 h-8', knob: 'w-6 h-6', translate: 'translate-x-6', label: 'text-base' },
};

const trackClasses = computed(() => [
  'relative rounded-full transition-colors duration-200 cursor-pointer shrink-0',
  sizeClasses[props.size].track,
  props.modelValue ? 'bg-sd-orange' : 'bg-sd-gray',
  props.disabled ? 'opacity-40 pointer-events-none' : '',
]);

const knobClasses = computed(() => [
  'absolute top-1/2 -translate-y-1/2 left-[3px] bg-white rounded-full shadow-sm transition-transform duration-200',
  sizeClasses[props.size].knob,
  props.modelValue ? sizeClasses[props.size].translate : 'translate-x-0',
]);
</script>

<template>
  <label
    class="flex items-center gap-2.5 cursor-pointer select-none w-fit"
    :class="disabled ? 'opacity-40 pointer-events-none' : ''"
    @click.prevent="toggle"
  >
    <span :class="trackClasses">
      <span :class="knobClasses" />
    </span>
    <span
      v-if="label"
      class="text-sd-text"
      :class="sizeClasses[size].label"
    >{{ label }}</span>
  </label>
</template>
