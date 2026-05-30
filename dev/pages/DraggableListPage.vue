<script setup lang="ts">
import { ref } from 'vue';
import { SdDraggableList, SdBadge } from '@sanibase/ui';

const menuCategories = ref(['Pizza', 'Pasta', 'Salads', 'Desserts', 'Drinks', 'Starters']);
const menuSections = ref(['Header Image', 'Featured Items', 'Categories Grid', 'About Us', 'Opening Hours', 'Contact']);
const smList = ref(['First', 'Second', 'Third', 'Fourth']);
const mdList = ref(['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo']);
const touchList = ref(['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5']);
const disabledList = ref(['Locked A', 'Locked B', 'Locked C']);
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdDraggableList</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Reorderable list with drag handles. Drag items to reorder.</p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Menu Categories</h2>
      <div class="bg-white rounded-sd-md border border-sd-border max-w-sm overflow-hidden">
        <SdDraggableList v-model="menuCategories" />
      </div>
      <p class="text-xs text-sd-text-muted mt-2">Order: {{ menuCategories.join(', ') }}</p>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Custom Slot Content</h2>
      <div class="bg-white rounded-sd-md border border-sd-border max-w-md overflow-hidden">
        <SdDraggableList v-model="menuSections">
          <template #default="{ item, index }">
            <div class="flex items-center justify-between w-full">
              <div>
                <span class="text-sd-text font-medium">{{ item }}</span>
                <span class="text-sd-text-muted text-xs ml-2">Section {{ index + 1 }}</span>
              </div>
              <SdBadge label="Visible" variant="success" size="sm" />
            </div>
          </template>
        </SdDraggableList>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Sizes</h2>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">sm</h3>
          <div class="bg-white rounded-sd-md border border-sd-border overflow-hidden">
            <SdDraggableList v-model="smList" size="sm" />
          </div>
        </div>
        <div>
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">md (default)</h3>
          <div class="bg-white rounded-sd-md border border-sd-border overflow-hidden">
            <SdDraggableList v-model="mdList" size="md" />
          </div>
        </div>
        <div>
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">touch</h3>
          <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border overflow-hidden">
            <SdDraggableList v-model="touchList" size="touch" />
          </div>
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Disabled</h2>
      <div class="bg-white rounded-sd-md border border-sd-border max-w-sm overflow-hidden">
        <SdDraggableList v-model="disabledList" disabled />
      </div>
    </section>
  </div>
</template>
