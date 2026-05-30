<script setup lang="ts">
import { ref } from 'vue';
import { SdToggleRow, SdCard } from '@sanibase/ui';

const emailNotif = ref(true);
const pushNotif = ref(false);
const smsAlerts = ref(false);
const darkMode = ref(false);
const autoSync = ref(true);
const offlineMode = ref(true);

const touchOrders = ref(true);
const touchSound = ref(false);
const touchReceipt = ref(true);
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdToggleRow</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Label + description + toggle as a settings row. Click anywhere on the row to toggle.</p>

    <!-- ── BASIC SETTINGS ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Notification Settings</h2>
    <section class="mb-10 max-w-xl">
      <SdCard padding="none">
        <div class="divide-y divide-sd-border">
          <SdToggleRow
            v-model="emailNotif"
            label="Email notifications"
            description="Receive order confirmations and booking updates via email."
          />
          <SdToggleRow
            v-model="pushNotif"
            label="Push notifications"
            description="Get real-time alerts in your browser."
          />
          <SdToggleRow
            v-model="smsAlerts"
            label="SMS alerts"
            description="Critical alerts sent to your phone number."
          />
        </div>
      </SdCard>
    </section>

    <!-- ── WITH DISABLED ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Mixed States</h2>
    <section class="mb-10 max-w-xl">
      <SdCard padding="none">
        <div class="divide-y divide-sd-border">
          <SdToggleRow
            v-model="darkMode"
            label="Dark mode"
            description="Switch to a dark color scheme."
          />
          <SdToggleRow
            v-model="autoSync"
            label="Auto-sync"
            description="Automatically sync data when internet is available."
          />
          <SdToggleRow
            v-model="offlineMode"
            label="Offline mode"
            description="Enable offline caching for POS operations."
            disabled
          />
        </div>
      </SdCard>
      <p class="text-xs text-sd-text-muted mt-2">"Offline mode" is disabled (managed by admin).</p>
    </section>

    <!-- ── TOUCH SIZE ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Touch Size -- POS Settings</h2>
    <section class="mb-10 max-w-xl">
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-4">
        <SdCard padding="none">
          <div class="divide-y divide-sd-border">
            <SdToggleRow
              v-model="touchOrders"
              label="Accept orders"
              description="Allow customers to place new orders."
              size="touch"
            />
            <SdToggleRow
              v-model="touchSound"
              label="Order sound"
              description="Play a sound when a new order arrives."
              size="touch"
            />
            <SdToggleRow
              v-model="touchReceipt"
              label="Auto-print receipt"
              description="Print receipt automatically after payment."
              size="touch"
            />
          </div>
        </SdCard>
      </div>
    </section>
  </div>
</template>
