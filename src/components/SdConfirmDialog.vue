<script setup lang="ts">
import SdModal from './SdModal.vue';
import SdButton from './SdButton.vue';

export type ConfirmDialogVariant = 'default' | 'danger';

export interface SdConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
}

const props = withDefaults(defineProps<SdConfirmDialogProps>(), {
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  variant: 'default',
  loading: false,
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  confirm: [];
  cancel: [];
}>();

function close() {
  emit('update:open', false);
  emit('cancel');
}

function confirm() {
  emit('confirm');
}
</script>

<template>
  <SdModal
    :open="open"
    :title="title"
    size="sm"
    @update:open="close"
  >
    <p
      v-if="message"
      class="text-sm text-sd-text-secondary leading-relaxed"
    >
      {{ message }}
    </p>
    <slot v-else />

    <template #footer>
      <!--
        Cancel is a neutral outline, not a ghost: a bare grey label next to a
        filled red or orange button read as a caption rather than as the safe
        way out. The confirm button is unchanged.
      -->
      <SdButton
        :label="cancelLabel"
        variant="neutral-outline"
        size="md"
        :disabled="loading"
        @click="close"
      />
      <SdButton
        :label="confirmLabel"
        :variant="variant === 'danger' ? 'danger' : 'primary'"
        size="md"
        :loading="loading"
        @click="confirm"
      />
    </template>
  </SdModal>
</template>
