<script setup lang="ts">
import { PhCheck } from '@phosphor-icons/vue';

/**
 * A choice among several (ADMIN-UI-RULES R10.2): allergens, categories, days,
 * a filter. Selected = purple fill, white words and a tick; not selected =
 * white with the grey outline. Never orange: orange means "do it".
 *
 * 36px high on a wide screen, 44px on a phone (real CSS below). Use one chip
 * per choice; `v-model:selected` flips it. A count or a small icon goes in the
 * default slot after the words.
 */
export interface SdChipProps {
  selected?: boolean;
  label?: string;
  disabled?: boolean;
  /** Hover hint. */
  title?: string;
  /** Hide the tick (a filter row where the purple fill alone says enough). */
  noTick?: boolean;
}

const props = withDefaults(defineProps<SdChipProps>(), {
  selected: false,
  label: undefined,
  disabled: false,
  title: undefined,
  noTick: false,
});

const emit = defineEmits<{
  'update:selected': [value: boolean];
  click: [event: MouseEvent];
}>();

function onClick(e: MouseEvent): void {
  if (props.disabled) return;
  emit('update:selected', !props.selected);
  emit('click', e);
}
</script>

<template>
  <button
    type="button"
    :aria-pressed="selected ? 'true' : 'false'"
    :disabled="disabled"
    :title="title"
    class="sd-chip inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sd-purple/40 focus-visible:ring-offset-1"
    :class="selected
      ? 'border-sd-purple bg-sd-purple font-semibold text-white'
      : disabled
        ? 'cursor-not-allowed border-sd-border bg-white font-medium text-sd-text-muted'
        : 'border-sd-gray bg-white font-medium text-sd-text-secondary hover:bg-sd-purple-subtle'"
    @click="onClick"
  >
    <PhCheck
      v-if="selected && !noTick"
      class="h-3.5 w-3.5 shrink-0"
      weight="bold"
    />
    <slot>{{ label }}</slot>
  </button>
</template>

<style>
/* ADMIN-UI-RULES R10.3: 36px on a wide screen, 44px on a phone. */
.sd-chip {
  height: 36px;
}
@media (max-width: 639.98px) {
  .sd-chip {
    height: 44px;
  }
}
</style>
