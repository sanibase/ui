<script setup lang="ts">
import { ref } from 'vue';
import { SdPendingBanner } from '@sanibase/ui';
import type { BannerAction } from '@sanibase/ui';

const showDismissible = ref(true);

const bookingActions: BannerAction[] = [
  { key: 'accept', label: 'Accept', variant: 'primary' },
  { key: 'decline', label: 'Decline', variant: 'outline' },
];

const errorActions: BannerAction[] = [
  { key: 'retry', label: 'Retry', variant: 'danger' },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdPendingBanner</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Warning/info banner with inline action buttons.</p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Warning (pending booking)</h2>
      <div class="max-w-lg">
        <SdPendingBanner
          message="3 new booking requests are waiting for your approval."
          :actions="bookingActions"
          @action="(key: string) => alert(`Action: ${key}`)"
        />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Info</h2>
      <div class="max-w-lg">
        <SdPendingBanner
          message="Your menu changes will be published automatically at 18:00."
          variant="info"
        />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Error (with retry)</h2>
      <div class="max-w-lg">
        <SdPendingBanner
          message="Failed to sync 2 orders. Please check your connection."
          variant="error"
          :actions="errorActions"
          @action="(key: string) => alert(`Action: ${key}`)"
        />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Dismissible</h2>
      <div class="max-w-lg">
        <SdPendingBanner
          v-if="showDismissible"
          message="New feature: you can now accept bookings via WhatsApp."
          variant="info"
          dismissible
          @dismiss="showDismissible = false"
        />
        <button
          v-else
          class="text-sd-purple text-sm font-medium hover:underline"
          @click="showDismissible = true"
        >
          Show banner again
        </button>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Sizes</h2>
      <div class="space-y-4 max-w-lg">
        <div>
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-2">sm</h3>
          <SdPendingBanner message="2 pending requests." size="sm" :actions="[{ key: 'view', label: 'View', variant: 'outline' }]" />
        </div>
        <div>
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-2">md (default)</h3>
          <SdPendingBanner message="2 pending requests waiting for approval." :actions="[{ key: 'view', label: 'View', variant: 'outline' }]" />
        </div>
        <div>
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-2">touch</h3>
          <SdPendingBanner message="2 pending requests waiting for approval." size="touch" :actions="[{ key: 'view', label: 'View', variant: 'outline' }]" />
        </div>
      </div>
    </section>
  </div>
</template>
