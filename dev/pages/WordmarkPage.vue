<script setup lang="ts">
import { SdWordmark } from '@sanibase/ui';
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdWordmark</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Brand wordmark with gradient suffix. "Sani" in dark, suffix in brand gradient.</p>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Sizes</h2>
    <section class="mb-10 space-y-6">
      <div class="flex items-center gap-8">
        <SdWordmark size="sm" />
        <code class="text-xs text-sd-text-muted">sm</code>
      </div>
      <div class="flex items-center gap-8">
        <SdWordmark size="md" />
        <code class="text-xs text-sd-text-muted">md (default)</code>
      </div>
      <div class="flex items-center gap-8">
        <SdWordmark size="lg" />
        <code class="text-xs text-sd-text-muted">lg</code>
      </div>
      <div class="flex items-center gap-8">
        <SdWordmark size="xl" />
        <code class="text-xs text-sd-text-muted">xl</code>
      </div>
    </section>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">With Icon</h2>
    <section class="mb-10 space-y-6">
      <div class="flex items-center gap-8">
        <SdWordmark size="md" show-icon />
        <code class="text-xs text-sd-text-muted">md + icon</code>
      </div>
      <div class="flex items-center gap-8">
        <SdWordmark size="lg" show-icon />
        <code class="text-xs text-sd-text-muted">lg + icon</code>
      </div>
      <div class="flex items-center gap-8">
        <SdWordmark size="xl" show-icon />
        <code class="text-xs text-sd-text-muted">xl + icon</code>
      </div>
    </section>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Custom Suffix</h2>
    <section class="mb-10 space-y-6">
      <div class="flex items-center gap-8">
        <SdWordmark suffix="Desk" size="lg" show-icon />
        <code class="text-xs text-sd-text-muted">SaniDesk</code>
      </div>
      <div class="flex items-center gap-8">
        <SdWordmark suffix="Meet" size="lg" show-icon />
        <code class="text-xs text-sd-text-muted">SaniMeet</code>
      </div>
      <div class="flex items-center gap-8">
        <SdWordmark suffix="App" size="lg" show-icon />
        <code class="text-xs text-sd-text-muted">SaniApp</code>
      </div>
      <div class="flex items-center gap-8">
        <SdWordmark suffix="POS" size="lg" show-icon />
        <code class="text-xs text-sd-text-muted">SaniPOS</code>
      </div>
    </section>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">On Dark Background</h2>
    <section class="mb-10">
      <div class="bg-sd-bg-dark rounded-sd-md p-8 flex items-center justify-center gap-12">
        <SdWordmark suffix="Desk" size="lg" show-icon class="[&_.sd-error-sani]:text-white [&>span>span:first-child]:text-white" />
      </div>
      <p class="text-xs text-sd-text-muted mt-2">Note: on dark backgrounds, override "Sani" text color to white.</p>
    </section>
  </div>
</template>
