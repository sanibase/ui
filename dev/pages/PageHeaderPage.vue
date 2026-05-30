<script setup lang="ts">
import { SdPageHeader, SdButton } from '@sanibase/ui';
import { PhPlus, PhDownloadSimple } from '@phosphor-icons/vue';
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdPageHeader</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Title + subtitle + action buttons row. Used at the top of every page.</p>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">With Actions</h2>
    <section class="mb-10">
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <SdPageHeader title="Menu Items" subtitle="Manage your restaurant's menu catalog">
          <template #actions>
            <SdButton label="Export" variant="outline" size="sm">
              <template #icon-left><PhDownloadSimple :size="16" weight="regular" /></template>
            </SdButton>
            <SdButton label="Add Item" variant="primary" size="sm">
              <template #icon-left><PhPlus :size="16" weight="bold" /></template>
            </SdButton>
          </template>
        </SdPageHeader>
      </div>
    </section>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Title Only</h2>
    <section class="mb-10">
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <SdPageHeader title="Dashboard" />
      </div>
    </section>
  </div>
</template>
