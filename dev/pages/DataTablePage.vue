<script setup lang="ts">
import { ref } from 'vue';
import { SdDataTable, SdColumn, SdBadge } from '@sanibase/ui';
import type { SdExpandedRows, SdTableRow } from '@sanibase/ui';

// Row expansion, rows mode: a business date opens into its sessions, drawn in
// the table's own columns through the same #body templates.
const days = ref([
  { key: 'd-05', kind: 'day', label: 'Fr 05.09.', count: 2, gross: '3 619.50', card: '2 410.00', sessions: [
    { key: 's-a', kind: 'session', label: 'Sitzung 1', times: '17:00-00:00 · Anna', count: '', gross: '973.50', card: '610.00' },
    { key: 's-b', kind: 'session', label: 'Sitzung 2', times: '00:05-03:10 · Luca', count: '', gross: '2 646.00', card: '1 800.00' },
  ] },
  { key: 'd-06', kind: 'day', label: 'Sa 06.09.', count: 1, gross: '1 300.50', card: '940.00', sessions: [] },
  { key: 'd-07', kind: 'day', label: 'So 07.09.', count: 3, gross: '2 080.00', card: '1 520.00', sessions: [
    { key: 's-c', kind: 'session', label: 'Sitzung 1', times: '11:00-15:00 · Anna', count: '', gross: '480.00', card: '300.00' },
    { key: 's-d', kind: 'session', label: 'Sitzung 2', times: '15:10-19:00 · Elena', count: '', gross: '600.00', card: '420.00' },
    { key: 's-e', kind: 'session', label: 'Sitzung 3', times: '19:05-23:30 · Luca', count: '', gross: '1 000.00', card: '800.00' },
  ] },
]);
const openDays = ref<SdExpandedRows>({});
const sessionsOf = (row: SdTableRow): SdTableRow[] => (row['sessions'] as SdTableRow[]) ?? [];
const hasSessions = (row: SdTableRow): boolean => sessionsOf(row).length > 1;

// Row expansion, block mode: the #expansion slot draws one cell across the table.
const openOrders = ref<SdExpandedRows>({ '#1042': true });

const orders = ref([
  { id: '#1042', customer: 'Hans Meier', total: 'CHF 45.50', status: 'Preparing', variant: 'info' },
  { id: '#1041', customer: 'Anna Schmidt', total: 'CHF 23.00', status: 'Ready', variant: 'success' },
  { id: '#1040', customer: 'Walk-in', total: 'CHF 67.80', status: 'Done', variant: 'neutral' },
  { id: '#1039', customer: 'Peter Keller', total: 'CHF 12.50', status: 'Cancelled', variant: 'error' },
  { id: '#1038', customer: 'Maria Brunner', total: 'CHF 89.00', status: 'Pending', variant: 'warning' },
  { id: '#1037', customer: 'Luca Fischer', total: 'CHF 34.20', status: 'Ready', variant: 'success' },
]);

const paginatedOrders = ref(
  Array.from({ length: 25 }, (_, i) => ({
    id: `#${1050 + i}`,
    customer: ['Hans Meier', 'Anna Schmidt', 'Peter Keller', 'Maria Brunner', 'Luca Fischer', 'Sophie Weber', 'Thomas Huber', 'Elena Roth'][i % 8],
    total: `CHF ${(Math.round((10 + Math.random() * 90) * 100) / 100).toFixed(2)}`,
    status: ['Preparing', 'Ready', 'Done', 'Pending', 'Cancelled'][i % 5],
    variant: ['info', 'success', 'neutral', 'warning', 'error'][i % 5],
  })),
);
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdDataTable</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Sortable table with row actions and pagination. Wraps PrimeVue DataTable.</p>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Basic Table</h2>
    <section class="mb-10">
      <SdDataTable :value="orders" :paginator="false">
        <SdColumn field="id" header="Order" sortable />
        <SdColumn field="customer" header="Customer" sortable />
        <SdColumn field="total" header="Total" sortable />
        <SdColumn field="status" header="Status">
          <template #body="{ data }">
            <SdBadge :label="data.status" :variant="data.variant" dot />
          </template>
        </SdColumn>
      </SdDataTable>
    </section>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Paginated Table</h2>
    <section class="mb-10">
      <SdDataTable :value="paginatedOrders" paginator :rows="5">
        <SdColumn field="id" header="Order" sortable />
        <SdColumn field="customer" header="Customer" sortable />
        <SdColumn field="total" header="Total" sortable />
        <SdColumn field="status" header="Status">
          <template #body="{ data }">
            <SdBadge :label="data.status" :variant="data.variant" dot />
          </template>
        </SdColumn>
      </SdDataTable>
    </section>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Row expansion: child rows in the table's columns</h2>
    <section class="mb-10">
      <p class="text-sd-text-secondary text-sm mb-4">
        <code>expansion-rows</code> draws an open row's children as rows of their own, through the same
        <code>#body</code> templates, so the figures line up under the parent's. A date with one session
        cannot open (<code>row-expandable</code>). Click the caret, Tab to it and press Enter or Space, or
        click anywhere on the row (<code>expand-on-row-click</code>). Open: {{ Object.keys(openDays).join(', ') || 'none' }}
      </p>
      <SdDataTable
        v-model:expanded-rows="openDays"
        :value="days"
        data-key="key"
        :expansion-rows="sessionsOf"
        :row-expandable="hasSessions"
        expand-on-row-click
        expand-label="Sitzungen zeigen"
        collapse-label="Sitzungen ausblenden"
        scroll-height="none"
      >
        <SdColumn header="Datum">
          <template #body="{ data }">
            <span :class="data.kind === 'session' ? 'pl-2 text-sd-text-secondary' : 'font-medium'">{{ data.label }}</span>
          </template>
        </SdColumn>
        <SdColumn header="Sitzungen">
          <template #body="{ data }">
            <span v-if="data.kind === 'session'" class="whitespace-nowrap">{{ data.times }}</span>
            <SdBadge v-else :label="String(data.count)" :variant="openDays[data.key] ? 'purple' : 'neutral'" />
          </template>
        </SdColumn>
        <SdColumn field="gross" header="Brutto" body-style="text-align: right" />
        <SdColumn field="card" header="Karte" body-style="text-align: right" />
      </SdDataTable>
    </section>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Row expansion: free content</h2>
    <section class="mb-10">
      <p class="text-sd-text-secondary text-sm mb-4">
        Without <code>expansion-rows</code>, the <code>#expansion</code> slot draws one cell across the
        whole table. The expander sits at the end here (<code>expander="end"</code>).
      </p>
      <SdDataTable
        v-model:expanded-rows="openOrders"
        :value="orders"
        data-key="id"
        expander="end"
        expand-label="Show order"
        collapse-label="Hide order"
        scroll-height="none"
      >
        <SdColumn field="id" header="Order" />
        <SdColumn field="customer" header="Customer" />
        <SdColumn field="total" header="Total" />
        <template #expansion="{ data }">
          <div class="text-sm text-sd-text-secondary">
            {{ data.customer }} ordered {{ data.total }}. Status: {{ data.status }}.
          </div>
        </template>
      </SdDataTable>
    </section>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Empty Table</h2>
    <section class="mb-10">
      <SdDataTable :value="[]" empty-message="No orders found. Try adjusting your filters.">
        <SdColumn field="id" header="Order" />
        <SdColumn field="customer" header="Customer" />
        <SdColumn field="total" header="Total" />
        <SdColumn field="status" header="Status" />
      </SdDataTable>
    </section>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Loading</h2>
    <section class="mb-10">
      <SdDataTable :value="[]" loading>
        <SdColumn field="id" header="Order" />
        <SdColumn field="customer" header="Customer" />
        <SdColumn field="total" header="Total" />
        <SdColumn field="status" header="Status" />
      </SdDataTable>
    </section>
  </div>
</template>
