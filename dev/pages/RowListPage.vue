<script setup lang="ts">
import { ref } from 'vue';
import { SdRowList, SdBadge, SdButton } from '@sanibase/ui';
import { PhPencil, PhTrash, PhEye, PhPlus, PhUsers, PhPackage } from '@phosphor-icons/vue';

const staff = [
  { name: 'Hans Meier', role: 'Head Chef', status: 'Active', initials: 'HM' },
  { name: 'Anna Schmidt', role: 'Waiter', status: 'Active', initials: 'AS' },
  { name: 'Peter Keller', role: 'Bartender', status: 'On Leave', initials: 'PK' },
  { name: 'Maria Brunner', role: 'Host', status: 'Active', initials: 'MB' },
  { name: 'Luca Fischer', role: 'Dishwasher', status: 'Active', initials: 'LF' },
];

const orders = [
  { id: '#1042', customer: 'Hans Meier', time: '14:32', total: 'CHF 45.50', status: 'Preparing', variant: 'info' as const },
  { id: '#1041', customer: 'Anna Schmidt', time: '14:18', total: 'CHF 23.00', status: 'Ready', variant: 'success' as const },
  { id: '#1040', customer: 'Walk-in', time: '13:55', total: 'CHF 67.80', status: 'Done', variant: 'neutral' as const },
  { id: '#1039', customer: 'Peter Keller', time: '13:40', total: 'CHF 12.50', status: 'Cancelled', variant: 'error' as const },
];

const customers = [
  { name: 'Sophie Weber', email: 'sophie@mail.ch', visits: 12, lastVisit: '2 days ago', image: null, initials: 'SW' },
  { name: 'Thomas Baumann', email: 'thomas@mail.ch', visits: 34, lastVisit: 'Today', image: null, initials: 'TB' },
  { name: 'Lisa Mueller', email: 'lisa@mail.ch', visits: 7, lastVisit: '1 week ago', image: null, initials: 'LM' },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdRowList</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Data-driven card-per-row list with avatar, content, badges, and actions. Built-in empty and loading states.</p>

    <!-- ── STAFF LIST ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Staff List</h2>
    <section class="mb-10">
      <SdRowList :items="staff">
        <template #avatar="{ item }">
          <div class="w-10 h-10 rounded-full bg-sd-purple-light flex items-center justify-center text-sd-purple font-semibold text-sm">
            {{ (item as typeof staff[0]).initials }}
          </div>
        </template>
        <template #content="{ item }">
          <h3 class="text-sm font-medium text-sd-text truncate">{{ (item as typeof staff[0]).name }}</h3>
          <p class="text-xs text-sd-text-muted">{{ (item as typeof staff[0]).role }}</p>
        </template>
        <template #meta="{ item }">
          <SdBadge
            :label="(item as typeof staff[0]).status"
            :variant="(item as typeof staff[0]).status === 'Active' ? 'success' : 'warning'"
            dot
            size="sm"
          />
        </template>
        <template #actions="{ item }">
          <SdButton variant="ghost" icon size="sm"><template #icon-left><PhPencil :size="14" weight="regular" /></template></SdButton>
          <SdButton variant="ghost" icon size="sm"><template #icon-left><PhTrash :size="14" weight="regular" /></template></SdButton>
        </template>
      </SdRowList>
    </section>

    <!-- ── ORDER LIST ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Order List</h2>
    <section class="mb-10">
      <SdRowList :items="orders">
        <template #avatar="{ item }">
          <div class="w-10 h-10 rounded-sd bg-sd-bg-alt flex items-center justify-center text-sd-text-muted font-mono text-xs font-bold">
            {{ (item as typeof orders[0]).id }}
          </div>
        </template>
        <template #content="{ item }">
          <h3 class="text-sm font-medium text-sd-text">{{ (item as typeof orders[0]).customer }}</h3>
          <p class="text-xs text-sd-text-muted">{{ (item as typeof orders[0]).time }}</p>
        </template>
        <template #meta="{ item }">
          <div class="text-right">
            <div class="text-sm font-bold text-sd-text">{{ (item as typeof orders[0]).total }}</div>
            <SdBadge
              :label="(item as typeof orders[0]).status"
              :variant="(item as typeof orders[0]).variant"
              size="sm"
              class="mt-0.5"
            />
          </div>
        </template>
        <template #actions>
          <SdButton variant="ghost" icon size="sm"><template #icon-left><PhEye :size="14" weight="regular" /></template></SdButton>
        </template>
      </SdRowList>
    </section>

    <!-- ── TOUCH SIZE ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Touch Size -- Customer List</h2>
    <section class="mb-10">
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-4">
        <SdRowList :items="customers" size="touch">
          <template #avatar="{ item }">
            <div class="w-14 h-14 rounded-full bg-sd-purple-light flex items-center justify-center text-sd-purple font-bold text-base">
              {{ (item as typeof customers[0]).initials }}
            </div>
          </template>
          <template #content="{ item }">
            <h3 class="text-base font-semibold text-sd-text">{{ (item as typeof customers[0]).name }}</h3>
            <p class="text-sm text-sd-text-muted">{{ (item as typeof customers[0]).email }}</p>
          </template>
          <template #meta="{ item }">
            <div class="text-right">
              <div class="text-sm font-bold text-sd-text">{{ (item as typeof customers[0]).visits }} visits</div>
              <p class="text-xs text-sd-text-muted">{{ (item as typeof customers[0]).lastVisit }}</p>
            </div>
          </template>
        </SdRowList>
      </div>
    </section>

    <!-- ── LOADING ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Loading State</h2>
    <section class="mb-10">
      <SdRowList :items="[]" loading :skeleton-count="3" />
    </section>

    <!-- ── EMPTY ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Empty State</h2>
    <section class="mb-10">
      <SdRowList
        :items="[]"
        empty-title="No staff members"
        empty-description="Add your first team member to get started."
      >
        <template #empty-icon><PhUsers :size="40" weight="light" /></template>
        <template #empty-action>
          <SdButton label="Add Staff" variant="primary" size="sm">
            <template #icon-left><PhPlus :size="16" weight="bold" /></template>
          </SdButton>
        </template>
      </SdRowList>
    </section>
  </div>
</template>
