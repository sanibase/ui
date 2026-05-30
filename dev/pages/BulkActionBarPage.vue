<script setup lang="ts">
import { ref, computed } from 'vue';
import { SdBulkActionBar, SdCheckbox, SdBadge } from '@sanibase/ui';
import type { BulkAction } from '@sanibase/ui';

// Demo items
const items = [
  { id: 1, name: 'Margherita Pizza', category: 'Pizza', price: '14.50' },
  { id: 2, name: 'Caesar Salad', category: 'Salads', price: '12.00' },
  { id: 3, name: 'Pasta Carbonara', category: 'Pasta', price: '16.00' },
  { id: 4, name: 'Tiramisu', category: 'Desserts', price: '8.50' },
  { id: 5, name: 'Espresso', category: 'Drinks', price: '4.00' },
  { id: 6, name: 'Bruschetta', category: 'Starters', price: '9.50' },
];

const selected = ref<number[]>([]);

function toggleItem(id: number) {
  const idx = selected.value.indexOf(id);
  if (idx >= 0) {
    selected.value = selected.value.filter(i => i !== id);
  } else {
    selected.value = [...selected.value, id];
  }
}

function toggleAll() {
  if (selected.value.length === items.length) {
    selected.value = [];
  } else {
    selected.value = items.map(i => i.id);
  }
}

const allSelected = computed(() => selected.value.length === items.length);
const someSelected = computed(() => selected.value.length > 0 && !allSelected.value);

const menuActions: BulkAction[] = [
  { key: 'activate', label: 'Activate', variant: 'outline' },
  { key: 'deactivate', label: 'Deactivate', variant: 'outline' },
  { key: 'delete', label: 'Delete', variant: 'danger' },
];

function handleAction(key: string) {
  alert(`Action: ${key} on ${selected.value.length} items`);
}

function clearSelection() {
  selected.value = [];
}

// Touch demo
const touchSelected = ref<number[]>([1, 3, 5]);

const touchActions: BulkAction[] = [
  { key: 'print', label: 'Print QR', variant: 'primary' },
  { key: 'delete', label: 'Delete', variant: 'danger' },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdBulkActionBar</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Floating bottom bar for bulk operations. Select items to see it appear.</p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Interactive Demo</h2>
      <p class="text-sd-text-muted text-xs mb-3">Select items below. The bar slides up from the bottom.</p>
      <div class="bg-white rounded-sd-md border border-sd-border max-w-lg">
        <!-- Header -->
        <div class="flex items-center gap-3 px-4 py-3 border-b border-sd-border">
          <SdCheckbox
            :model-value="allSelected"
            :indeterminate="someSelected"
            size="sm"
            @update:model-value="toggleAll"
          />
          <span class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide">Menu Items</span>
          <SdBadge v-if="selected.length > 0" :label="`${selected.length} selected`" variant="purple" size="sm" class="ml-auto" />
        </div>
        <!-- Items -->
        <div class="divide-y divide-sd-border-light">
          <div
            v-for="item in items"
            :key="item.id"
            class="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
            :class="selected.includes(item.id) ? 'bg-sd-purple-subtle' : 'hover:bg-sd-bg-alt'"
            @click="toggleItem(item.id)"
          >
            <SdCheckbox :model-value="selected.includes(item.id)" size="sm" />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-sd-text">{{ item.name }}</div>
              <div class="text-xs text-sd-text-muted">{{ item.category }}</div>
            </div>
            <span class="text-sm text-sd-text tabular-nums">CHF {{ item.price }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Touch Size (pre-selected)</h2>
      <p class="text-sd-text-muted text-xs mb-3">Touch bar is taller with larger buttons. See bottom of page.</p>
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5 max-w-sm">
        <p class="text-sm text-sd-text">{{ touchSelected.length }} items selected in touch mode.</p>
        <button
          class="text-sd-purple text-xs font-medium hover:underline mt-2"
          @click="touchSelected = touchSelected.length > 0 ? [] : [1, 3, 5]"
        >
          {{ touchSelected.length > 0 ? 'Clear' : 'Select some' }}
        </button>
      </div>
    </section>

    <div class="mb-10 p-4 bg-sd-purple-subtle rounded-sd-md border border-sd-purple/20 max-w-lg">
      <p class="text-sm text-sd-text">
        Note: Only one bulk bar is shown at a time. The interactive demo bar takes priority.
        Clear the selection above to see the touch bar instead.
      </p>
    </div>

    <!-- Bulk bars -->
    <SdBulkActionBar
      v-if="selected.length > 0"
      :count="selected.length"
      :actions="menuActions"
      @action="handleAction"
      @clear="clearSelection"
    />
    <SdBulkActionBar
      v-else
      :count="touchSelected.length"
      :actions="touchActions"
      size="touch"
      @action="handleAction($event)"
      @clear="touchSelected = []"
    />
  </div>
</template>
