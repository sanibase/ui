<script setup lang="ts">
import { ref } from 'vue';
import { SdPrintOverlay, SdButton } from '@sanibase/ui';

const qrOpen = ref(false);
const reportOpen = ref(false);
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdPrintOverlay</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Full-screen print preview with toolbar. Hides UI chrome when printing.</p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">QR Code Print</h2>
      <SdButton variant="outline" @click="qrOpen = true">Preview QR Codes</SdButton>

      <SdPrintOverlay v-model:open="qrOpen" title="QR Codes -- Table Cards">
        <div class="p-8">
          <div class="grid grid-cols-2 gap-8">
            <div v-for="i in 6" :key="i" class="border border-sd-border rounded-sd-md p-6 text-center">
              <div class="w-32 h-32 mx-auto bg-sd-bg-alt rounded-sd-sm flex items-center justify-center mb-4">
                <span class="text-sd-text-muted text-xs">QR Code</span>
              </div>
              <p class="font-heading font-semibold text-sd-text">Table {{ i }}</p>
              <p class="text-xs text-sd-text-muted mt-1">Scan to order</p>
            </div>
          </div>
        </div>
      </SdPrintOverlay>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Report Print (with toolbar slot)</h2>
      <SdButton variant="outline" @click="reportOpen = true">Preview Weekly Report</SdButton>

      <SdPrintOverlay v-model:open="reportOpen" title="Weekly Report">
        <template #toolbar>
          <SdButton variant="ghost" size="sm">Download PDF</SdButton>
        </template>

        <div class="p-8">
          <h2 class="font-heading text-xl font-bold text-sd-text mb-1">Weekly Sales Report</h2>
          <p class="text-sm text-sd-text-muted mb-6">31 March -- 6 April 2026</p>

          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-sd-border">
                <th class="text-left py-2 text-sd-text-muted font-medium">Day</th>
                <th class="text-right py-2 text-sd-text-muted font-medium">Orders</th>
                <th class="text-right py-2 text-sd-text-muted font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(day, i) in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']" :key="day" class="border-b border-sd-border-light">
                <td class="py-2 text-sd-text">{{ day }}</td>
                <td class="py-2 text-right tabular-nums">{{ [45, 38, 52, 49, 67, 78, 22][i] }}</td>
                <td class="py-2 text-right tabular-nums">CHF {{ [1240, 890, 1560, 1320, 2100, 2450, 680][i].toLocaleString() }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="font-semibold">
                <td class="py-3">Total</td>
                <td class="py-3 text-right tabular-nums">351</td>
                <td class="py-3 text-right tabular-nums">CHF 10,240</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SdPrintOverlay>
    </section>
  </div>
</template>
