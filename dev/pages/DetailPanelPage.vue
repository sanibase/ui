<script setup lang="ts">
import { ref } from 'vue';
import { SdDetailPanel, SdButton, SdBadge } from '@sanibase/ui';

const orderOpen = ref(false);
const bookingOpen = ref(false);
const largeOpen = ref(false);
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdDetailPanel</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Slide-in panel from the right with fixed header, scrollable body, and footer actions.</p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Order Detail (md)</h2>
      <SdButton variant="outline" @click="orderOpen = true">Open Order Detail</SdButton>

      <SdDetailPanel v-model:open="orderOpen" title="Order #1042" subtitle="Table 5 -- 2 guests">
        <template #header-actions>
          <SdBadge label="In Progress" variant="warning" size="sm" />
        </template>

        <div class="space-y-6">
          <div>
            <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">Items</h3>
            <div class="divide-y divide-sd-border">
              <div class="flex justify-between py-2.5">
                <div>
                  <p class="text-sm font-medium text-sd-text">2x Margherita Pizza</p>
                  <p class="text-xs text-sd-text-muted">Extra cheese, no onion</p>
                </div>
                <span class="text-sm tabular-nums text-sd-text">CHF 29.00</span>
              </div>
              <div class="flex justify-between py-2.5">
                <div>
                  <p class="text-sm font-medium text-sd-text">1x Caesar Salad</p>
                </div>
                <span class="text-sm tabular-nums text-sd-text">CHF 12.00</span>
              </div>
              <div class="flex justify-between py-2.5">
                <div>
                  <p class="text-sm font-medium text-sd-text">2x Espresso</p>
                </div>
                <span class="text-sm tabular-nums text-sd-text">CHF 8.00</span>
              </div>
              <div class="flex justify-between py-2.5">
                <div>
                  <p class="text-sm font-medium text-sd-text">1x Tiramisu</p>
                </div>
                <span class="text-sm tabular-nums text-sd-text">CHF 8.50</span>
              </div>
            </div>
          </div>

          <div class="bg-sd-bg-alt rounded-sd-sm p-4">
            <div class="flex justify-between text-sm">
              <span class="text-sd-text-muted">Subtotal</span>
              <span class="tabular-nums">CHF 57.50</span>
            </div>
            <div class="flex justify-between text-sm mt-1">
              <span class="text-sd-text-muted">VAT (7.7%)</span>
              <span class="tabular-nums">CHF 4.43</span>
            </div>
            <div class="flex justify-between text-base font-semibold mt-2 pt-2 border-t border-sd-border">
              <span>Total</span>
              <span class="tabular-nums">CHF 61.93</span>
            </div>
          </div>

          <div>
            <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">Timeline</h3>
            <div class="space-y-2">
              <div class="flex gap-3 text-sm">
                <span class="text-sd-text-muted tabular-nums w-12 shrink-0">18:42</span>
                <span class="text-sd-text">Order placed</span>
              </div>
              <div class="flex gap-3 text-sm">
                <span class="text-sd-text-muted tabular-nums w-12 shrink-0">18:45</span>
                <span class="text-sd-text">Sent to kitchen</span>
              </div>
              <div class="flex gap-3 text-sm">
                <span class="text-sd-text-muted tabular-nums w-12 shrink-0">19:02</span>
                <span class="text-sd-text">Pizza ready</span>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <SdButton variant="outline" @click="orderOpen = false">Close</SdButton>
          <SdButton variant="primary">Mark Complete</SdButton>
        </template>
      </SdDetailPanel>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Booking Detail (lg)</h2>
      <SdButton variant="outline" @click="bookingOpen = true">Open Booking Detail</SdButton>

      <SdDetailPanel v-model:open="bookingOpen" title="Booking #B-0087" subtitle="Maria Schneider" size="lg">
        <template #header-actions>
          <SdBadge label="Confirmed" variant="success" size="sm" />
        </template>

        <div class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs text-sd-text-muted mb-1">Date</p>
              <p class="text-sm font-medium text-sd-text">Friday, 11 April 2026</p>
            </div>
            <div>
              <p class="text-xs text-sd-text-muted mb-1">Time</p>
              <p class="text-sm font-medium text-sd-text">19:30 - 21:00</p>
            </div>
            <div>
              <p class="text-xs text-sd-text-muted mb-1">Guests</p>
              <p class="text-sm font-medium text-sd-text">4 people</p>
            </div>
            <div>
              <p class="text-xs text-sd-text-muted mb-1">Table</p>
              <p class="text-sm font-medium text-sd-text">Table 8 (terrace)</p>
            </div>
            <div>
              <p class="text-xs text-sd-text-muted mb-1">Phone</p>
              <p class="text-sm font-medium text-sd-text">+41 79 123 45 67</p>
            </div>
            <div>
              <p class="text-xs text-sd-text-muted mb-1">Email</p>
              <p class="text-sm font-medium text-sd-text">maria@example.com</p>
            </div>
          </div>

          <div>
            <p class="text-xs text-sd-text-muted mb-1">Notes</p>
            <p class="text-sm text-sd-text">Birthday dinner. Please prepare a small cake with candles. One guest is vegetarian.</p>
          </div>

          <div>
            <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">History</h3>
            <div class="space-y-2">
              <div class="flex gap-3 text-sm">
                <span class="text-sd-text-muted tabular-nums w-24 shrink-0">05.04.2026</span>
                <span class="text-sd-text">Booking created (online)</span>
              </div>
              <div class="flex gap-3 text-sm">
                <span class="text-sd-text-muted tabular-nums w-24 shrink-0">05.04.2026</span>
                <span class="text-sd-text">Confirmation email sent</span>
              </div>
              <div class="flex gap-3 text-sm">
                <span class="text-sd-text-muted tabular-nums w-24 shrink-0">07.04.2026</span>
                <span class="text-sd-text">Reminder SMS sent</span>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <SdButton variant="ghost" @click="bookingOpen = false">Close</SdButton>
          <SdButton variant="outline">Edit</SdButton>
          <SdButton variant="danger">Cancel Booking</SdButton>
        </template>
      </SdDetailPanel>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Long Content (scrollable, xl)</h2>
      <SdButton variant="outline" @click="largeOpen = true">Open Scrollable Panel</SdButton>

      <SdDetailPanel v-model:open="largeOpen" title="Product: Premium Gift Box" size="xl">
        <div class="space-y-6">
          <p class="text-sm text-sd-text" v-for="i in 12" :key="i">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
            ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
            ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          </p>
        </div>

        <template #footer>
          <SdButton variant="outline" @click="largeOpen = false">Cancel</SdButton>
          <SdButton variant="primary">Save Changes</SdButton>
        </template>
      </SdDetailPanel>
    </section>
  </div>
</template>
