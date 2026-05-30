<script setup lang="ts">
import { ref } from 'vue';
import { SdDateNav } from '@sanibase/ui';

const date = ref(new Date());
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdDateNav</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Prev / Today / Next date navigation. Used in calendars and scheduling views.</p>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Default</h2>
    <section class="mb-10">
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-md">
        <SdDateNav v-model="date" />
        <p class="text-xs text-sd-text-muted mt-3">Selected: {{ date.toLocaleDateString('de-CH') }}</p>
      </div>
    </section>
  </div>
</template>
