<script setup lang="ts">
import { PhPlus } from '@phosphor-icons/vue';

/**
 * The page's main "new" on a phone (ADMIN-UI-RULES R2.1): a round orange +
 * at the bottom right, 56px, icon only, named by `label` ("Gericht erfassen").
 *
 * Phone only: it does not draw at 640px and wider, where the same action is
 * the orange "+ Gericht" button in the page header. Put both on the page and
 * hide the header button on a phone (`class="max-sm:hidden"`). A different
 * icon goes in the default slot.
 */
export interface SdFabProps {
  label: string;
  disabled?: boolean;
}

withDefaults(defineProps<SdFabProps>(), { disabled: false });
</script>

<template>
  <button
    type="button"
    class="sd-fab items-center justify-center rounded-full bg-sd-orange text-white shadow-sd-orange transition-transform hover:bg-sd-orange-dark active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sd-orange/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
    :aria-label="label"
    :title="label"
    :disabled="disabled"
  >
    <slot>
      <PhPlus class="sd-fab-icon" />
    </slot>
  </button>
</template>

<style>
.sd-fab {
  display: none;
}
@media (max-width: 639.98px) {
  .sd-fab {
    display: inline-flex;
    position: fixed;
    right: 16px;
    bottom: calc(20px + env(safe-area-inset-bottom, 0px));
    z-index: 40;
    width: 56px;
    height: 56px;
  }
  .sd-fab .sd-fab-icon,
  .sd-fab > svg {
    width: 24px;
    height: 24px;
  }
}
</style>
