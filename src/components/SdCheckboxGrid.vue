<script setup lang="ts">
import { computed } from 'vue';
import SdCheckbox from './SdCheckbox.vue';

export type CheckboxGridSize = 'sm' | 'md' | 'touch';

export interface CheckboxGridOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SdCheckboxGridProps {
  options: CheckboxGridOption[];
  modelValue?: string[];
  label?: string;
  columns?: 2 | 3 | 4;
  size?: CheckboxGridSize;
  disabled?: boolean;
}

const props = withDefaults(defineProps<SdCheckboxGridProps>(), {
  modelValue: () => [],
  columns: 3,
  size: 'md',
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

function toggle(optionValue: string) {
  if (props.disabled) return;
  const current = [...props.modelValue];
  const idx = current.indexOf(optionValue);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push(optionValue);
  }
  emit('update:modelValue', current);
}

function isChecked(optionValue: string): boolean {
  return props.modelValue.includes(optionValue);
}

const allSelected = computed(() =>
  props.options.filter(o => !o.disabled).every(o => props.modelValue.includes(o.value)),
);

const someSelected = computed(() =>
  props.options.some(o => props.modelValue.includes(o.value)) && !allSelected.value,
);

function toggleAll() {
  if (props.disabled) return;
  const enabledValues = props.options.filter(o => !o.disabled).map(o => o.value);
  if (allSelected.value) {
    // Remove all enabled values, keep any disabled that were somehow in the list
    const disabledInList = props.modelValue.filter(
      v => props.options.find(o => o.value === v)?.disabled,
    );
    emit('update:modelValue', disabledInList);
  } else {
    // Add all enabled values, keep existing
    const merged = new Set([...props.modelValue, ...enabledValues]);
    emit('update:modelValue', [...merged]);
  }
}

const checkboxSize: Record<CheckboxGridSize, 'sm' | 'md' | 'touch'> = {
  sm: 'sm',
  md: 'md',
  touch: 'touch',
};

const gridClasses = computed(() => {
  const cols: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  };
  const gap: Record<CheckboxGridSize, string> = {
    sm: 'gap-x-4 gap-y-2',
    md: 'gap-x-5 gap-y-3',
    touch: 'gap-x-6 gap-y-4',
  };
  return [cols[props.columns], gap[props.size]];
});

const labelClasses: Record<CheckboxGridSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  touch: 'text-base',
};

const selectAllClasses: Record<CheckboxGridSize, string> = {
  sm: 'text-xs pb-2 mb-2',
  md: 'text-sm pb-3 mb-3',
  touch: 'text-base pb-4 mb-4',
};
</script>

<template>
  <div :class="disabled ? 'opacity-50 pointer-events-none' : ''">
    <div
      v-if="label"
      class="font-medium text-sd-text mb-2"
      :class="labelClasses[size]"
    >
      {{ label }}
    </div>

    <!-- Select all -->
    <div
      v-if="options.length > 1"
      class="border-b border-sd-border"
      :class="selectAllClasses[size]"
    >
      <SdCheckbox
        :model-value="allSelected"
        :indeterminate="someSelected"
        :size="checkboxSize[size]"
        label="Select all"
        @update:model-value="toggleAll"
      />
    </div>

    <!-- Grid -->
    <div
      class="grid"
      :class="gridClasses"
    >
      <SdCheckbox
        v-for="opt in options"
        :key="opt.value"
        :model-value="isChecked(opt.value)"
        :label="opt.label"
        :size="checkboxSize[size]"
        :disabled="opt.disabled"
        @update:model-value="toggle(opt.value)"
      />
    </div>
  </div>
</template>
