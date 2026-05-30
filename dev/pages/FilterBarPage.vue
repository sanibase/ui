<script setup lang="ts">
import { SdFilterBar, SdInput, SdSelect, SdButton } from '@sanibase/ui';
import type { SelectOption, PillOption } from '@sanibase/ui';
import { PhPlus, PhMagnifyingGlass } from '@phosphor-icons/vue';

const statusOptions: SelectOption[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const categoryOptions: PillOption[] = [
  { label: 'Pizza', value: 'pizza' },
  { label: 'Pasta', value: 'pasta' },
  { label: 'Salads', value: 'salads' },
  { label: 'Desserts', value: 'desserts' },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdFilterBar</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Horizontal bar with search, dropdowns, toggles, and actions.</p>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Typical Usage</h2>
    <section class="mb-10">
      <SdFilterBar>
        <SdInput placeholder="Search items..." size="sm" clearable class="w-56">
          <template #icon-left><PhMagnifyingGlass :size="14" weight="regular" /></template>
        </SdInput>
        <SdSelect :options="statusOptions" placeholder="Status" size="sm" class="w-36" />
        <SdSelect :options="categoryOptions" placeholder="Category" size="sm" class="w-40" />
        <div class="flex-1" />
        <SdButton label="Add Item" variant="primary" size="sm">
          <template #icon-left><PhPlus :size="14" weight="bold" /></template>
        </SdButton>
      </SdFilterBar>
    </section>
  </div>
</template>
