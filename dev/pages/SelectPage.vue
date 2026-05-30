<script setup lang="ts">
import { ref } from 'vue';
import { SdSelect } from '@sanibase/ui';
import type { SelectOption, SelectSize } from '@sanibase/ui';

const basic = ref<string | null>(null);
const withValue = ref<string | number | null>('chf');
const searchVal = ref<string | null>(null);
const errorVal = ref<string | null>(null);
const sizeVal = ref<string | null>(null);
const multiVal = ref<(string | number)[]>(['waiter', 'host']);
const groupVal = ref<string | null>(null);

const currencies: SelectOption[] = [
  { label: 'CHF - Swiss Franc', value: 'chf' },
  { label: 'EUR - Euro', value: 'eur' },
  { label: 'USD - US Dollar', value: 'usd' },
  { label: 'GBP - British Pound', value: 'gbp' },
];

const roles: SelectOption[] = [
  { label: 'Tenant Owner', value: 'tenant_owner' },
  { label: 'Tenant Manager', value: 'tenant_manager' },
  { label: 'Staff', value: 'tenant_staff' },
  { label: 'Customer', value: 'customer' },
  { label: 'Platform Admin', value: 'platform_admin', disabled: true },
];

const countries: SelectOption[] = [
  { label: 'Switzerland', value: 'ch' },
  { label: 'Germany', value: 'de' },
  { label: 'Austria', value: 'at' },
  { label: 'France', value: 'fr' },
  { label: 'Italy', value: 'it' },
  { label: 'Liechtenstein', value: 'li' },
  { label: 'United Kingdom', value: 'uk' },
  { label: 'United States', value: 'us' },
  { label: 'Netherlands', value: 'nl' },
  { label: 'Belgium', value: 'be' },
  { label: 'Spain', value: 'es' },
  { label: 'Portugal', value: 'pt' },
];

const statuses: SelectOption[] = [
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Cancelled', value: 'cancelled' },
];

const staffRoles: SelectOption[] = [
  { label: 'Head Chef', value: 'head_chef', group: 'Kitchen' },
  { label: 'Line Cook', value: 'line_cook', group: 'Kitchen' },
  { label: 'Dishwasher', value: 'dishwasher', group: 'Kitchen' },
  { label: 'Waiter', value: 'waiter', group: 'Service' },
  { label: 'Host', value: 'host', group: 'Service' },
  { label: 'Bartender', value: 'bartender', group: 'Service' },
  { label: 'Manager', value: 'manager', group: 'Management' },
  { label: 'Owner', value: 'owner', group: 'Management' },
];

const services: SelectOption[] = [
  { label: 'Haircut', value: 'haircut', group: 'Hair' },
  { label: 'Coloring', value: 'coloring', group: 'Hair' },
  { label: 'Blowdry', value: 'blowdry', group: 'Hair' },
  { label: 'Manicure', value: 'manicure', group: 'Nails' },
  { label: 'Pedicure', value: 'pedicure', group: 'Nails' },
  { label: 'Facial', value: 'facial', group: 'Skin' },
  { label: 'Massage', value: 'massage', group: 'Body' },
];

const sizes: { name: string; size: SelectSize }[] = [
  { name: 'sm (32px)', size: 'sm' },
  { name: 'md (38px)', size: 'md' },
  { name: 'lg (46px)', size: 'lg' },
  { name: 'touch (56px)', size: 'touch' },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdSelect</h1>
    <p class="text-sd-text-secondary text-sm mb-8">
      Custom dropdown with keyboard navigation, search, and all sizes. Purple focus/selection.
    </p>

    <!-- Basic -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Basic</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdSelect v-model="basic" :options="currencies" label="Currency" placeholder="Choose currency..." />
        <SdSelect v-model="withValue" :options="currencies" label="Pre-selected" />
        <SdSelect v-model="basic" :options="roles" label="Role" placeholder="Assign role..." hint="Platform Admin is restricted" />
      </div>
    </section>

    <!-- Searchable -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Searchable</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-md">
        <SdSelect v-model="searchVal" :options="countries" label="Country" placeholder="Search country..." searchable />
        <p class="text-xs text-sd-text-muted mt-3">Auto-enabled when options > 8 items (configurable via autoSearchThreshold)</p>
      </div>
    </section>

    <!-- Grouped Options -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Grouped Options</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdSelect v-model="groupVal" :options="staffRoles" label="Staff Role" placeholder="Assign role..." />
      </div>
    </section>

    <!-- Multi-Select -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Multi-Select</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdSelect v-model="multiVal" :options="staffRoles" label="Assigned Roles" placeholder="Select roles..." multiple />
        <p class="text-xs text-sd-text-muted">Selected: {{ multiVal }}</p>
        <SdSelect :options="services" label="Services Offered" placeholder="Pick services..." multiple model-value="[]" hint="Grouped + multi-select combined" />
      </div>
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Sizes</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdSelect
          v-for="s in sizes"
          :key="s.size"
          v-model="sizeVal"
          :options="statuses"
          :size="s.size"
          :label="s.name"
          placeholder="Select status..."
        />
      </div>
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">States</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdSelect v-model="errorVal" :options="currencies" label="With Error" error="Currency is required" />
        <SdSelect :options="currencies" label="Disabled" disabled model-value="chf" />
      </div>
    </section>

    <!-- Desktop vs Touch -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Desktop vs Touch</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-sd-md border border-sd-border p-6">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">Desktop (md)</h3>
          <div class="space-y-3">
            <SdSelect :options="statuses" label="Order Status" placeholder="Filter by status..." size="md" />
            <SdSelect :options="currencies" label="Currency" size="md" model-value="chf" />
          </div>
        </div>
        <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-6">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">Touch / POS (touch)</h3>
          <div class="space-y-3">
            <SdSelect :options="statuses" label="Order Status" placeholder="Filter by status..." size="touch" />
            <SdSelect :options="currencies" label="Currency" size="touch" model-value="chf" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
