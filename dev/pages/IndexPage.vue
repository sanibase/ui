<script setup lang="ts">
import { RouterLink } from 'vue-router';
import {
  PhPalette,
  PhCube,
  PhLayout,
  PhTable,
  PhTextbox,
  PhCompass,
  PhChatCircle,
  PhStack,
  PhCalendarBlank,
  PhDeviceTabletSpeaker,
} from '@phosphor-icons/vue';
import { SdBadge } from '@sanibase/ui';
import type { BadgeVariant } from '@sanibase/ui';
import type { Component } from 'vue';

interface ComponentLink {
  label: string;
  path: string;
  status: 'done' | 'wip' | 'planned';
  inventoryNum: number;
}

interface Category {
  title: string;
  icon: Component;
  items: ComponentLink[];
}

const categories: Category[] = [
  {
    title: 'Design Tokens',
    icon: PhPalette,
    items: [
      { label: 'Colors, Typography, Spacing', path: '/tokens', status: 'done', inventoryNum: 0 },
      { label: 'Logos & Assets', path: '/assets', status: 'done', inventoryNum: 0 },
      { label: 'SdWordmark', path: '/wordmark', status: 'done', inventoryNum: 0 },
    ],
  },
  {
    title: 'Primitives',
    icon: PhCube,
    items: [
      { label: 'SdButton', path: '/button', status: 'done', inventoryNum: 1 },
      { label: 'SdInput', path: '/input', status: 'done', inventoryNum: 2 },
      { label: 'SdSelect', path: '/select', status: 'done', inventoryNum: 3 },
      { label: 'SdTextarea', path: '/textarea', status: 'done', inventoryNum: 4 },
      { label: 'SdCheckbox', path: '/checkbox', status: 'done', inventoryNum: 5 },
      { label: 'SdToggle', path: '/toggle', status: 'done', inventoryNum: 6 },
      { label: 'SdRadio', path: '/radio', status: 'done', inventoryNum: 7 },
      { label: 'SdBadge', path: '/badge', status: 'done', inventoryNum: 8 },
      { label: 'SdToast', path: '/toast', status: 'done', inventoryNum: 9 },
      { label: 'SdSpinner', path: '/spinner', status: 'done', inventoryNum: 10 },
    ],
  },
  {
    title: 'Layout',
    icon: PhLayout,
    items: [
      { label: 'SdAppShell', path: '/app-shell', status: 'done', inventoryNum: 11 },
      { label: 'SdPageHeader', path: '/page-header', status: 'done', inventoryNum: 12 },
      { label: 'SdFilterBar', path: '/filter-bar', status: 'done', inventoryNum: 13 },
      { label: 'SdCard / SdProductCard', path: '/card', status: 'done', inventoryNum: 14 },
      { label: 'SdSplitPanel', path: '/split-panel', status: 'done', inventoryNum: 15 },
      { label: 'SdAutoGrid', path: '/auto-grid', status: 'done', inventoryNum: 16 },
    ],
  },
  {
    title: 'Data Display',
    icon: PhTable,
    items: [
      { label: 'SdStatCard', path: '/stat-card', status: 'done', inventoryNum: 17 },
      { label: 'SdDataTable', path: '/data-table', status: 'done', inventoryNum: 18 },
      { label: 'SdRowList', path: '/row-list', status: 'done', inventoryNum: 19 },
      { label: 'SdKeyValueList', path: '/key-value-list', status: 'done', inventoryNum: 42 },
      { label: 'SdDraggableList', path: '/draggable-list', status: 'done', inventoryNum: 20 },
      { label: 'SdAccordion', path: '/accordion', status: 'done', inventoryNum: 22 },
      { label: 'SdBarChart', path: '/bar-chart', status: 'done', inventoryNum: 23 },
      { label: 'SdLineChart', path: '/line-chart', status: 'done', inventoryNum: 24 },
      { label: 'SdSwissMap', path: '/swiss-map', status: 'done', inventoryNum: 25 },
      { label: 'SdGeoMap', path: '/geo-map', status: 'done', inventoryNum: 26 },
    ],
  },
  {
    title: 'Forms',
    icon: PhTextbox,
    items: [
      { label: 'SdModal', path: '/modal', status: 'done', inventoryNum: 24 },
      { label: 'SdConfirmDialog', path: '/confirm-dialog', status: 'done', inventoryNum: 25 },
      { label: 'SdToggleRow', path: '/toggle-row', status: 'done', inventoryNum: 26 },
      { label: 'SdPriceVariants', path: '/price-variants', status: 'done', inventoryNum: 27 },
      { label: 'SdImageUpload', path: '/image-upload', status: 'done', inventoryNum: 28 },
      { label: 'SdHoursGrid', path: '/hours-grid', status: 'done', inventoryNum: 29 },
      { label: 'SdCheckboxGrid', path: '/checkbox-grid', status: 'done', inventoryNum: 30 },
      { label: 'SdColorPicker', path: '/color-picker', status: 'done', inventoryNum: 31 },
    ],
  },
  {
    title: 'Navigation',
    icon: PhCompass,
    items: [
      { label: 'SdSidebar', path: '/sidebar', status: 'done', inventoryNum: 32 },
      { label: 'SdTabs', path: '/tabs', status: 'done', inventoryNum: 33 },
      { label: 'SdScrollPills', path: '/scroll-pills', status: 'done', inventoryNum: 0 },
      { label: 'SdDateNav', path: '/date-nav', status: 'done', inventoryNum: 35 },
      { label: 'SdColumnList', path: '/column-list', status: 'done', inventoryNum: 0 },
      { label: 'SdBottomSheet', path: '/bottom-sheet', status: 'done', inventoryNum: 0 },
    ],
  },
  {
    title: 'Feedback',
    icon: PhChatCircle,
    items: [
      { label: 'SdEmptyState', path: '/empty-state', status: 'done', inventoryNum: 36 },
      { label: 'SdModuleLocked', path: '/module-locked', status: 'done', inventoryNum: 37 },
      { label: 'SdPendingBanner', path: '/pending-banner', status: 'done', inventoryNum: 38 },
    ],
  },
  {
    title: 'Overlays',
    icon: PhStack,
    items: [
      { label: 'SdDetailPanel', path: '/detail-panel', status: 'done', inventoryNum: 39 },
      { label: 'SdPrintOverlay', path: '/print-overlay', status: 'done', inventoryNum: 40 },
      { label: 'SdBulkActionBar', path: '/bulk-action-bar', status: 'done', inventoryNum: 41 },
    ],
  },
  {
    title: 'Calendar',
    icon: PhCalendarBlank,
    items: [
      { label: 'SdCalendar (components)', path: '/calendar', status: 'done', inventoryNum: 21 },
      { label: 'SdCalendar (full demo)', path: '/calendar-full', status: 'done', inventoryNum: 0 },
    ],
  },
  {
    title: 'Layouts',
    icon: PhDeviceTabletSpeaker,
    items: [
      { label: 'Kiosk Layout (tablet)', path: '/kiosk-layout', status: 'done', inventoryNum: 0 },
    ],
  },
];

const statusBadge: Record<string, { label: string; variant: BadgeVariant }> = {
  done: { label: 'Done', variant: 'success' },
  review: { label: 'For Review', variant: 'warning' },
  wip: { label: 'Session 5', variant: 'purple' },
  planned: { label: 'Planned', variant: 'neutral' },
};

const totalDone = categories.reduce((sum, cat) => sum + cat.items.filter(i => i.status === 'done').length, 0);
const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SaniDesk UI -- Component Gallery</h1>
      <p class="text-sd-text-secondary text-sm">
        PrimeVue-based design system. {{ totalDone }}/{{ totalItems }} components built.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
        v-for="cat in categories"
        :key="cat.title"
        class="bg-white rounded-sd-md border border-sd-border p-5 shadow-sd-sm"
      >
        <h2 class="font-heading text-base font-semibold text-sd-text mb-4 flex items-center gap-2">
          <component :is="cat.icon" :size="20" weight="regular" class="text-sd-purple" />
          {{ cat.title }}
        </h2>

        <ul class="space-y-1.5">
          <li v-for="item in cat.items" :key="item.path">
            <RouterLink
              v-if="item.status !== 'planned'"
              :to="item.path"
              class="flex items-center justify-between px-3 py-2 rounded-sd-sm hover:bg-sd-purple-subtle transition-colors no-underline text-sd-text"
            >
              <span class="text-sm font-medium">{{ item.label }}</span>
              <SdBadge :label="statusBadge[item.status].label" :variant="statusBadge[item.status].variant" size="sm" />
            </RouterLink>
            <div
              v-else
              class="flex items-center justify-between px-3 py-2 rounded-sd-sm text-sd-text-muted cursor-default"
            >
              <span class="text-sm">{{ item.label }}</span>
              <SdBadge :label="statusBadge[item.status].label" :variant="statusBadge[item.status].variant" size="sm" />
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- ── EXTRA COMPONENTS (not in inventory but built) ── -->
    <div class="mt-8 bg-white rounded-sd-md border border-sd-border p-5 shadow-sd-sm">
      <h2 class="font-heading text-base font-semibold text-sd-text mb-3">Also built (not in inventory)</h2>
      <div class="flex flex-wrap gap-2">
        <RouterLink to="/list-item" class="no-underline">
          <SdBadge label="SdListItem / SdViewToggle" variant="success" size="sm" />
        </RouterLink>
        <RouterLink to="/datepicker" class="no-underline">
          <SdBadge label="SdDatePicker" variant="success" size="sm" />
        </RouterLink>
      </div>
    </div>
  </div>
</template>
