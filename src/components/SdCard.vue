<script setup lang="ts">
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface SdCardProps {
  padding?: CardPadding;
  hoverable?: boolean;
  selected?: boolean;
}

withDefaults(defineProps<SdCardProps>(), {
  padding: 'md',
  hoverable: false,
  selected: false,
});

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};
</script>

<template>
  <div
    class="bg-white rounded-sd-md border transition-all duration-150"
    :class="[
      paddingClasses[padding],
      selected ? 'border-sd-orange ring-2 ring-sd-orange/15' : 'border-sd-border',
      hoverable && !selected ? 'hover:shadow-sd hover:border-sd-border cursor-pointer' : '',
    ]"
  >
    <div
      v-if="$slots.header"
      class="mb-4"
    >
      <slot name="header" />
    </div>
    <slot />
    <div
      v-if="$slots.footer"
      class="mt-4 pt-4 border-t border-sd-border"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
