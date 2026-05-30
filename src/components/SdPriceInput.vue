<script setup lang="ts">
import { computed, ref } from 'vue';

export type PriceInputSize = 'sm' | 'md' | 'lg' | 'touch';

export interface SdPriceInputProps {
  /** Integer cents. Single source of truth -- never floats. */
  modelValue?: number;
  label?: string;
  /** Currency code shown as a fixed prefix (e.g. "CHF"). */
  currency?: string;
  size?: PriceInputSize;
  /** Inclusive lower bound in cents. Typing below this clamps to min. */
  min?: number;
  /** Inclusive upper bound in cents. Typing above this is rejected. */
  max?: number;
  error?: string;
  hint?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  /** Auto-focus on mount (useful inside the free-form modal). */
  autofocus?: boolean;
}

const props = withDefaults(defineProps<SdPriceInputProps>(), {
  modelValue: 0,
  currency: 'CHF',
  size: 'md',
  min: 0,
  max: 99999900, // CHF 999,999.00 ceiling
  disabled: false,
  readonly: false,
  required: false,
  autofocus: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

const inputRef = ref<HTMLInputElement | null>(null);

const sizeClasses: Record<PriceInputSize, { wrapper: string; input: string; label: string; affix: string }> = {
  sm:    { wrapper: 'h-8',       input: 'text-[13px] px-2.5', label: 'text-xs mb-1',     affix: 'text-[13px]' },
  md:    { wrapper: 'h-[38px]',  input: 'text-sm px-3',       label: 'text-[13px] mb-1.5', affix: 'text-sm' },
  lg:    { wrapper: 'h-[46px]',  input: 'text-[15px] px-3.5', label: 'text-sm mb-1.5',   affix: 'text-[15px]' },
  touch: { wrapper: 'h-14',      input: 'text-base px-4',     label: 'text-sm mb-2',     affix: 'text-base' },
};

const wrapperClasses = computed(() => [
  'flex items-center rounded-lg border bg-white transition-all duration-150',
  sizeClasses[props.size].wrapper,
  props.error
    ? 'border-sd-error focus-within:ring-2 focus-within:ring-sd-error/20'
    : 'border-sd-border focus-within:border-sd-orange focus-within:ring-2 focus-within:ring-sd-orange/10',
  props.disabled ? 'opacity-40 pointer-events-none bg-sd-bg-alt' : '',
]);

function formatCents(cents: number): string {
  const safe = Math.max(0, Math.floor(cents));
  const intPart = Math.floor(safe / 100);
  const fracPart = String(safe % 100).padStart(2, '0');
  return `${intPart}.${fracPart}`;
}

const displayValue = computed(() => formatCents(props.modelValue));

/**
 * Behavior: any keystroke (digit, backspace, paste) is normalized to digit-only,
 * which becomes the new cents value. Typing 1, 2, 5, 0 walks 0.01 -> 0.12 ->
 * 1.25 -> 12.50. Backspace removes the rightmost digit.
 */
function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const digits = target.value.replace(/\D/g, '');
  let cents = digits === '' ? 0 : parseInt(digits, 10);

  if (Number.isNaN(cents)) cents = 0;
  if (cents > props.max) {
    // Reject the keystroke that pushed us over the ceiling -- restore display
    // to the last accepted value.
    target.value = formatCents(props.modelValue);
    return;
  }
  if (cents < props.min) cents = props.min;

  // Re-render the formatted string so the cursor visibly snaps to the right.
  target.value = formatCents(cents);
  emit('update:modelValue', cents);
}

if (props.autofocus) {
  // Defer to next tick so the input is mounted.
  setTimeout(() => inputRef.value?.focus(), 0);
}

defineExpose({ focus: () => inputRef.value?.focus() });
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
        class="pl-3 text-sd-text-muted font-medium shrink-0 select-none"
        :class="sizeClasses[size].affix"
      >
        {{ currency }}
      </span>

      <input
        ref="inputRef"
        type="text"
        inputmode="decimal"
        :value="displayValue"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        class="w-full h-full bg-transparent outline-none text-sd-text text-right tabular-nums"
        :class="[sizeClasses[size].input, 'pl-2 pr-3']"
        @input="onInput"
        @focus="($event.target as HTMLInputElement).select()"
      >
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
