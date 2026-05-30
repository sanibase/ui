<script setup lang="ts">
import { SdBadge } from '@sanibase/ui';
import type { BadgeVariant } from '@sanibase/ui';

const variants: { name: string; variant: BadgeVariant }[] = [
  { name: 'Success', variant: 'success' },
  { name: 'Warning', variant: 'warning' },
  { name: 'Error', variant: 'error' },
  { name: 'Info', variant: 'info' },
  { name: 'Purple', variant: 'purple' },
  { name: 'Neutral', variant: 'neutral' },
];

const statusMap: { label: string; variant: BadgeVariant }[] = [
  { label: 'Active', variant: 'success' },
  { label: 'Pending', variant: 'warning' },
  { label: 'Confirmed', variant: 'success' },
  { label: 'Preparing', variant: 'info' },
  { label: 'Ready', variant: 'success' },
  { label: 'Seated', variant: 'info' },
  { label: 'Done', variant: 'neutral' },
  { label: 'Cancelled', variant: 'error' },
  { label: 'Rejected', variant: 'error' },
  { label: 'No Show', variant: 'error' },
  { label: 'Draft', variant: 'neutral' },
  { label: 'Published', variant: 'purple' },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdBadge</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Status badges used across all modules for order, booking, and item states.</p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Variants</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <div class="flex flex-wrap gap-3">
          <SdBadge v-for="v in variants" :key="v.variant" :label="v.name" :variant="v.variant" />
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">With Dot</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <div class="flex flex-wrap gap-3">
          <SdBadge v-for="v in variants" :key="v.variant" :label="v.name" :variant="v.variant" dot />
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Sizes</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <div class="flex flex-wrap items-center gap-3">
          <SdBadge label="sm" variant="purple" size="sm" />
          <SdBadge label="md (default)" variant="purple" size="md" />
          <SdBadge label="lg" variant="purple" size="lg" />
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Status Mapping</h2>
      <p class="text-sd-text-muted text-xs mb-3">Standard status-to-badge mapping used across all modules.</p>
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <div class="flex flex-wrap gap-2">
          <SdBadge v-for="s in statusMap" :key="s.label" :label="s.label" :variant="s.variant" dot />
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">In Context</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-lg">
        <div class="space-y-3">
          <div class="flex items-center justify-between py-2 border-b border-sd-border">
            <span class="text-sm text-sd-text">Order #1042</span>
            <SdBadge label="Preparing" variant="info" dot />
          </div>
          <div class="flex items-center justify-between py-2 border-b border-sd-border">
            <span class="text-sm text-sd-text">Order #1041</span>
            <SdBadge label="Ready" variant="success" dot />
          </div>
          <div class="flex items-center justify-between py-2 border-b border-sd-border">
            <span class="text-sm text-sd-text">Order #1040</span>
            <SdBadge label="Cancelled" variant="error" dot />
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-sm text-sd-text">Order #1039</span>
            <SdBadge label="Done" variant="neutral" dot />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
