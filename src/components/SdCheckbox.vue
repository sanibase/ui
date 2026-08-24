<script setup lang="ts">
import { computed } from 'vue';

export type CheckboxSize = 'sm' | 'md' | 'lg' | 'touch';

export interface SdCheckboxProps {
  modelValue?: boolean;
  label?: string;
  size?: CheckboxSize;
  disabled?: boolean;
  indeterminate?: boolean;
}

const props = withDefaults(defineProps<SdCheckboxProps>(), {
  modelValue: false,
  size: 'md',
  disabled: false,
  indeterminate: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

function toggle() {
  if (props.disabled) return;
  emit('update:modelValue', !props.modelValue);
}

const sizeClasses: Record<CheckboxSize, { box: string; label: string }> = {
  sm: { box: 'w-4 h-4 rounded', label: 'text-[13px]' },
  md: { box: 'w-[18px] h-[18px] rounded', label: 'text-sm' },
  lg: { box: 'w-5 h-5 rounded-[5px]', label: 'text-[15px]' },
  touch: { box: 'w-6 h-6 rounded-md', label: 'text-base' },
};

const isOn = computed(() => props.modelValue || props.indeterminate);

/*
 * While disabled the box is a solid neutral: the dark one when checked, white
 * with a neutral edge when not. Never orange at reduced opacity.
 *
 * The tick stays white and fully opaque, which is the point. The old
 * `opacity-40` sat on this box *and* again on the wrapping <label>; nested
 * opacity multiplies, so a checked box rendered at an effective 0.16 alpha and
 * a disabled checked box was very nearly indistinguishable from an unchecked
 * one. White on the dark neutral measures 6.19:1, so the value is unambiguous.
 */
const boxClasses = computed(() => [
  'shrink-0 border-2 transition-all duration-150 flex items-center justify-center',
  sizeClasses[props.size].box,
  props.disabled
    ? (isOn.value ? 'sd-control-disabled-on' : 'sd-control-disabled-off')
    : (isOn.value
        ? 'bg-sd-orange border-sd-orange'
        : 'bg-white border-sd-gray hover:border-sd-orange/50'),
  props.disabled ? '' : 'cursor-pointer',
]);
</script>

<template>
  <!--
    A <label> has no native disabled state and this one carries the click
    handler, so `pointer-events-none` is the gate and has to stay.
  -->
  <label
    class="flex items-center gap-2 select-none w-fit"
    :class="disabled ? 'pointer-events-none' : 'cursor-pointer'"
    @click.prevent="toggle"
  >
    <span :class="boxClasses">
      <!-- Checkmark -->
      <svg
        v-if="modelValue && !indeterminate"
        class="text-white"
        :class="size === 'touch' ? 'w-4 h-4' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-3 h-3'"
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M2 6l3 3 5-5.5"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <!-- Indeterminate dash -->
      <svg
        v-else-if="indeterminate"
        class="text-white"
        :class="size === 'touch' ? 'w-4 h-4' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-3 h-3'"
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M2.5 6h7"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </span>
    <span
      v-if="label"
      :class="[sizeClasses[size].label, disabled ? 'sd-control-disabled-text' : 'text-sd-text']"
    >{{ label }}</span>
  </label>
</template>
