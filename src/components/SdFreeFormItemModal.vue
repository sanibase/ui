<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import SdModal from './SdModal.vue';
import SdInput from './SdInput.vue';
import SdTextarea from './SdTextarea.vue';
import SdButton from './SdButton.vue';
import SdPriceInput from './SdPriceInput.vue';

export type FreeFormPricingMode = 'prompt_price' | 'prompt_name_and_price';

export interface SdFreeFormItemModalProps {
  open: boolean;
  pricingMode: FreeFormPricingMode;
  /** Catalog name for prompt_price (read-only); placeholder for prompt_name_and_price. */
  defaultName?: string;
  /** Pre-filled price hint in cents (optional). */
  defaultPriceCents?: number;
  /** Free-form modal is intentionally minimal -- no VAT picker per K6 design. */
  loading?: boolean;
  // Localizable strings — UI package is locale-agnostic; consumers
  // (kiosk POS, mobile POS) pass already-translated text. Defaults are
  // English so a caller that forgets to wire i18n still gets working
  // copy.
  titleNew?: string;
  titleAdd?: string;
  nameLabel?: string;
  namePlaceholder?: string;
  priceLabel?: string;
  quantityLabel?: string;
  notesLabel?: string;
  notesPlaceholder?: string;
  cancelLabel?: string;
  confirmLabel?: string;
}

const props = withDefaults(defineProps<SdFreeFormItemModalProps>(), {
  defaultName: '',
  defaultPriceCents: 0,
  loading: false,
  titleNew: 'Add free-form item',
  titleAdd: 'Add item',
  nameLabel: 'Name',
  namePlaceholder: 'e.g. Special',
  priceLabel: 'Price',
  quantityLabel: 'Quantity',
  notesLabel: 'Notes (optional)',
  notesPlaceholder: 'Kitchen note',
  cancelLabel: 'Cancel',
  confirmLabel: 'Add to order',
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  confirm: [payload: { name: string | undefined; unitPriceCents: number; quantity: number; notes: string }];
}>();

const name = ref('');
const priceCents = ref(0);
const quantity = ref(1);
const notes = ref('');

const isNameEditable = computed(() => props.pricingMode === 'prompt_name_and_price');

// Reset state every time the modal opens so the prior entry doesn't leak in.
watch(() => props.open, (open) => {
  if (open) {
    name.value = props.defaultName;
    priceCents.value = props.defaultPriceCents;
    quantity.value = 1;
    notes.value = '';
  }
});

const isValid = computed(() => {
  if (priceCents.value <= 0) return false;
  if (!Number.isInteger(quantity.value) || quantity.value <= 0 || quantity.value > 99) return false;
  if (isNameEditable.value && !name.value.trim()) return false;
  return true;
});

function decreaseQty() {
  if (quantity.value > 1) quantity.value -= 1;
}
function increaseQty() {
  if (quantity.value < 99) quantity.value += 1;
}

function submit() {
  if (!isValid.value || props.loading) return;
  emit('confirm', {
    name: isNameEditable.value ? name.value.trim() : undefined,
    unitPriceCents: priceCents.value,
    quantity: quantity.value,
    notes: notes.value.trim(),
  });
}

function close() {
  emit('update:open', false);
}
</script>

<template>
  <SdModal
    :open="open"
    :title="isNameEditable ? titleNew : (defaultName || titleAdd)"
    size="sm"
    @update:open="close"
  >
    <div class="flex flex-col gap-4 p-1">
      <!-- Name: editable for K5 (prompt_name_and_price), read-only for K3/K4. -->
      <SdInput
        v-if="isNameEditable"
        v-model="name"
        :label="nameLabel"
        :placeholder="namePlaceholder"
        size="touch"
        required
      />

      <SdPriceInput
        v-model="priceCents"
        :label="priceLabel"
        size="touch"
        :autofocus="!isNameEditable"
        required
      />

      <div>
        <label class="block font-medium text-sd-text-muted text-sm mb-2">{{ quantityLabel }}</label>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="h-14 w-14 rounded-lg border border-sd-border bg-white text-2xl font-semibold text-sd-text disabled:opacity-40"
            :disabled="quantity <= 1"
            @click="decreaseQty"
          >
            -
          </button>
          <div class="flex-1 h-14 flex items-center justify-center rounded-lg border border-sd-border bg-white text-xl font-semibold tabular-nums">
            {{ quantity }}
          </div>
          <button
            type="button"
            class="h-14 w-14 rounded-lg border border-sd-border bg-white text-2xl font-semibold text-sd-text disabled:opacity-40"
            :disabled="quantity >= 99"
            @click="increaseQty"
          >
            +
          </button>
        </div>
      </div>

      <SdTextarea
        v-model="notes"
        :label="notesLabel"
        :rows="2"
        :placeholder="notesPlaceholder"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <SdButton
          variant="ghost"
          @click="close"
        >
          {{ cancelLabel }}
        </SdButton>
        <SdButton
          :disabled="!isValid || loading"
          @click="submit"
        >
          {{ confirmLabel }}
        </SdButton>
      </div>
    </template>
  </SdModal>
</template>
