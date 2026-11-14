<script setup lang="ts">
import SdButton, { type ButtonVariant } from './SdButton.vue';

/**
 * A button that shows an icon and no words.
 *
 * Its name is required: `label` becomes both the `aria-label` (what a screen
 * reader says) and the `title` (the hover hint a mouse user gets), so an icon
 * button can no longer ship nameless. Name the thing, not only the verb:
 * "Klein entfernen", not "Entfernen".
 *
 * The size is the admin rule (ADMIN-UI-RULES R0): 32 x 32 with a 16px icon on
 * a wide screen, 44 x 44 with a 20px icon below 640px, where a finger has to
 * hit it. Both sizes are real CSS in the <style> block, so they hold whatever
 * the consumer's Tailwind scans, and they override whatever size the consumer
 * gave the icon component itself.
 */
export type IconButtonVariant = Extract<
  ButtonVariant,
  'ghost' | 'neutral-outline' | 'danger-outline' | 'secondary-outline' | 'primary-outline' | 'primary' | 'secondary' | 'danger'
>;

export interface SdIconButtonProps {
  /** The accessible name and the hover hint. Required. */
  label: string;
  /** A different hover hint than the name, when the name alone says too little. */
  hint?: string;
  variant?: IconButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  /** Pressed state for an on/off icon button (sets aria-pressed). */
  pressed?: boolean;
}

const props = withDefaults(defineProps<SdIconButtonProps>(), {
  hint: undefined,
  variant: 'ghost',
  disabled: false,
  loading: false,
  href: undefined,
  type: 'button',
  pressed: undefined,
});
</script>

<template>
  <SdButton
    icon
    size="sm"
    class="sd-icon-btn"
    :variant="props.variant"
    :disabled="props.disabled"
    :loading="props.loading"
    :href="props.href"
    :type="props.type"
    :aria-label="props.label"
    :title="props.hint ?? props.label"
    :aria-pressed="props.pressed === undefined ? undefined : String(props.pressed)"
  >
    <slot v-if="!props.loading" />
  </SdButton>
</template>

<style>
/*
 * ADMIN-UI-RULES R0: 32px with a 16px icon on a wide screen, 44px with a 20px
 * icon on a phone. Two classes, so it outranks SdButton's own w-8/h-8
 * utilities in any load order.
 */
.sd-btn.sd-icon-btn {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}
.sd-btn.sd-icon-btn > svg,
.sd-btn.sd-icon-btn > span > svg {
  width: 16px;
  height: 16px;
}
@media (max-width: 639.98px) {
  .sd-btn.sd-icon-btn {
    width: 44px;
    height: 44px;
  }
  .sd-btn.sd-icon-btn > svg,
  .sd-btn.sd-icon-btn > span > svg {
    width: 20px;
    height: 20px;
  }
}
</style>
