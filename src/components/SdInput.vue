<script setup lang="ts">
import { computed, ref, useSlots } from 'vue';

export type InputSize = 'sm' | 'md' | 'lg' | 'touch';

export interface SdInputProps {
  modelValue?: string | number;
  label?: string;
  placeholder?: string;
  type?: string;
  size?: InputSize;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  clearable?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
}

const props = withDefaults(defineProps<SdInputProps>(), {
  modelValue: '',
  type: 'text',
  size: 'md',
  clearable: false,
  disabled: false,
  readonly: false,
  required: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
}>();

const slots = useSlots();
const hasLeft = computed(() => !!slots['icon-left']);
const hasRight = computed(() => !!slots['icon-right']);
const showClear = computed(() => props.clearable && props.modelValue !== '' && props.modelValue !== undefined && !props.disabled && !props.readonly);
const passwordVisible = ref(false);
const isPassword = computed(() => props.type === 'password');
const resolvedType = computed(() => {
  if (props.type === 'password') return passwordVisible.value ? 'text' : 'password';
  if (props.type === 'swiss-number') return 'text';
  // 'numeric' surfaces the digits-only on-screen keypad on touch via
  // inputmode but keeps the underlying HTML type='text' so callers
  // can drive their own masking (date / time auto-format, PIN entry).
  if (props.type === 'numeric') return 'text';
  return props.type;
});

const sizeClasses: Record<InputSize, { wrapper: string; input: string; label: string; affix: string }> = {
  sm: {
    wrapper: 'h-8',
    input: 'text-[13px] px-2.5',
    label: 'text-xs mb-1',
    affix: 'text-[13px]',
  },
  md: {
    wrapper: 'h-[38px]',
    input: 'text-sm px-3',
    label: 'text-[13px] mb-1.5',
    affix: 'text-sm',
  },
  lg: {
    wrapper: 'h-[46px]',
    input: 'text-[15px] px-3.5',
    label: 'text-sm mb-1.5',
    affix: 'text-[15px]',
  },
  touch: {
    wrapper: 'h-14',
    input: 'text-base px-4',
    label: 'text-sm mb-2',
    affix: 'text-base',
  },
};

const wrapperClasses = computed(() => [
  'flex items-center rounded-lg border bg-white transition-all duration-150',
  sizeClasses[props.size].wrapper,
  props.error
    ? 'border-sd-error focus-within:ring-2 focus-within:ring-sd-error/20'
    : 'border-sd-border focus-within:border-sd-orange focus-within:ring-2 focus-within:ring-sd-orange/10',
  props.disabled ? 'opacity-40 pointer-events-none bg-sd-bg-alt' : '',
]);

function formatSwissNumber(value: string): string {
  const parts = value.replace(/'/g, '').split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
}

const inputMasks: Record<string, RegExp> = {
  tel: /[^0-9+\-() ]/g,
  'swiss-number': /[^0-9.]/g,
};

function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  let raw = target.value;

  const mask = inputMasks[props.type];
  if (mask) {
    raw = raw.replace(mask, '');
    if (props.type === 'swiss-number') {
      const formatted = formatSwissNumber(raw);
      target.value = formatted;
      emit('update:modelValue', raw);
      return;
    }
    target.value = raw;
  }

  emit('update:modelValue', props.type === 'number' ? Number(raw) : raw);
}

function clear() {
  emit('update:modelValue', props.type === 'number' ? 0 : '');
}

const displayValue = computed(() => {
  if (props.type === 'swiss-number' && props.modelValue !== '' && props.modelValue !== undefined) {
    return formatSwissNumber(String(props.modelValue));
  }
  return props.modelValue;
});
</script>

<template>
  <div class="w-full min-w-0">
    <label
      v-if="label"
      class="block font-medium text-sd-text-muted"
      :class="sizeClasses[size].label"
    >
      {{ label }}
      <span
        v-if="required"
        class="text-sd-error"
      >*</span>
    </label>

    <div :class="wrapperClasses">
      <span
        v-if="hasLeft"
        class="pl-3 flex items-center text-sd-text-muted shrink-0"
      >
        <slot name="icon-left" />
      </span>

      <span
        v-if="prefix"
        class="pl-3 text-sd-text-muted font-medium shrink-0 select-none"
        :class="sizeClasses[size].affix"
      >
        {{ prefix }}
      </span>

      <input
        :type="resolvedType"
        :inputmode="type === 'swiss-number' ? 'decimal' : type === 'tel' ? 'tel' : type === 'numeric' ? 'numeric' : undefined"
        :value="displayValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        class="w-full h-full bg-transparent outline-none text-sd-text placeholder-sd-text-muted/50"
        :class="[
          sizeClasses[size].input,
          hasLeft ? 'pl-2' : '',
          prefix ? 'pl-1.5' : '',
          (hasRight || showClear || suffix) ? 'pr-2' : '',
        ]"
        @input="onInput"
      >

      <span
        v-if="suffix"
        class="pr-3 text-sd-text-muted font-medium shrink-0 select-none"
        :class="sizeClasses[size].affix"
      >
        {{ suffix }}
      </span>

      <button
        v-if="showClear"
        type="button"
        class="pr-3 flex items-center text-sd-text-muted hover:text-sd-text shrink-0 transition-colors"
        tabindex="-1"
        @click="clear"
      >
        <svg
          class="w-4 h-4"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>

      <button
        v-if="isPassword"
        type="button"
        class="pr-3 flex items-center text-sd-text-muted hover:text-sd-text shrink-0 transition-colors"
        tabindex="-1"
        @click="passwordVisible = !passwordVisible"
      >
        <!-- Eye open (password hidden) -->
        <svg
          v-if="!passwordVisible"
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle
            cx="12"
            cy="12"
            r="3"
            stroke="currentColor"
            stroke-width="1.75"
          />
        </svg>
        <!-- Eye closed (password visible) -->
        <svg
          v-else
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M17.94 17.94A10.07 10.07 0 0112 20c-6.5 0-10-7-10-7a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c6.5 0 10 7 10 7a18.5 18.5 0 01-2.16 3.19"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M1 1l22 22"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
          />
          <path
            d="M14.12 14.12a3 3 0 11-4.24-4.24"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
          />
        </svg>
      </button>

      <span
        v-if="hasRight && !isPassword"
        class="pr-3 flex items-center text-sd-text-muted shrink-0"
      >
        <slot name="icon-right" />
      </span>
    </div>

    <p
      v-if="error"
      class="mt-1 text-xs text-sd-error font-medium"
    >
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      class="mt-1 text-xs text-sd-text-muted"
    >
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
input::-ms-reveal,
input::-ms-clear {
  display: none;
}
</style>
