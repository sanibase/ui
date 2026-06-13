<script setup lang="ts">
import { SdKeyValueList, SdCard, SdBadge } from '@sanibase/ui';
import type { KeyValueRow } from '@sanibase/ui';

// Receipt totals — emphasis on the Total, signed/red discount.
const totals: KeyValueRow[] = [
  { label: 'Zwischensumme', value: 'CHF 89.50' },
  { label: 'Rabatt', value: '-CHF 5.00', tone: 'negative' },
  { label: 'Trinkgeld', value: 'CHF 4.50' },
  { label: 'Total', value: 'CHF 89.00', emphasis: true },
];

// Payment panel — value via slot (badge for method), hint for who/when.
const payment: KeyValueRow[] = [
  { label: 'Zahlart', key: 'method' },
  { label: 'Betrag', value: 'CHF 89.00', hint: 'kassiert 12:48 von Beat M.' },
  { label: 'Rueckgeld', value: 'CHF 0.00' },
  { label: 'Referenz', value: 'payrexx_9f3a' },
  { label: 'Erstattung', value: '-CHF 23.00', tone: 'negative', hint: '12.06 14:02 von Beat M. · Reklamation' },
];

// VAT breakdown.
const vat: KeyValueRow[] = [
  { label: 'MwSt 8.1% (Netto CHF 70.30)', value: 'CHF 5.70' },
  { label: 'MwSt 2.6% (Netto CHF 8.16)', value: 'CHF 0.34' },
];

// Line-level meta inside a check, with a voided line struck.
const lineMeta: KeyValueRow[] = [
  { label: '2x Burger Classic', value: 'CHF 19.00', hint: 'erfasst 12:15 · Anna K.' },
  { label: '1x Pommes', value: 'CHF 6.50', hint: 'erfasst 12:15 · Anna K.' },
  { label: '1x Cola 0.5', value: 'CHF 5.00', strike: true, tone: 'muted', hint: 'storniert 12:22 von Beat M. · Falsch erfasst' },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdKeyValueList</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Semantic description list (dl) for labelled field pairs. Label left, value right-aligned with tabular figures. Per-row tone (negative/positive), strike (voids), emphasis (totals) and a muted hint line. Use the #value slot to render badges.</p>

    <!-- ── RECEIPT TOTALS ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Receipt Totals</h2>
    <section class="mb-10 max-w-md">
      <SdCard>
        <SdKeyValueList :items="totals" dividers />
      </SdCard>
    </section>

    <!-- ── PAYMENT PANEL (slot + hints) ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Payment Panel</h2>
    <section class="mb-10 max-w-md">
      <SdCard>
        <SdKeyValueList :items="payment">
          <template #value="{ row }">
            <SdBadge v-if="row.key === 'method'" label="Karte" variant="info" size="sm" />
            <template v-else>{{ row.value }}</template>
          </template>
        </SdKeyValueList>
      </SdCard>
    </section>

    <!-- ── LINE META WITH VOID ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Line Items (with void)</h2>
    <section class="mb-10 max-w-md">
      <SdCard>
        <SdKeyValueList :items="lineMeta" dividers />
      </SdCard>
    </section>

    <!-- ── VAT (small / sm size) ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">VAT Breakdown (size sm)</h2>
    <section class="mb-10 max-w-md">
      <SdCard>
        <SdKeyValueList :items="vat" size="sm" label-width="70%" />
      </SdCard>
    </section>
  </div>
</template>
