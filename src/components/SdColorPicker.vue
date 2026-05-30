<script setup lang="ts">
import { computed, ref } from 'vue';

export type ColorPickerSize = 'sm' | 'md' | 'touch';

export interface SdColorPickerProps {
  modelValue?: string;
  label?: string;
  size?: ColorPickerSize;
  disabled?: boolean;
  /** Preset swatches to choose from */
  presets?: string[];
}

const props = withDefaults(defineProps<SdColorPickerProps>(), {
  modelValue: '#8B5A9F',
  size: 'md',
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const colorInput = ref<HTMLInputElement | null>(null);

function onNativeChange(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  emit('update:modelValue', val);
}

function onHexInput(e: Event) {
  let val = (e.target as HTMLInputElement).value.trim();
  if (!val.startsWith('#')) val = '#' + val;
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    emit('update:modelValue', val);
  }
}

function openPicker() {
  if (props.disabled) return;
  colorInput.value?.click();
}

function selectPreset(color: string) {
  if (props.disabled) return;
  emit('update:modelValue', color);
}

const displayHex = computed(() => props.modelValue.toUpperCase());

const labelClasses: Record<ColorPickerSize, string> = {
  sm: 'text-xs mb-1',
  md: 'text-[13px] mb-1.5',
  touch: 'text-sm mb-2',
};

const swatchSize: Record<ColorPickerSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  touch: 'w-12 h-12',
};

const previewSize: Record<ColorPickerSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  touch: 'w-14 h-14',
};

const inputHeight: Record<ColorPickerSize, string> = {
  sm: 'h-8 text-[13px]',
  md: 'h-[38px] text-sm',
  touch: 'h-14 text-base',
};

const presetSize: Record<ColorPickerSize, string> = {
  sm: 'w-6 h-6',
  md: 'w-7 h-7',
  touch: 'w-9 h-9',
};
</script>

<template>
  <div :class="disabled ? 'opacity-50 pointer-events-none' : ''">
    <label
      v-if="label"
      class="block font-medium text-sd-text-muted"
      :class="labelClasses[size]"
    >
      {{ label }}
    </label>

    <div class="flex items-center gap-3">
      <!-- Color preview (click opens native picker) -->
      <button
        type="button"
        class="rounded-lg border-2 border-sd-border shrink-0 cursor-pointer transition-shadow
               hover:shadow-sd-sm active:scale-95"
        :class="previewSize[size]"
        :style="{ backgroundColor: modelValue }"
        :disabled="disabled"
        @click="openPicker"
      />

      <!-- Hex input -->
      <div class="flex-1 min-w-0">
        <div
          class="flex items-center rounded-lg border border-sd-border bg-white overflow-hidden
                 focus-within:border-sd-orange focus-within:ring-2 focus-within:ring-sd-orange/10 transition-all"
          :class="inputHeight[size]"
        >
          <span
            class="pl-3 text-sd-text-muted font-mono select-none"
            :class="size === 'sm' ? 'text-xs' : size === 'touch' ? 'text-base' : 'text-sm'"
          >#</span>
          <input
            type="text"
            maxlength="6"
            :value="displayHex.replace('#', '')"
            class="w-full h-full bg-transparent outline-none font-mono text-sd-text pl-1 pr-3 uppercase"
            :class="size === 'sm' ? 'text-xs' : size === 'touch' ? 'text-base' : 'text-sm'"
            :disabled="disabled"
            @change="onHexInput"
          >
        </div>
      </div>

      <!-- Hidden native color input -->
      <input
        ref="colorInput"
        type="color"
        :value="modelValue"
        class="sr-only"
        :disabled="disabled"
        @input="onNativeChange"
      >
    </div>

    <!-- Preset swatches -->
    <div
      v-if="presets && presets.length > 0"
      class="flex flex-wrap gap-2 mt-3"
    >
      <button
        v-for="color in presets"
        :key="color"
        type="button"
        class="rounded-md border-2 transition-all shrink-0"
        :class="[
          presetSize[size],
          modelValue.toLowerCase() === color.toLowerCase()
            ? 'border-sd-orange scale-110 shadow-sd-sm'
            : 'border-transparent hover:border-sd-border hover:scale-105',
        ]"
        :style="{ backgroundColor: color }"
        :disabled="disabled"
        @click="selectPreset(color)"
      />
    </div>
  </div>
</template>
