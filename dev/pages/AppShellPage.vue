<script setup lang="ts">
import { ref } from 'vue';
import { SdAppShell, SdSidebar, SdPageHeader, SdButton, SdBadge, SdStatCard } from '@sanibase/ui';
import type { SidebarGroup } from '@sanibase/ui';
import {
  PhHouse, PhReceipt, PhCalendarBlank, PhUsers,
  PhPackage, PhGear, PhChartBar, PhChatCircle,
  PhStorefront, PhPlus, PhCurrencyDollar,
} from '@phosphor-icons/vue';

const activeKey = ref('orders');
const collapsed = ref(false);

const sidebarGroups: SidebarGroup[] = [
  {
    key: 'main',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: PhHouse },
      { key: 'orders', label: 'Orders', icon: PhReceipt, badge: 5 },
      { key: 'reservations', label: 'Reservations', icon: PhCalendarBlank },
      { key: 'customers', label: 'Customers', icon: PhUsers },
    ],
  },
  {
    key: 'catalog',
    label: 'Catalog',
    collapsible: true,
    items: [
      { key: 'products', label: 'Products', icon: PhPackage },
      { key: 'shop', label: 'Online Shop', icon: PhStorefront },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    collapsible: true,
    items: [
      { key: 'analytics', label: 'Analytics', icon: PhChartBar },
      { key: 'chat', label: 'Messages', icon: PhChatCircle, badge: 3 },
    ],
  },
  {
    key: 'system',
    label: 'System',
    items: [
      { key: 'settings', label: 'Settings', icon: PhGear },
    ],
  },
];

function onItemClick(item: { key: string }) {
  activeKey.value = item.key;
}
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdAppShell &amp; SdSidebar</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Full application layout with sidebar, topbar, and content area. Mobile: hamburger overlay. Desktop: collapsible sidebar.</p>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Live Demo</h2>
    <section class="mb-10">
      <div class="flex items-center gap-3 mb-4">
        <SdButton
          :label="collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
          variant="outline"
          size="sm"
          @click="collapsed = !collapsed"
        />
        <span class="text-xs text-sd-text-muted">Active: {{ activeKey }}</span>
      </div>

      <!-- Shell in a contained box -->
      <div class="border border-sd-border rounded-sd-md overflow-hidden" style="height: 520px;">
        <SdAppShell :collapsed="collapsed" @update:collapsed="collapsed = $event">
          <!-- Topbar -->
          <template #topbar>
            <div class="flex items-center gap-3 flex-1">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-sd-sm bg-sd-purple flex items-center justify-center text-white font-bold text-xs">Sd</div>
                <span class="font-heading font-bold text-sd-text text-sm">SaniDesk</span>
              </div>
              <div class="flex-1" />
              <SdBadge label="Tenant: Gleis 56" variant="purple" size="sm" />
            </div>
          </template>

          <!-- Sidebar -->
          <template #sidebar="{ collapsed: isCollapsed }">
            <SdSidebar
              :groups="sidebarGroups"
              :active-key="activeKey"
              :collapsed="isCollapsed"
              @item-click="onItemClick"
            />
          </template>

          <!-- Content -->
          <div class="p-6">
            <SdPageHeader title="Orders" subtitle="Manage incoming and recent orders">
              <template #actions>
                <SdButton label="New Order" variant="primary" size="sm">
                  <template #icon-left><PhPlus :size="16" weight="bold" /></template>
                </SdButton>
              </template>
            </SdPageHeader>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <SdStatCard value="24" label="Today's Orders" variant="orange">
                <template #icon><PhReceipt :size="22" weight="bold" /></template>
              </SdStatCard>
              <SdStatCard value="CHF 1'840" label="Revenue" variant="success">
                <template #icon><PhCurrencyDollar :size="22" weight="bold" /></template>
              </SdStatCard>
              <SdStatCard value="5" label="Pending" variant="warning">
                <template #icon><PhReceipt :size="22" weight="bold" /></template>
              </SdStatCard>
            </div>

            <div class="mt-6 bg-white border border-sd-border rounded-sd-md p-8 text-center text-sd-text-muted text-sm">
              Order content would go here.
            </div>
          </div>
        </SdAppShell>
      </div>
      <p class="text-xs text-sd-text-muted mt-3">Resize the browser window below 768px to see the mobile hamburger overlay. Use the button above to toggle collapsed sidebar.</p>
    </section>
  </div>
</template>
