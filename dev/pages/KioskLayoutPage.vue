<script setup lang="ts">
import { ref, computed } from 'vue';
import { SdBadge, SdButton } from '@sanibase/ui';
import {
  PhLock, PhBell, PhShoppingBag, PhArrowLeft,
  PhMapPin, PhCookingPot, PhCalendarBlank,
  PhCircle, PhWifiHigh, PhWifiSlash, PhWifiMedium,
  PhClock, PhReceipt, PhUsers, PhCurrencyDollar,
  PhArrowsOut, PhCheck, PhWarning,
} from '@phosphor-icons/vue';

// Active demo state
const activeView = ref<'pos-floor' | 'pos-order' | 'kds' | 'reservations'>('pos-floor');
const selectedTable = ref<number | null>(null);
const activeCat = ref('all');
const kdsSize = ref<'sm' | 'md' | 'lg'>('md');
const floorOverlay = ref<'covers' | 'total' | 'time' | 'status'>('status');
const resView = ref<'floor' | 'calendar'>('floor');

// Mobile demo state
const mobileView = ref<'floor' | 'items' | 'ordered'>('floor');
const mobileSeatPopup = ref(false);
const activeSeat = ref(2);

const categories = [
  { id: 'all', label: 'All', color: 'bg-sd-purple' },
  { id: 'drinks', label: 'Drinks', color: 'bg-sd-info' },
  { id: 'food', label: 'Food', color: 'bg-sd-orange' },
  { id: 'dessert', label: 'Desserts', color: 'bg-sd-coral' },
  { id: 'sides', label: 'Sides', color: 'bg-sd-success' },
  { id: 'specials', label: 'Specials', color: 'bg-sd-warning' },
];

const menuItems = [
  { name: 'Espresso', price: '4.00', cat: 'drinks' },
  { name: 'Latte', price: '5.50', cat: 'drinks' },
  { name: 'Cappuccino', price: '5.00', cat: 'drinks' },
  { name: 'Americano', price: '4.50', cat: 'drinks' },
  { name: 'Fresh Juice', price: '6.50', cat: 'drinks' },
  { name: 'Mineral Water', price: '3.50', cat: 'drinks' },
  { name: 'Club Sandwich', price: '14.50', cat: 'food' },
  { name: 'Caesar Salad', price: '12.00', cat: 'food' },
  { name: 'Burger', price: '18.50', cat: 'food' },
  { name: 'Pasta', price: '16.00', cat: 'food' },
  { name: 'Steak', price: '32.00', cat: 'food' },
  { name: 'Fish & Chips', price: '19.50', cat: 'food' },
  { name: 'Tiramisu', price: '8.50', cat: 'dessert' },
  { name: 'Panna Cotta', price: '7.00', cat: 'dessert' },
  { name: 'Sorbet', price: '6.00', cat: 'dessert' },
  { name: 'Fries', price: '5.50', cat: 'sides' },
  { name: 'Side Salad', price: '4.50', cat: 'sides' },
  { name: 'Bread Basket', price: '3.50', cat: 'sides' },
];

const filteredItems = computed(() => {
  if (activeCat.value === 'all') return menuItems;
  return menuItems.filter(i => i.cat === activeCat.value);
});

interface TableData {
  id: number;
  label: string;
  x: number;
  y: number;
  status: 'free' | 'occupied' | 'call' | 'reserved';
  total?: string;
  guests?: number;
  seats?: number;
  server?: string;
  minutes?: number;
  reservation?: string;
}

const tables: TableData[] = [
  { id: 1, label: 'T1', x: 12, y: 15, status: 'free', seats: 4 },
  { id: 2, label: 'T2', x: 35, y: 10, status: 'occupied', total: '45.50', guests: 2, seats: 4, server: 'Maria', minutes: 28 },
  { id: 3, label: 'T3', x: 62, y: 12, status: 'occupied', total: '22.00', guests: 4, seats: 6, server: 'Tom', minutes: 45 },
  { id: 4, label: 'T4', x: 20, y: 42, status: 'free', seats: 2 },
  { id: 5, label: 'T5', x: 48, y: 38, status: 'call', total: '67.00', guests: 3, seats: 4, server: 'Maria', minutes: 52 },
  { id: 6, label: 'T6', x: 75, y: 35, status: 'free', seats: 4 },
  { id: 7, label: 'T7', x: 10, y: 68, status: 'occupied', total: '31.50', guests: 2, seats: 2, server: 'Tom', minutes: 12 },
  { id: 8, label: 'T8', x: 38, y: 65, status: 'free', seats: 6 },
  { id: 9, label: 'T9', x: 60, y: 70, status: 'reserved', seats: 4, reservation: '19:00 Mueller' },
  { id: 10, label: 'T10', x: 82, y: 65, status: 'reserved', seats: 2, reservation: '19:30 Schmidt' },
];

const kdsOrders = [
  { id: 38, table: 'Table 2', minutes: 14, items: ['2x Burger', '1x Fries', '1x Salad'], ready: 1, total: 3 },
  { id: 39, table: 'Takeaway', minutes: 9, items: ['1x Wrap', '2x Fries', '1x Coke'], ready: 0, total: 3 },
  { id: 40, table: 'Table 6', minutes: 6, items: ['2x Pizza', '1x Pasta'], ready: 1, total: 2 },
  { id: 41, table: 'Table 3', minutes: 4, items: ['1x Salad', '2x Soup', '1x Bread'], ready: 2, total: 3 },
  { id: 42, table: 'Table 5', minutes: 3, items: ['1x Steak', '1x Salad'], ready: 0, total: 2 },
  { id: 43, table: 'Table 7', minutes: 2, items: ['1x Pizza', '1x Salad', '1x Tiramisu'], ready: 0, total: 3 },
  { id: 44, table: 'Takeaway', minutes: 1, items: ['3x Wrap', '1x Fries', '2x Coke'], ready: 0, total: 3 },
  { id: 45, table: 'Table 1', minutes: 0, items: ['2x Burger', '1x Fries'], ready: 0, total: 2 },
];

// Seat positions around a rectangular table (relative to SVG viewBox 0 0 120 80)
function getSeatPositions(seatCount: number): Array<{ cx: number; cy: number }> {
  const positions: Array<{ cx: number; cy: number }> = [];
  // Distribute seats: top, bottom, left side, right side
  if (seatCount >= 1) positions.push({ cx: 40, cy: 6 }); // top-left
  if (seatCount >= 2) positions.push({ cx: 80, cy: 6 }); // top-right
  if (seatCount >= 3) positions.push({ cx: 40, cy: 74 }); // bottom-left
  if (seatCount >= 4) positions.push({ cx: 80, cy: 74 }); // bottom-right
  if (seatCount >= 5) positions.push({ cx: 14, cy: 40 }); // left
  if (seatCount >= 6) positions.push({ cx: 106, cy: 40 }); // right
  return positions;
}

function getTimeColor(minutes: number): string {
  if (minutes >= 10) return 'text-sd-error bg-sd-error-light border-sd-error';
  if (minutes >= 5) return 'text-sd-warning bg-sd-warning-light border-sd-warning';
  return 'text-sd-success bg-sd-success-light border-sd-success';
}

function getTimeBorder(minutes: number): string {
  if (minutes >= 10) return 'border-l-[#ef4444]';
  if (minutes >= 5) return 'border-l-[#f59e0b]';
  return 'border-l-[#22c55e]';
}

function getTableColor(status: string): string {
  switch (status) {
    case 'free': return 'bg-sd-success-light border-sd-success text-[#15803d]';
    case 'occupied': return 'bg-sd-purple-light border-sd-purple text-sd-purple';
    case 'call': return 'bg-sd-error-light border-sd-error text-sd-error animate-pulse';
    case 'reserved': return 'bg-sd-warning-light border-sd-warning text-[#92400e]';
    default: return 'bg-sd-bg-alt border-sd-border text-sd-text-muted';
  }
}

function selectTable(id: number) {
  selectedTable.value = id;
  activeView.value = 'pos-order';
}

function backToFloor() {
  selectedTable.value = null;
  activeView.value = 'pos-floor';
}

const kdsGridCols = computed(() => {
  switch (kdsSize.value) {
    case 'sm': return 'grid-cols-5';
    case 'md': return 'grid-cols-4';
    case 'lg': return 'grid-cols-3';
  }
});

// Currently selected table data for order panel
const selectedTableData = computed(() => {
  const id = selectedTable.value ?? 5;
  return tables.find(t => t.id === id) ?? tables[4];
});
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">Kiosk Layout</h1>
    <p class="text-sd-text-secondary text-sm mb-4">
      Fullscreen touch-optimized layout for locked tablet terminals. Three modes: POS, Kitchen Display (KDS), and Reservations.
      Separate from the mobile layout (staff phones).
    </p>

    <div class="flex items-center gap-2 mb-2">
      <span class="text-xs font-semibold text-sd-text-muted uppercase tracking-wider">Route prefix:</span>
      <code class="text-xs bg-sd-bg-alt px-2 py-0.5 rounded-sd-sm">/kiosk/[tenant]/pos</code>
      <code class="text-xs bg-sd-bg-alt px-2 py-0.5 rounded-sd-sm">/kiosk/[tenant]/kitchen</code>
      <code class="text-xs bg-sd-bg-alt px-2 py-0.5 rounded-sd-sm">/kiosk/[tenant]/reservations</code>
    </div>
    <div class="flex items-center gap-2 mb-8">
      <span class="text-xs font-semibold text-sd-text-muted uppercase tracking-wider">Layout file:</span>
      <code class="text-xs bg-sd-bg-alt px-2 py-0.5 rounded-sd-sm">layouts/kiosk.vue</code>
      <span class="text-xs text-sd-text-muted">|</span>
      <span class="text-xs font-semibold text-sd-text-muted uppercase tracking-wider">Mobile:</span>
      <code class="text-xs bg-sd-bg-alt px-2 py-0.5 rounded-sd-sm">layouts/mobile.vue</code>
      <code class="text-xs bg-sd-bg-alt px-2 py-0.5 rounded-sd-sm">/m/[tenant]/...</code>
    </div>

    <!-- View Switcher -->
    <div class="flex gap-2 mb-6">
      <SdButton
        label="POS: Floorplan"
        :variant="activeView === 'pos-floor' ? 'primary' : 'outline'"
        size="sm"
        @click="activeView = 'pos-floor'; selectedTable = null"
      />
      <SdButton
        label="POS: Order"
        :variant="activeView === 'pos-order' ? 'primary' : 'outline'"
        size="sm"
        @click="activeView = 'pos-order'; selectedTable = 5"
      />
      <SdButton
        label="KDS"
        :variant="activeView === 'kds' ? 'primary' : 'outline'"
        size="sm"
        @click="activeView = 'kds'"
      />
      <SdButton
        label="Reservations"
        :variant="activeView === 'reservations' ? 'primary' : 'outline'"
        size="sm"
        @click="activeView = 'reservations'"
      />
    </div>

    <!-- ==================== KIOSK FRAME ==================== -->
    <div class="border-2 border-sd-border rounded-sd-lg overflow-hidden bg-white" style="height: 620px; aspect-ratio: 4/3; max-width: 100%;">
      <div class="flex flex-col h-full">

        <!-- ===== STATUS BAR (shared across all views) ===== -->
        <header class="h-12 flex items-center px-4 gap-3 shrink-0 text-white" style="background: #120820;">
          <!-- Left: sync + tenant -->
          <div class="flex items-center gap-2">
            <PhWifiHigh :size="16" weight="bold" class="text-sd-success" />
            <span class="text-xs font-medium text-sd-success">Online</span>
            <span class="opacity-30">|</span>
            <span class="text-sm font-heading font-bold">Tenant</span>
          </div>
          <span class="flex-1" />

          <!-- Center: view-specific buttons -->
          <template v-if="activeView === 'pos-floor'">
            <button class="flex items-center gap-1.5 px-3 py-1.5 rounded-sd-sm text-xs font-medium transition-colors" style="background: rgba(139,90,159,0.25);">
              <PhShoppingBag :size="14" weight="bold" /> T&G
            </button>
            <button class="flex items-center gap-1.5 px-3 py-1.5 rounded-sd-sm text-xs font-medium transition-colors" style="background: rgba(139,90,159,0.25);">
              <PhCalendarBlank :size="14" weight="bold" /> Reservations
            </button>
          </template>
          <template v-if="activeView === 'pos-order'">
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-sd-sm text-xs font-medium transition-colors"
              style="background: rgba(139,90,159,0.25);"
              @click="backToFloor"
            >
              <PhArrowLeft :size="14" weight="bold" /> Back to Floorplan
            </button>
          </template>
          <template v-if="activeView === 'kds'">
            <div class="flex rounded-sd-sm p-0.5 gap-0.5" style="background: rgba(139,90,159,0.2);">
              <button
                v-for="s in (['sm', 'md', 'lg'] as const)"
                :key="s"
                class="px-2 py-1 rounded-sd-sm text-xs font-medium transition-colors"
                :class="kdsSize === s ? 'bg-sd-purple text-white' : 'opacity-60 hover:opacity-100'"
                @click="kdsSize = s"
              >{{ s === 'sm' ? 'S' : s === 'md' ? 'M' : 'L' }}</button>
            </div>
            <div class="flex rounded-sd-sm p-0.5 gap-0.5" style="background: rgba(139,90,159,0.2);">
              <button class="px-2 py-1 rounded-sd-sm text-xs font-medium bg-sd-purple text-white">Active</button>
              <button class="px-2 py-1 rounded-sd-sm text-xs font-medium opacity-60 hover:opacity-100">All</button>
              <button class="px-2 py-1 rounded-sd-sm text-xs font-medium opacity-60 hover:opacity-100">Done</button>
            </div>
          </template>
          <template v-if="activeView === 'reservations'">
            <div class="flex rounded-sd-sm p-0.5 gap-0.5" style="background: rgba(139,90,159,0.2);">
              <button
                class="px-3 py-1 rounded-sd-sm text-xs font-medium transition-colors"
                :class="resView === 'floor' ? 'bg-sd-purple text-white' : 'opacity-60 hover:opacity-100'"
                @click="resView = 'floor'"
              >Floorplan</button>
              <button
                class="px-3 py-1 rounded-sd-sm text-xs font-medium transition-colors"
                :class="resView === 'calendar' ? 'bg-sd-purple text-white' : 'opacity-60 hover:opacity-100'"
                @click="resView = 'calendar'"
              >Calendar</button>
            </div>
          </template>

          <!-- Right: clock, user, actions -->
          <span class="opacity-30">|</span>
          <span class="text-sm tabular-nums font-medium">14:32</span>
          <span class="text-xs opacity-60">Maria K.</span>
          <button class="relative p-1.5 rounded-sd-sm transition-colors" style="background: rgba(139,90,159,0.15);">
            <PhBell :size="16" weight="bold" />
            <span class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-sd-error rounded-full text-[10px] font-bold flex items-center justify-center">2</span>
          </button>
          <button class="p-1.5 rounded-sd-sm transition-colors" style="background: rgba(139,90,159,0.15);">
            <PhLock :size="16" weight="bold" />
          </button>
          <button class="p-1.5 rounded-sd-sm transition-colors" style="background: rgba(139,90,159,0.15);">
            <PhArrowsOut :size="16" weight="bold" />
          </button>
        </header>

        <!-- ===== CONTENT AREA ===== -->
        <div class="flex-1 overflow-hidden">

          <!-- ==================== POS: FLOORPLAN ==================== -->
          <div v-if="activeView === 'pos-floor'" class="h-full flex flex-col">
            <div class="flex-1 relative p-4">
              <!-- Tables (simulated floorplan) -->
              <div
                v-for="table in tables"
                :key="table.id"
                class="absolute w-20 h-20 rounded-sd-md border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 shadow-sd-sm"
                :class="getTableColor(table.status)"
                :style="{ left: table.x + '%', top: table.y + '%' }"
                @click="selectTable(table.id)"
              >
                <span class="font-heading font-bold text-sm">{{ table.label }}</span>
                <template v-if="table.status === 'free'">
                  <span class="text-[10px] font-medium uppercase tracking-wider opacity-70">Free</span>
                </template>
                <template v-else-if="table.status === 'occupied' || table.status === 'call'">
                  <span class="text-[10px] font-bold">
                    <template v-if="floorOverlay === 'total'">CHF {{ table.total }}</template>
                    <template v-else-if="floorOverlay === 'covers'">{{ table.guests }} guests</template>
                    <template v-else-if="floorOverlay === 'time'">{{ table.minutes }} min</template>
                    <template v-else>{{ table.server }}</template>
                  </span>
                </template>
                <template v-else-if="table.status === 'reserved'">
                  <span class="text-[10px] font-medium leading-tight text-center">{{ table.reservation }}</span>
                </template>
              </div>
            </div>
            <!-- Bottom bar: overlay toggles + floor switcher -->
            <div class="h-10 bg-sd-bg-alt border-t border-sd-border flex items-center px-4 gap-3 shrink-0">
              <span class="text-xs text-sd-text-muted font-semibold mr-1">Show:</span>
              <button
                v-for="o in (['covers', 'total', 'time', 'status'] as const)"
                :key="o"
                class="px-2.5 py-1 rounded-sd-sm text-xs font-medium transition-colors"
                :class="floorOverlay === o ? 'bg-sd-purple text-white' : 'bg-white border border-sd-border text-sd-text-muted hover:border-sd-purple'"
                @click="floorOverlay = o"
              >{{ o.charAt(0).toUpperCase() + o.slice(1) }}</button>
              <span class="flex-1" />
              <span class="text-xs text-sd-text-muted font-semibold mr-1">Floor:</span>
              <button class="px-2.5 py-1 rounded-sd-sm text-xs font-medium bg-sd-purple text-white">Main</button>
              <button class="px-2.5 py-1 rounded-sd-sm text-xs font-medium bg-white border border-sd-border text-sd-text-muted hover:border-sd-purple">Terrace</button>
              <!-- Legend -->
              <span class="text-sd-border mx-1">|</span>
              <div class="flex items-center gap-3">
                <span class="flex items-center gap-1 text-[10px] text-sd-text-muted"><span class="w-2.5 h-2.5 rounded-full bg-sd-success"></span> Free</span>
                <span class="flex items-center gap-1 text-[10px] text-sd-text-muted"><span class="w-2.5 h-2.5 rounded-full bg-sd-purple"></span> Occupied</span>
                <span class="flex items-center gap-1 text-[10px] text-sd-text-muted"><span class="w-2.5 h-2.5 rounded-full bg-sd-error"></span> Call</span>
                <span class="flex items-center gap-1 text-[10px] text-sd-text-muted"><span class="w-2.5 h-2.5 rounded-full bg-sd-warning"></span> Reserved</span>
              </div>
            </div>
          </div>

          <!-- ==================== POS: ORDER VIEW ==================== -->
          <div v-else-if="activeView === 'pos-order'" class="h-full flex">
            <!-- LEFT: Category Rail -->
            <div class="w-[70px] bg-sd-bg-alt border-r border-sd-border flex flex-col gap-1 p-1.5 overflow-y-auto shrink-0">
              <button
                v-for="cat in categories"
                :key="cat.id"
                class="flex flex-col items-center justify-center rounded-sd-md py-2.5 px-1 text-[11px] font-bold leading-tight text-center transition-all min-h-[52px]"
                :class="activeCat === cat.id
                  ? 'bg-sd-purple-light text-sd-purple border-2 border-sd-purple'
                  : 'bg-white border-2 border-transparent text-sd-text-muted hover:border-sd-border'"
                @click="activeCat = cat.id"
              >
                <span class="w-3 h-3 rounded-full mb-1" :class="cat.color"></span>
                {{ cat.label }}
              </button>
            </div>

            <!-- CENTER: Item Grid -->
            <div class="flex-1 overflow-y-auto p-3">
              <div class="grid grid-cols-3 gap-2">
                <div
                  v-for="item in filteredItems"
                  :key="item.name"
                  class="bg-white border-2 border-sd-border rounded-sd-md p-3 flex flex-col items-center justify-center cursor-pointer hover:border-sd-purple hover:shadow-sd-sm transition-all min-h-[72px]"
                >
                  <span class="font-heading font-bold text-sm text-sd-text text-center leading-tight">{{ item.name }}</span>
                  <span class="text-xs text-sd-text-muted mt-0.5">{{ item.price }}</span>
                </div>
              </div>
            </div>

            <!-- RIGHT: Order Panel -->
            <div class="w-[38%] bg-white border-l border-sd-border flex flex-col shrink-0">
              <!-- Table mini-visual with seats -->
              <div class="px-4 py-3 border-b border-sd-border">
                <div class="flex items-start gap-3">
                  <!-- Mini table SVG -->
                  <svg viewBox="0 0 120 80" class="w-24 h-16 shrink-0">
                    <!-- Table surface -->
                    <rect x="24" y="14" width="72" height="52" rx="8" class="fill-sd-purple-light stroke-sd-purple" stroke-width="2" />
                    <text x="60" y="44" text-anchor="middle" class="fill-sd-purple font-heading" font-size="14" font-weight="700">{{ selectedTableData.label }}</text>
                    <!-- Seats -->
                    <circle
                      v-for="(seat, i) in getSeatPositions(selectedTableData.seats ?? 4)"
                      :key="i"
                      :cx="seat.cx"
                      :cy="seat.cy"
                      r="7"
                      :class="i < (selectedTableData.guests ?? 0) ? 'fill-sd-purple stroke-sd-purple-dark' : 'fill-sd-bg-alt stroke-sd-border'"
                      stroke-width="1.5"
                    />
                  </svg>
                  <!-- Table info text -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <span class="font-heading font-bold text-base text-sd-text">{{ selectedTableData.label }}</span>
                      <SdBadge :label="(selectedTableData.guests ?? 0) + '/' + (selectedTableData.seats ?? 4) + ' seats'" variant="purple" size="sm" />
                    </div>
                    <div class="flex items-center gap-3 mt-1 text-xs text-sd-text-muted">
                      <span>{{ selectedTableData.server }}</span>
                      <span class="tabular-nums">{{ selectedTableData.minutes }} min</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Order items -->
              <div class="flex-1 overflow-y-auto px-4 py-3">
                <div class="space-y-2">
                  <div class="flex items-start justify-between">
                    <span class="font-semibold text-sm text-sd-text">2x Espresso</span>
                    <span class="text-sm tabular-nums text-sd-text">8.00</span>
                  </div>
                  <div class="flex items-start justify-between">
                    <div>
                      <span class="font-semibold text-sm text-sd-text">1x Club Sandwich</span>
                      <div class="text-xs text-sd-text-muted pl-3">+ extra cheese</div>
                    </div>
                    <div class="text-right">
                      <span class="text-sm tabular-nums text-sd-text">14.50</span>
                      <div class="text-xs text-sd-text-muted tabular-nums">+1.50</div>
                    </div>
                  </div>
                  <div class="flex items-start justify-between">
                    <span class="font-semibold text-sm text-sd-text">1x Burger</span>
                    <span class="text-sm tabular-nums text-sd-text">18.50</span>
                  </div>
                  <div class="flex items-start justify-between">
                    <span class="font-semibold text-sm text-sd-text">1x Mineral Water</span>
                    <span class="text-sm tabular-nums text-sd-text">3.50</span>
                  </div>
                  <div class="flex items-start justify-between">
                    <div>
                      <span class="font-semibold text-sm text-sd-text">2x Latte</span>
                      <div class="text-xs text-sd-text-muted pl-3">+ oat milk</div>
                    </div>
                    <div class="text-right">
                      <span class="text-sm tabular-nums text-sd-text">11.00</span>
                      <div class="text-xs text-sd-text-muted tabular-nums">+1.00</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Totals -->
              <div class="px-4 py-3 border-t border-sd-border">
                <div class="flex justify-between text-sm text-sd-text-muted mb-1">
                  <span>Subtotal</span>
                  <span class="tabular-nums">56.50</span>
                </div>
                <div class="flex justify-between font-heading font-bold text-lg text-sd-text">
                  <span>Total</span>
                  <span class="tabular-nums">CHF 57.50</span>
                </div>
              </div>

              <!-- Action bar -->
              <div class="px-3 py-3 border-t border-sd-border flex gap-2">
                <button class="flex-1 h-12 rounded-sd-md bg-sd-purple text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <PhCookingPot :size="18" weight="bold" /> Send to Kitchen
                </button>
                <button class="h-12 px-4 rounded-sd-md bg-sd-orange text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <PhCurrencyDollar :size="18" weight="bold" /> Pay
                </button>
                <button class="h-12 w-12 rounded-sd-md border-2 border-sd-border text-sd-text-muted flex items-center justify-center hover:border-sd-purple transition-colors">
                  ...
                </button>
              </div>
            </div>
          </div>

          <!-- ==================== KDS ==================== -->
          <div v-else-if="activeView === 'kds'" class="h-full overflow-y-auto p-3" style="background: #120820;">
            <div class="grid gap-3" :class="kdsGridCols">
              <div
                v-for="order in kdsOrders"
                :key="order.id"
                class="rounded-sd-md overflow-hidden border-l-4 shadow-sd"
                style="background: #1e1233;"
                :class="getTimeBorder(order.minutes)"
              >
                <!-- Ticket header -->
                <div class="flex items-center justify-between px-3 py-2" style="background: rgba(139,90,159,0.1);">
                  <span class="font-heading font-bold text-sm text-white">#{{ order.id }} {{ order.table }}</span>
                  <span
                    class="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full border"
                    :class="getTimeColor(order.minutes)"
                  >{{ order.minutes }} min</span>
                </div>
                <!-- Progress bar -->
                <div class="flex gap-0.5 px-3 py-1 items-center">
                  <div
                    v-for="i in order.total"
                    :key="i"
                    class="w-3 h-2 rounded-sm"
                    :class="i <= order.ready ? 'bg-sd-success' : 'bg-sd-purple-dark'"
                  ></div>
                  <span class="text-[10px] ml-2" style="color: rgba(255,255,255,0.4);">{{ order.ready }}/{{ order.total }}</span>
                </div>
                <!-- Items -->
                <div class="px-3 py-2">
                  <div v-for="item in order.items" :key="item" class="text-sm py-0.5" style="color: rgba(255,255,255,0.85);">
                    {{ item }}
                  </div>
                </div>
                <!-- Bump button -->
                <div class="px-3 pb-2">
                  <button class="w-full h-10 rounded-sd-sm bg-sd-success hover:opacity-90 text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-opacity">
                    <PhCheck :size="16" weight="bold" /> BUMP
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== RESERVATIONS ==================== -->
          <div v-else-if="activeView === 'reservations'" class="h-full flex flex-col">
            <!-- Floorplan view -->
            <div v-if="resView === 'floor'" class="flex-1 relative p-4">
              <div
                v-for="table in tables"
                :key="table.id"
                class="absolute w-24 h-20 rounded-sd-md border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 shadow-sd-sm"
                :class="getTableColor(table.status)"
                :style="{ left: table.x + '%', top: table.y + '%' }"
              >
                <span class="font-heading font-bold text-sm">{{ table.label }}</span>
                <template v-if="table.status === 'free'">
                  <span class="text-[10px] font-semibold uppercase tracking-wider opacity-70">Free</span>
                </template>
                <template v-else-if="table.status === 'reserved'">
                  <span class="text-[10px] font-bold leading-tight text-center">{{ table.reservation }}</span>
                </template>
                <template v-else-if="table.status === 'occupied'">
                  <span class="text-[10px] font-bold">Occupied</span>
                  <span class="text-[10px]">{{ table.guests }} guests</span>
                </template>
                <template v-else>
                  <span class="text-[10px] font-bold">Needs Attn</span>
                </template>
              </div>
            </div>
            <!-- Calendar view -->
            <div v-else class="flex-1 p-4">
              <div class="h-full bg-sd-bg-alt rounded-sd-md border border-sd-border flex flex-col">
                <div class="flex items-center justify-between px-4 py-3 border-b border-sd-border">
                  <span class="font-heading font-bold text-sd-text">Thursday, April 10</span>
                  <div class="flex gap-1">
                    <button class="px-2 py-1 rounded-sd-sm text-xs font-medium bg-white border border-sd-border text-sd-text-muted">Prev</button>
                    <button class="px-2 py-1 rounded-sd-sm text-xs font-medium bg-white border border-sd-border text-sd-text-muted">Today</button>
                    <button class="px-2 py-1 rounded-sd-sm text-xs font-medium bg-white border border-sd-border text-sd-text-muted">Next</button>
                  </div>
                </div>
                <div class="flex-1 grid grid-cols-[60px_1fr] overflow-y-auto">
                  <!-- Time labels -->
                  <div class="border-r border-sd-border">
                    <div v-for="h in [17, 18, 19, 20, 21, 22]" :key="h" class="h-16 flex items-start justify-end pr-2 pt-1 text-xs text-sd-text-muted tabular-nums border-b border-sd-border-light">
                      {{ h }}:00
                    </div>
                  </div>
                  <!-- Timeline -->
                  <div class="relative">
                    <div v-for="h in [17, 18, 19, 20, 21, 22]" :key="h" class="h-16 border-b border-sd-border-light"></div>
                    <!-- Reservation blocks -->
                    <div class="absolute left-2 right-2 bg-sd-purple-light border border-sd-purple/30 rounded-sd-sm px-2 py-1" style="top: 32px; height: 56px;">
                      <span class="text-xs font-bold text-sd-purple">T2 - Mueller (4p)</span>
                      <span class="text-[10px] text-sd-text-muted block">19:00 - 20:30</span>
                    </div>
                    <div class="absolute left-2 right-2 rounded-sd-sm px-2 py-1 border" style="top: 52px; height: 48px; background: rgba(255,140,66,0.1); border-color: rgba(255,140,66,0.3);">
                      <span class="text-xs font-bold text-sd-orange">T9 - Schmidt (2p)</span>
                      <span class="text-[10px] text-sd-text-muted block">19:30 - 21:00</span>
                    </div>
                    <div class="absolute left-2 right-2 bg-sd-success-light border border-sd-success/30 rounded-sd-sm px-2 py-1" style="top: 96px; height: 48px;">
                      <span class="text-xs font-bold" style="color: #15803d;">T4 - Bauer (6p)</span>
                      <span class="text-[10px] text-sd-text-muted block">20:00 - 21:30</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- ==================== MOBILE POS ==================== -->
    <h2 class="font-heading text-xl font-bold text-sd-text mt-10 mb-2">Mobile POS</h2>
    <p class="text-sd-text-secondary text-sm mb-2">Phone layout for waiters. POS only -- KDS and reservations stay on fixed tablets.</p>
    <div class="flex items-center gap-2 mb-6">
      <span class="text-xs font-semibold text-sd-text-muted uppercase tracking-wider">Route:</span>
      <code class="text-xs bg-sd-bg-alt px-2 py-0.5 rounded-sd-sm">/m/[tenant]/pos</code>
      <span class="text-xs text-sd-text-muted">|</span>
      <span class="text-xs font-semibold text-sd-text-muted uppercase tracking-wider">Layout:</span>
      <code class="text-xs bg-sd-bg-alt px-2 py-0.5 rounded-sd-sm">layouts/mobile.vue</code>
    </div>

    <!-- Mobile view switcher -->
    <div class="flex gap-2 mb-6">
      <SdButton label="Floorplan" :variant="mobileView === 'floor' ? 'primary' : 'outline'" size="sm" @click="mobileView = 'floor'; mobileSeatPopup = false" />
      <SdButton label="Add Items" :variant="mobileView === 'items' ? 'primary' : 'outline'" size="sm" @click="mobileView = 'items'; mobileSeatPopup = false" />
      <SdButton label="Ordered" :variant="mobileView === 'ordered' ? 'primary' : 'outline'" size="sm" @click="mobileView = 'ordered'; mobileSeatPopup = false" />
      <SdButton label="Seat Popup" :variant="mobileSeatPopup ? 'primary' : 'outline'" size="sm" @click="mobileSeatPopup = !mobileSeatPopup; if (mobileSeatPopup) mobileView = 'items'" />
    </div>

    <!-- Phone frame -->
    <div class="border-2 border-sd-border rounded-[2rem] overflow-hidden bg-white mx-auto relative" style="width: 375px; height: 680px;">
      <div class="flex flex-col h-full">

        <!-- Mobile status bar -->
        <header class="h-11 flex items-center px-3 gap-2 shrink-0 text-white" style="background: #120820;">
          <template v-if="mobileView === 'floor'">
            <PhWifiHigh :size="14" weight="bold" class="text-sd-success" />
            <span class="text-xs font-heading font-bold">Tenant</span>
            <span class="flex-1" />
            <span class="text-xs tabular-nums opacity-80">14:32</span>
            <button class="p-1 rounded-sd-sm" style="background: rgba(139,90,159,0.2);">
              <PhShoppingBag :size="14" weight="bold" />
            </button>
            <button class="p-1 rounded-sd-sm" style="background: rgba(139,90,159,0.2);">
              <PhLock :size="14" weight="bold" />
            </button>
          </template>
          <template v-else>
            <button class="flex items-center gap-1 text-xs font-medium" @click="mobileView = 'floor'; mobileSeatPopup = false">
              <PhArrowLeft :size="14" weight="bold" /> T5
            </button>
            <SdBadge :label="'Seat ' + activeSeat" variant="purple" size="sm" />
            <span class="text-[10px] opacity-60 tabular-nums">52m</span>
            <span class="flex-1" />
            <button class="flex items-center gap-1 px-2 py-1 rounded-sd-sm text-xs font-medium" style="background: rgba(139,90,159,0.25);" @click="mobileSeatPopup = !mobileSeatPopup">
              <PhMapPin :size="12" weight="bold" /> Table
            </button>
          </template>
        </header>

        <!-- Mobile content -->
        <div class="flex-1 overflow-hidden flex flex-col relative">

          <!-- Floorplan -->
          <div v-if="mobileView === 'floor'" class="flex-1 relative p-3 overflow-hidden">
            <div
              v-for="table in tables"
              :key="table.id"
              class="absolute w-16 h-16 rounded-sd border-2 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sd-sm"
              :class="getTableColor(table.status)"
              :style="{ left: table.x * 0.85 + '%', top: table.y * 0.85 + '%' }"
              @click="mobileView = 'items'; mobileSeatPopup = false"
            >
              <span class="font-heading font-bold text-xs">{{ table.label }}</span>
              <span class="text-[9px] font-medium">
                <template v-if="table.status === 'free'">Free</template>
                <template v-else-if="table.status === 'occupied' || table.status === 'call'">{{ table.guests }}p</template>
                <template v-else-if="table.status === 'reserved'">Res.</template>
              </span>
            </div>
            <div class="absolute bottom-2 left-0 right-0 text-center text-[10px] text-sd-text-muted">Pinch to zoom</div>
          </div>

          <!-- Order view: tab bar -->
          <template v-if="mobileView !== 'floor'">
            <div class="flex border-b border-sd-border shrink-0">
              <button
                class="flex-1 py-2.5 text-sm font-semibold text-center transition-colors"
                :class="mobileView === 'items' ? 'text-sd-purple border-b-2 border-sd-purple' : 'text-sd-text-muted'"
                @click="mobileView = 'items'"
              >Add Items</button>
              <button
                class="flex-1 py-2.5 text-sm font-semibold text-center transition-colors relative"
                :class="mobileView === 'ordered' ? 'text-sd-purple border-b-2 border-sd-purple' : 'text-sd-text-muted'"
                @click="mobileView = 'ordered'"
              >
                Ordered
                <span class="absolute -top-0.5 ml-0.5 w-4 h-4 bg-sd-purple rounded-full text-[10px] text-white font-bold flex items-center justify-center">3</span>
              </button>
            </div>

            <!-- Add Items tab -->
            <div v-if="mobileView === 'items'" class="flex-1 overflow-y-auto flex flex-col">
              <!-- Category pills -->
              <div class="flex gap-1.5 px-3 py-2 overflow-x-auto shrink-0 border-b border-sd-border-light">
                <button
                  v-for="cat in categories"
                  :key="cat.id"
                  class="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors"
                  :class="activeCat === cat.id ? 'bg-sd-purple text-white' : 'bg-sd-bg-alt text-sd-text-muted border border-sd-border'"
                  @click="activeCat = cat.id"
                >{{ cat.label }}</button>
              </div>
              <!-- 2-col item grid -->
              <div class="grid grid-cols-2 gap-2 p-3 flex-1">
                <div
                  v-for="item in filteredItems"
                  :key="item.name"
                  class="bg-white border-2 border-sd-border rounded-sd p-2.5 flex flex-col items-center justify-center cursor-pointer hover:border-sd-purple transition-all min-h-[60px]"
                >
                  <span class="font-heading font-bold text-sm text-sd-text text-center leading-tight">{{ item.name }}</span>
                  <span class="text-xs text-sd-text-muted">{{ item.price }}</span>
                </div>
              </div>
            </div>

            <!-- Ordered tab -->
            <div v-if="mobileView === 'ordered'" class="flex-1 overflow-y-auto px-3 py-3">
              <div class="text-[10px] text-sd-text-muted uppercase tracking-wider font-semibold mb-2">Seat {{ activeSeat }} -- unsent</div>
              <div class="space-y-2 mb-4">
                <div class="flex items-start justify-between">
                  <span class="font-semibold text-sm text-sd-text">1x Espresso</span>
                  <span class="text-sm tabular-nums text-sd-text">4.00</span>
                </div>
              </div>
              <div class="border-t border-dashed border-sd-border my-3 relative">
                <span class="absolute -top-2 left-1/2 -translate-x-1/2 bg-white px-2 text-[10px] text-sd-text-muted">sent 14:20</span>
              </div>
              <div class="space-y-2">
                <div class="flex items-start justify-between opacity-60">
                  <div>
                    <span class="font-semibold text-sm text-sd-text">1x Club Sandwich</span>
                    <div class="text-xs text-sd-text-muted pl-3">+ extra cheese</div>
                  </div>
                  <div class="text-right">
                    <span class="text-sm tabular-nums text-sd-text">14.50</span>
                    <div class="text-xs text-sd-text-muted tabular-nums">+1.50</div>
                  </div>
                </div>
                <div class="flex items-start justify-between opacity-60">
                  <span class="font-semibold text-sm text-sd-text">1x Mineral Water</span>
                  <span class="text-sm tabular-nums text-sd-text">3.50</span>
                </div>
              </div>
            </div>
          </template>

          <!-- Sticky bottom bar (order views only) -->
          <div v-if="mobileView !== 'floor'" class="shrink-0 px-3 py-2.5 border-t border-sd-border bg-white flex items-center gap-2">
            <div class="flex-1">
              <div class="text-[10px] text-sd-text-muted">Seat {{ activeSeat }}</div>
              <div class="font-heading font-bold text-sd-text">CHF 23.50</div>
            </div>
            <template v-if="mobileView === 'ordered'">
              <button class="h-10 px-4 rounded-sd bg-sd-orange text-white font-bold text-sm flex items-center justify-center gap-1.5">
                <PhCurrencyDollar :size="16" weight="bold" /> Pay
              </button>
            </template>
            <button class="h-10 px-5 rounded-sd bg-sd-purple text-white font-bold text-sm flex items-center justify-center gap-1.5">
              <PhCookingPot :size="16" weight="bold" /> Send
            </button>
          </div>

          <!-- ===== SEAT POPUP OVERLAY ===== -->
          <div v-if="mobileSeatPopup" class="absolute inset-0 z-10 flex items-center justify-center" style="background: rgba(18,8,32,0.6);">
            <div class="bg-white rounded-sd-lg shadow-sd-lg p-5 w-[280px]">
              <div class="flex items-center justify-between mb-4">
                <span class="font-heading font-bold text-sd-text">Table 5</span>
                <button class="text-xs text-sd-text-muted" @click="mobileSeatPopup = false">Close</button>
              </div>
              <!-- Table SVG with tappable seats -->
              <svg viewBox="0 0 200 140" class="w-full">
                <!-- Table surface -->
                <rect x="50" y="30" width="100" height="80" rx="10" class="fill-sd-purple-light stroke-sd-purple" stroke-width="2" />
                <text x="100" y="75" text-anchor="middle" class="fill-sd-purple font-heading" font-size="16" font-weight="700">T5</text>
                <!-- Seat 1 (top-left) -->
                <circle cx="75" cy="16" r="12" class="fill-sd-purple stroke-sd-purple-dark cursor-pointer" stroke-width="2" @click="activeSeat = 1; mobileSeatPopup = false" />
                <text x="75" y="20" text-anchor="middle" fill="white" font-size="10" font-weight="700">1</text>
                <!-- Seat 2 (top-right, active) -->
                <circle cx="125" cy="16" r="12" :class="activeSeat === 2 ? 'fill-sd-orange stroke-sd-orange' : 'fill-sd-purple stroke-sd-purple-dark'" class="cursor-pointer" stroke-width="2" @click="activeSeat = 2; mobileSeatPopup = false" />
                <text x="125" y="20" text-anchor="middle" fill="white" font-size="10" font-weight="700">2</text>
                <!-- Seat 3 (bottom-left) -->
                <circle cx="75" cy="124" r="12" :class="activeSeat === 3 ? 'fill-sd-orange stroke-sd-orange' : 'fill-sd-purple stroke-sd-purple-dark'" class="cursor-pointer" stroke-width="2" @click="activeSeat = 3; mobileSeatPopup = false" />
                <text x="75" y="128" text-anchor="middle" fill="white" font-size="10" font-weight="700">3</text>
                <!-- Seat 4 (bottom-right, empty) -->
                <circle cx="125" cy="124" r="12" class="fill-sd-bg-alt stroke-sd-border cursor-pointer" stroke-width="2" @click="activeSeat = 4; mobileSeatPopup = false" />
                <text x="125" y="128" text-anchor="middle" class="fill-sd-text-muted" font-size="10" font-weight="700">4</text>
              </svg>
              <div class="flex items-center justify-center gap-4 mt-3 text-[10px] text-sd-text-muted">
                <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-sd-purple"></span> Occupied</span>
                <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-sd-orange"></span> Active</span>
                <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-sd-bg-alt border border-sd-border"></span> Empty</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- ==================== DESIGN NOTES ==================== -->
    <div class="mt-8 space-y-6">
      <h2 class="font-heading text-xl font-bold text-sd-text border-b border-sd-border pb-2">Design Decisions</h2>

      <div class="grid grid-cols-2 gap-6">
        <div class="bg-sd-bg-alt rounded-sd-md p-4 border border-sd-border">
          <h3 class="font-heading font-bold text-sm text-sd-text mb-2">Layout Shell</h3>
          <ul class="text-xs text-sd-text-secondary space-y-1">
            <li>Dark status bar (h-12, bg-dark #120820) with purple-tinted buttons</li>
            <li>Full-bleed content slot, no padding (pages own their layout)</li>
            <li>provide('sd-touch-mode', true) for auto touch sizing</li>
            <li>Separate from mobile layout (layouts/mobile.vue)</li>
            <li>Device is locked to URL, no mode switching UI</li>
          </ul>
        </div>

        <div class="bg-sd-bg-alt rounded-sd-md p-4 border border-sd-border">
          <h3 class="font-heading font-bold text-sm text-sd-text mb-2">POS: Floorplan</h3>
          <ul class="text-xs text-sd-text-secondary space-y-1">
            <li>Full-screen SVG floorplan with pinch-zoom</li>
            <li>Tables: sd-success=free, sd-purple=occupied, sd-error=call, sd-warning=reserved</li>
            <li>Data overlay toggle (covers/total/time/status) in bottom bar</li>
            <li>Floor plan switcher for multi-floor venues</li>
            <li>T&G button for counter/takeaway shortcut</li>
          </ul>
        </div>

        <div class="bg-sd-bg-alt rounded-sd-md p-4 border border-sd-border">
          <h3 class="font-heading font-bold text-sm text-sd-text mb-2">POS: Order View</h3>
          <ul class="text-xs text-sd-text-secondary space-y-1">
            <li>3-zone: category rail (70px left) + item grid (center) + order panel (38% right)</li>
            <li>Category rail on left side for left-thumb ergonomics on tablets</li>
            <li>Seat-based ordering: items assigned to active seat</li>
            <li>Table SVG seats are tappable -- switch seats without leaving order view</li>
            <li>Send to Kitchen (sd-purple) = primary, Pay (sd-orange) = secondary</li>
          </ul>
        </div>

        <div class="bg-sd-bg-alt rounded-sd-md p-4 border border-sd-border">
          <h3 class="font-heading font-bold text-sm text-sd-text mb-2">KDS (Kitchen Display)</h3>
          <ul class="text-xs text-sd-text-secondary space-y-1">
            <li>Dark background (#120820) with sd-purple-tinted cards (#1e1233)</li>
            <li>Grid: S=5-col, M=4-col, L=3-col (configurable)</li>
            <li>Time color: sd-success &lt;5m, sd-warning 5-10m, sd-error &gt;10m</li>
            <li>Progress bar uses sd-success (ready) / sd-purple-dark (pending)</li>
            <li>BUMP button in sd-success</li>
          </ul>
        </div>

        <div class="bg-sd-bg-alt rounded-sd-md p-4 border border-sd-border">
          <h3 class="font-heading font-bold text-sm text-sd-text mb-2">Reservations</h3>
          <ul class="text-xs text-sd-text-secondary space-y-1">
            <li>Two sub-views: floorplan (table status) and calendar (timeline)</li>
            <li>Calendar uses sd-purple-light, sd-orange, sd-success-light for blocks</li>
            <li>Floorplan reuses same table color scheme as POS</li>
            <li>Toggle in status bar between views</li>
          </ul>
        </div>

        <div class="bg-sd-bg-alt rounded-sd-md p-4 border border-sd-border">
          <h3 class="font-heading font-bold text-sm text-sd-text mb-2">Auth &amp; Security</h3>
          <ul class="text-xs text-sd-text-secondary space-y-1">
            <li>PIN-based login (4-digit numpad), not email/password</li>
            <li>Lock screen overlay for user switching</li>
            <li>Device locked via OS kiosk mode (Win Assigned Access, iOS Guided Access)</li>
            <li>Fullscreen toggle button in status bar</li>
          </ul>
        </div>

        <div class="bg-sd-bg-alt rounded-sd-md p-4 border border-sd-border">
          <h3 class="font-heading font-bold text-sm text-sd-text mb-2">Mobile POS</h3>
          <ul class="text-xs text-sd-text-secondary space-y-1">
            <li>POS only -- KDS and reservations stay on fixed tablets</li>
            <li>Floorplan with pinch-zoom (same SVG, works on small screens)</li>
            <li>Order view: "Add Items" / "Ordered" tab toggle (no side-by-side)</li>
            <li>2-column item grid, horizontal category pills on top</li>
            <li>Seat popup: tap [Table] button to show table SVG, tap seat to switch</li>
            <li>Sticky bottom bar with seat total + Send button</li>
          </ul>
        </div>

        <div class="bg-sd-bg-alt rounded-sd-md p-4 border border-sd-border">
          <h3 class="font-heading font-bold text-sm text-sd-text mb-2">Seat Switching</h3>
          <ul class="text-xs text-sd-text-secondary space-y-1">
            <li>Ordering is per-seat: items assigned to the active seat</li>
            <li>Tablet: tap seat circles directly on the SVG in order panel header</li>
            <li>Mobile: tap [Table] button, popup shows table SVG with tappable seats</li>
            <li>Occupied = sd-purple, active = sd-orange, empty = outlined</li>
            <li>No need to return to floorplan just to switch guests at same table</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
