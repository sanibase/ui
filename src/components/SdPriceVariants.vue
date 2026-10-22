<script setup lang="ts">
import { computed } from 'vue';
import SdInput from './SdInput.vue';
import SdButton from './SdButton.vue';

export type PriceVariantSize = 'sm' | 'md' | 'touch';

export interface PriceVariant {
  label: string;
  price: string;
}

export interface SdPriceVariantsProps {
  /** Single-price mode: just a string like "12.50" */
  modelValue?: string;
  /** Multi-variant mode: array of { label, price } */
  variants?: PriceVariant[];
  /** Whether multi-variant mode is active */
  multiVariant?: boolean;
  /** Currency symbol shown as prefix */
  currency?: string;
  label?: string;
  size?: PriceVariantSize;
  disabled?: boolean;
  /** The mode switch while variants are shown: back to one price. */
  singlePriceLabel?: string;
  /** The mode switch while one price is shown: on to variants. */
  addVariantsLabel?: string;
  /** Label above the first variant's name field. */
  variantLabel?: string;
  /** Label above the first variant's price field. */
  priceLabel?: string;
  /** Placeholder of each variant's name field. */
  variantPlaceholder?: string;
  /** Accessible name of the x that removes a variant. */
  removeVariantLabel?: string;
  /** The button under the variants that adds one more. */
  addVariantLabel?: string;
}

const props = withDefaults(defineProps<SdPriceVariantsProps>(), {
  modelValue: '',
  variants: () => [],
  multiVariant: false,
  currency: 'CHF',
  size: 'md',
  disabled: false,
  singlePriceLabel: 'Single price',
  addVariantsLabel: 'Add variants',
  variantLabel: 'Variant',
  priceLabel: 'Price',
  variantPlaceholder: 'e.g. Small',
  removeVariantLabel: 'Remove variant',
  addVariantLabel: '+ Add variant',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:variants': [value: PriceVariant[]];
  'update:multiVariant': [value: boolean];
}>();

function updatePrice(value: string | number) {
  emit('update:modelValue', String(value));
}

function updateVariantLabel(index: number, value: string | number) {
  const updated = [...props.variants];
  updated[index] = { ...updated[index], label: String(value) };
  emit('update:variants', updated);
}

function updateVariantPrice(index: number, value: string | number) {
  const updated = [...props.variants];
  updated[index] = { ...updated[index], price: String(value) };
  emit('update:variants', updated);
}

function addVariant() {
  emit('update:variants', [...props.variants, { label: '', price: '' }]);
}

function removeVariant(index: number) {
  const updated = props.variants.filter((_, i) => i !== index);
  emit('update:variants', updated);
}

function toggleMode() {
  const next = !props.multiVariant;
  emit('update:multiVariant', next);
  if (next && props.variants.length === 0) {
    // Seed with one variant carrying over the single price
    emit('update:variants', [{ label: '', price: props.modelValue }]);
  }
}

const inputSize: Record<PriceVariantSize, 'sm' | 'md' | 'touch'> = {
  sm: 'sm',
  md: 'md',
  touch: 'touch',
};

const buttonSize: Record<PriceVariantSize, 'sm' | 'md' | 'touch'> = {
  sm: 'sm',
  md: 'sm',
  touch: 'md',
};

const labelClasses: Record<PriceVariantSize, string> = {
  sm: 'text-xs',
  md: 'text-[13px]',
  touch: 'text-sm',
};

const gapClasses: Record<PriceVariantSize, string> = {
  sm: 'gap-1',
  md: 'gap-1.5',
  touch: 'gap-2',
};

const canRemove = computed(() => props.variants.length > 1);
</script>

<template>
  <div :class="disabled ? 'opacity-50 pointer-events-none' : ''">
    <!-- Header with label and mode toggle -->
    <div class="flex items-center justify-between mb-2">
      <span
        v-if="label"
        class="font-medium text-sd-text-muted"
        :class="labelClasses[size]"
      >
        {{ label }}
      </span>
      <button
        type="button"
        class="text-sd-purple text-xs font-medium hover:underline transition-colors"
        :class="disabled ? 'pointer-events-none' : ''"
        @click="toggleMode"
      >
        {{ multiVariant ? singlePriceLabel : addVariantsLabel }}
      </button>
    </div>

    <!-- Single price mode -->
    <div v-if="!multiVariant">
      <SdInput
        :model-value="modelValue"
        :prefix="currency"
        type="swiss-number"
        placeholder="0.00"
        :size="inputSize[size]"
        :disabled="disabled"
        @update:model-value="updatePrice"
      />
    </div>

    <!-- Multi-variant mode -->
    <div
      v-else
      class="flex flex-col"
      :class="gapClasses[size]"
    >
      <div
        v-for="(variant, i) in variants"
        :key="i"
        class="flex items-end gap-2"
      >
        <div class="flex-1 min-w-0">
          <SdInput
            :model-value="variant.label"
            :placeholder="variantPlaceholder"
            :size="inputSize[size]"
            :disabled="disabled"
            :label="i === 0 ? variantLabel : undefined"
            @update:model-value="updateVariantLabel(i, $event)"
          />
        </div>
        <div class="w-32 shrink-0">
          <SdInput
            :model-value="variant.price"
            :prefix="currency"
            type="swiss-number"
            placeholder="0.00"
            :size="inputSize[size]"
            :disabled="disabled"
            :label="i === 0 ? priceLabel : undefined"
            @update:model-value="updateVariantPrice(i, $event)"
          />
        </div>
        <button
          v-if="canRemove"
          type="button"
          :disabled="disabled"
          :aria-label="removeVariantLabel"
          class="shrink-0 p-1.5 rounded-sd-sm text-sd-error hover:text-red-700 hover:bg-red-50 transition-colors"
          @click="removeVariant(i)"
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
        <!-- Spacer to keep alignment when there's only one variant -->
        <div
          v-else
          class="w-8 shrink-0"
        />
      </div>

      <SdButton
        variant="secondary-outline"
        :size="buttonSize[size]"
        :disabled="disabled"
        @click="addVariant"
      >
        {{ addVariantLabel }}
      </SdButton>
    </div>
  </div>
</template>
