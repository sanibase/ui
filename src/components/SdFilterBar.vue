<script setup lang="ts">
export interface SdFilterBarProps {
  sticky?: boolean;
}

withDefaults(defineProps<SdFilterBarProps>(), {
  sticky: false,
});
</script>

<template>
  <div
    class="flex items-center gap-3 flex-wrap bg-white border border-sd-border rounded-sd-md px-4 py-3"
    :class="sticky ? 'sticky top-14 z-30' : ''"
  >
    <slot />
  </div>
</template>
