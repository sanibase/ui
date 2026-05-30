<script setup lang="ts">
import { SdEmptyState, SdButton } from '@sanibase/ui';
import { PhShoppingCart, PhCalendar } from '@phosphor-icons/vue';
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdEmptyState</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Placeholder for empty list views with icon, message, and optional action.</p>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Variants</h2>
    <section class="mb-10">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-sd-md border border-sd-border">
          <SdEmptyState title="No orders yet" description="Orders will appear here once customers start placing them.">
            <template #icon><PhShoppingCart :size="40" weight="light" /></template>
          </SdEmptyState>
        </div>
        <div class="bg-white rounded-sd-md border border-sd-border">
          <SdEmptyState title="No bookings found" description="Try adjusting your filters or create a new booking.">
            <template #icon><PhCalendar :size="40" weight="light" /></template>
            <template #action>
              <SdButton label="New Booking" variant="primary" size="sm" />
            </template>
          </SdEmptyState>
        </div>
      </div>
    </section>
  </div>
</template>
