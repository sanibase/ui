<script setup lang="ts">
import { SdToast, SdButton, useToast } from '@sanibase/ui';

const toast = useToast();
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdToast</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Auto-dismiss notification popup with variant colors.</p>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Static Examples</h2>
    <section class="mb-10">
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-6 space-y-3 max-w-lg">
        <SdToast message="Order saved successfully." variant="success" :duration="0" />
        <SdToast message="Something went wrong. Please try again." variant="error" :duration="0" />
        <SdToast message="Your session will expire in 5 minutes." variant="warning" :duration="0" />
        <SdToast message="New booking request received." variant="info" :duration="0" />
      </div>
    </section>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Trigger Toasts</h2>
    <section class="mb-10">
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-lg">
        <div class="flex flex-wrap gap-2">
          <SdButton label="Success" variant="success" size="sm" @click="toast.success('Order saved successfully.')" />
          <SdButton label="Error" variant="danger" size="sm" @click="toast.error('Something went wrong.')" />
          <SdButton label="Warning" variant="warning" size="sm" @click="toast.warning('Session expiring soon.')" />
          <SdButton label="Info" variant="info" size="sm" @click="toast.info('New booking received.')" />
        </div>
      </div>

      <div class="fixed bottom-6 right-6 z-[999] flex flex-col gap-2">
        <SdToast
          v-for="t in toast.toasts.value"
          :key="t.id"
          :message="t.message"
          :variant="t.variant"
          :duration="t.duration"
          @close="toast.remove(t.id)"
        />
      </div>
    </section>
  </div>
</template>
