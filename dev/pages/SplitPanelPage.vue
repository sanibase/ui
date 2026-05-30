<script setup lang="ts">
import { ref } from 'vue';
import { SdSplitPanel, SdButton } from '@sanibase/ui';

const activeCategory = ref('Pizza');
const categories = ['Pizza', 'Pasta', 'Salads', 'Desserts', 'Drinks'];
const items: Record<string, string[]> = {
  Pizza: ['Margherita', 'Diavola', 'Quattro Formaggi', 'Prosciutto', 'Capricciosa'],
  Pasta: ['Carbonara', 'Bolognese', 'Aglio e Olio', 'Pesto'],
  Salads: ['Caesar', 'Greek', 'Caprese'],
  Desserts: ['Tiramisu', 'Panna Cotta', 'Gelato'],
  Drinks: ['Espresso', 'Cappuccino', 'Lemonade', 'Wine', 'Beer'],
};
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdSplitPanel</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Two-column builder layout. Stacks vertically on mobile.</p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Menu Builder (1/3 ratio)</h2>
      <SdSplitPanel ratio="1/3">
        <template #left>
          <div class="p-4">
            <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">Categories</h3>
            <div class="space-y-1">
              <button
                v-for="cat in categories"
                :key="cat"
                class="w-full text-left px-3 py-2 rounded-sd-sm text-sm font-medium transition-colors"
                :class="activeCategory === cat
                  ? 'bg-sd-purple text-white'
                  : 'text-sd-text hover:bg-sd-purple-subtle'"
                @click="activeCategory = cat"
              >
                {{ cat }}
              </button>
            </div>
          </div>
        </template>
        <template #right>
          <div class="p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-heading text-base font-semibold text-sd-text">{{ activeCategory }}</h3>
              <SdButton variant="primary" size="sm">+ Add Item</SdButton>
            </div>
            <div class="divide-y divide-sd-border">
              <div
                v-for="item in items[activeCategory]"
                :key="item"
                class="flex items-center justify-between py-3"
              >
                <span class="text-sm text-sd-text">{{ item }}</span>
                <SdButton variant="ghost" size="sm">Edit</SdButton>
              </div>
            </div>
          </div>
        </template>
      </SdSplitPanel>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Equal Split (1/2 ratio)</h2>
      <SdSplitPanel ratio="1/2">
        <template #left>
          <div class="p-5">
            <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">Source</h3>
            <p class="text-sm text-sd-text">Left panel content. This could be a list of available items to drag from.</p>
            <div class="mt-4 space-y-2">
              <div v-for="i in 4" :key="i" class="h-10 bg-sd-bg-alt rounded-sd-sm border border-sd-border flex items-center px-3">
                <span class="text-sm text-sd-text-muted">Item {{ i }}</span>
              </div>
            </div>
          </div>
        </template>
        <template #right>
          <div class="p-5">
            <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">Target</h3>
            <p class="text-sm text-sd-text">Right panel content. Drop zone for building a layout or ordering items.</p>
            <div class="mt-4 h-40 border-2 border-dashed border-sd-border rounded-sd-md flex items-center justify-center">
              <span class="text-sm text-sd-text-muted">Drop items here</span>
            </div>
          </div>
        </template>
      </SdSplitPanel>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">No Borders, Large Gap (2/5)</h2>
      <SdSplitPanel ratio="2/5" :bordered="false" gap="lg">
        <template #left>
          <div class="bg-white rounded-sd-md border border-sd-border p-5">
            <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">Sidebar</h3>
            <p class="text-sm text-sd-text">Custom bordered content inside an unbordered split panel.</p>
          </div>
        </template>
        <template #right>
          <div class="bg-white rounded-sd-md border border-sd-border p-5">
            <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">Main Content</h3>
            <p class="text-sm text-sd-text">When bordered=false, you control the container styling yourself.</p>
          </div>
        </template>
      </SdSplitPanel>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Reverse Stack on Mobile</h2>
      <p class="text-sd-text-muted text-xs mb-3">On small screens, the right panel appears first. Resize your browser to see it.</p>
      <SdSplitPanel ratio="1/3" reverse-stack>
        <template #left>
          <div class="p-5">
            <h3 class="text-sm font-semibold text-sd-text mb-2">Navigation</h3>
            <p class="text-xs text-sd-text-muted">This panel moves below on mobile.</p>
          </div>
        </template>
        <template #right>
          <div class="p-5">
            <h3 class="text-sm font-semibold text-sd-text mb-2">Content (shows first on mobile)</h3>
            <p class="text-xs text-sd-text-muted">Priority content that should appear first on small screens.</p>
          </div>
        </template>
      </SdSplitPanel>
    </section>
  </div>
</template>
