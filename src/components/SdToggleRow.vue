<script setup lang="ts">
import SdToggle from './SdToggle.vue';

export type ToggleRowSize = 'sm' | 'md' | 'touch';

export interface SdToggleRowProps {
  label: string;
  description?: string;
  modelValue?: boolean;
  size?: ToggleRowSize;
  disabled?: boolean;
}

withDefaults(defineProps<SdToggleRowProps>(), {
  modelValue: false,
  size: 'md',
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const paddingClasses: Record<ToggleRowSize, string> = {
  sm: 'py-2.5 px-3',
  md: 'py-3 px-4',
  touch: 'py-4 px-5',
};

const labelClasses: Record<ToggleRowSize, string> = {
  sm: 'text-[13px]',
  md: 'text-sm',
  touch: 'text-base',
};

const descClasses: Record<ToggleRowSize, string> = {
  sm: 'text-xs',
  md: 'text-xs',
  touch: 'text-sm',
};

const toggleSize: Record<ToggleRowSize, 'sm' | 'md' | 'touch'> = {
  sm: 'sm',
  md: 'sm',
  touch: 'touch',
};
</script>

<template>
  <div
    role="switch"
    :aria-checked="modelValue"
    :tabindex="disabled ? -1 : 0"
    class="flex items-center justify-between gap-4 transition-colors rounded-sd-sm select-none"
    :class="[
      paddingClasses[size],
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-sd-purple-subtle',
    ]"
    @click="!disabled && emit('update:modelValue', !modelValue)"
    @keydown.enter.space.prevent="!disabled && emit('update:modelValue', !modelValue)"
  >
    <div class="min-w-0">
      <div
        class="font-medium text-sd-text"
        :class="labelClasses[size]"
      >
        {{ label }}
      </div>
      <p
        v-if="description"
        class="text-sd-text-muted mt-0.5"
        :class="descClasses[size]"
      >
        {{ description }}
      </p>
    </div>
    <SdToggle
      :model-value="modelValue"
      :size="toggleSize[size]"
      :disabled="disabled"
      class="pointer-events-none"
    />
  </div>
</template>
