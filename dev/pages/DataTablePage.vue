<script setup lang="ts">
import { ref } from 'vue';
import { SdDataTable, SdColumn, SdBadge } from '@sanibase/ui';

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
