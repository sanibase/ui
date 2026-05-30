<script setup lang="ts">
import { SdStatCard } from '@sanibase/ui';
import { PhReceipt, PhCurrencyDollar, PhUsers, PhPackage } from '@phosphor-icons/vue';
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdStatCard</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Icon + value + label card for dashboard metrics.</p>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Color Variants</h2>
    <section class="mb-10">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SdStatCard value="156" label="Total Orders" variant="orange">
          <template #icon><PhReceipt :size="22" weight="bold" /></template>
        </SdStatCard>
        <SdStatCard value="CHF 4'280" label="Revenue Today" variant="success">
          <template #icon><PhCurrencyDollar :size="22" weight="bold" /></template>
        </SdStatCard>
        <SdStatCard value="23" label="Active Customers" variant="purple">
          <template #icon><PhUsers :size="22" weight="bold" /></template>
        </SdStatCard>
        <SdStatCard value="8" label="Low Stock Items" variant="warning">
          <template #icon><PhPackage :size="22" weight="bold" /></template>
        </SdStatCard>
      </div>
    </section>
  </div>
</template>
