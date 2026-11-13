<script setup lang="ts">
export interface SdPageHeaderProps {
  title: string;
  subtitle?: string;
}

defineProps<SdPageHeaderProps>();
</script>

<template>
  <!-- ADMIN-UI-RULES R6.1: a sub page puts its SdBackLink in #back, top left above the title.
       R2.1: the page's one main "new" goes in #actions (orange, + noun), with an SdFab for the phone. -->
  <div
    v-if="$slots.back"
    class="mb-2 flex"
  >
    <slot name="back" />
  </div>
  <div class="flex items-center justify-between gap-4 mb-6">
    <div class="min-w-0">
      <h1 class="font-heading text-xl font-bold text-sd-text truncate">
        {{ title }}
      </h1>
      <p
        v-if="subtitle"
        class="text-[13px] text-sd-text-muted mt-0.5"
      >
        {{ subtitle }}
      </p>
    </div>
    <div
      v-if="$slots.actions"
      class="flex items-center gap-2 shrink-0"
    >
      <slot name="actions" />
    </div>
  </div>
</template>
