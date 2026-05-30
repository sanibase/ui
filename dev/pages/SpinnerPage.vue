<script setup lang="ts">
import { SdSpinner, SdButton } from '@sanibase/ui';
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdSpinner</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Loading spinner for inline and overlay use.</p>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Sizes</h2>
    <section class="mb-10">
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <div class="flex items-center gap-8">
          <SdSpinner size="sm" label="sm" />
          <SdSpinner size="md" label="md" />
          <SdSpinner size="lg" label="lg" />
          <SdSpinner size="xl" label="xl" />
        </div>
      </div>
    </section>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">In Context</h2>
    <section class="mb-10">
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <div class="flex items-center justify-center py-8 bg-sd-bg-alt rounded-lg">
          <SdSpinner size="lg" label="Loading orders..." />
        </div>
        <SdButton label="Save" variant="primary" loading />
      </div>
    </section>
  </div>
</template>
