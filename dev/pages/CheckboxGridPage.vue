<script setup lang="ts">
import { ref } from 'vue';
import { SdCheckboxGrid } from '@sanibase/ui';
import type { CheckboxGridOption } from '@sanibase/ui';

const roles: CheckboxGridOption[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'waiter', label: 'Waiter' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'delivery', label: 'Delivery' },
];

const modifiers: CheckboxGridOption[] = [
  { value: 'extra-cheese', label: 'Extra Cheese' },
  { value: 'no-onion', label: 'No Onion' },
  { value: 'gluten-free', label: 'Gluten Free' },
  { value: 'spicy', label: 'Spicy' },
  { value: 'large', label: 'Large Portion' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'lactose-free', label: 'Lactose Free' },
  { value: 'halal', label: 'Halal' },
];

const services: CheckboxGridOption[] = [
  { value: 'haircut', label: 'Haircut' },
  { value: 'coloring', label: 'Coloring' },
  { value: 'styling', label: 'Styling' },
  { value: 'wash', label: 'Wash & Blow-dry' },
  { value: 'beard', label: 'Beard Trim', disabled: true },
  { value: 'extensions', label: 'Extensions' },
];

const selectedRoles = ref<string[]>(['cashier', 'waiter']);
const selectedModifiers = ref<string[]>(['extra-cheese']);
const selectedServices = ref<string[]>(['haircut', 'coloring']);
const selectedSm = ref<string[]>(['admin']);
const selectedMd = ref<string[]>(['admin', 'manager']);
const selectedTouch = ref<string[]>(['cashier']);
const selected2col = ref<string[]>(['admin']);
const selected4col = ref<string[]>([]);
const selectedDisabled = ref<string[]>(['admin']);
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdCheckboxGrid</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Multi-select checkbox collection in a grid. Used for staff roles, modifiers, services.</p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Staff Roles (3 columns)</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-lg">
        <SdCheckboxGrid
          v-model="selectedRoles"
          :options="roles"
          label="Assign roles"
        />
        <p class="text-xs text-sd-text-muted mt-3">Selected: {{ selectedRoles.join(', ') || 'none' }}</p>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Modifiers (4 columns)</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-2xl">
        <SdCheckboxGrid
          v-model="selectedModifiers"
          :options="modifiers"
          :columns="4"
          label="Available modifiers"
        />
        <p class="text-xs text-sd-text-muted mt-3">Selected: {{ selectedModifiers.join(', ') || 'none' }}</p>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Services (with disabled option)</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-lg">
        <SdCheckboxGrid
          v-model="selectedServices"
          :options="services"
          label="Offered services"
        />
        <p class="text-xs text-sd-text-muted mt-3">Selected: {{ selectedServices.join(', ') || 'none' }}</p>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Sizes</h2>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white rounded-sd-md border border-sd-border p-5">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">sm</h3>
          <SdCheckboxGrid v-model="selectedSm" :options="roles" size="sm" :columns="2" />
        </div>
        <div class="bg-white rounded-sd-md border border-sd-border p-5">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">md (default)</h3>
          <SdCheckboxGrid v-model="selectedMd" :options="roles" size="md" :columns="2" />
        </div>
        <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">touch</h3>
          <SdCheckboxGrid v-model="selectedTouch" :options="roles" size="touch" :columns="2" />
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Column Variants</h2>
      <div class="space-y-6">
        <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-sm">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">2 columns</h3>
          <SdCheckboxGrid v-model="selected2col" :options="roles" :columns="2" />
        </div>
        <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-2xl">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">4 columns</h3>
          <SdCheckboxGrid v-model="selected4col" :options="modifiers" :columns="4" />
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Disabled</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-lg">
        <SdCheckboxGrid v-model="selectedDisabled" :options="roles" disabled label="Cannot edit" />
      </div>
    </section>
  </div>
</template>
