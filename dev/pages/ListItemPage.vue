<script setup lang="ts">
import { ref } from 'vue';
import { SdListItem, SdViewToggle, SdProductCard, SdAutoGrid, SdBadge, SdButton } from '@sanibase/ui';
import type { ViewMode } from '@sanibase/ui';
import { PhPencil, PhTrash, PhDotsThree } from '@phosphor-icons/vue';

const viewMode = ref<ViewMode>('grid');

const products = [
  { title: 'Margherita', subtitle: 'Classic tomato & mozzarella', price: 'CHF 18.50', badge: 'Popular', badgeVariant: 'success' as const, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop' },
  { title: 'Quattro Stagioni', subtitle: 'Four seasons pizza', price: 'CHF 22.00', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop' },
  { title: 'Risotto Funghi', subtitle: 'Wild mushroom risotto', price: 'CHF 24.50', badge: 'New', badgeVariant: 'purple' as const, image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop' },
  { title: 'Caesar Salad', subtitle: 'Romaine, croutons, parmesan', price: 'CHF 16.00', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop' },
];

const staff = [
  { name: 'Hans Meier', role: 'Head Chef', status: 'Active' },
  { name: 'Anna Schmidt', role: 'Waiter', status: 'Active' },
  { name: 'Peter Keller', role: 'Bartender', status: 'On Leave' },
  { name: 'Maria Brunner', role: 'Host', status: 'Active' },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdListItem &amp; SdViewToggle</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Row-based list item with avatar, meta, actions. ViewToggle switches between grid and list.</p>

    <!-- ── LIST ITEM ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">SdListItem -- Staff List</h2>
    <section class="mb-10">
      <div class="space-y-2 max-w-lg">
        <SdListItem v-for="s in staff" :key="s.name" :title="s.name" :subtitle="s.role">
          <template #avatar>
            <div class="w-10 h-10 rounded-full bg-sd-purple-light flex items-center justify-center text-sd-purple font-semibold text-sm">
              {{ s.name.split(' ').map(n => n[0]).join('') }}
            </div>
          </template>
          <template #meta>
            <SdBadge :label="s.status" :variant="s.status === 'Active' ? 'success' : 'warning'" dot size="sm" />
          </template>
          <template #actions>
            <SdButton variant="ghost" icon size="sm"><template #icon-left><PhPencil :size="14" weight="regular" /></template></SdButton>
            <SdButton variant="ghost" icon size="sm"><template #icon-left><PhTrash :size="14" weight="regular" /></template></SdButton>
          </template>
        </SdListItem>
      </div>
    </section>

    <!-- ── VIEW TOGGLE ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 mt-12 border-b border-sd-border pb-2">SdViewToggle -- Grid / List Switch</h2>
    <section class="mb-10">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-heading text-lg font-semibold text-sd-text">Menu Items ({{ products.length }})</h3>
        <SdViewToggle v-model="viewMode" :modes="['grid', 'list']" />
      </div>

      <SdAutoGrid v-if="viewMode === 'grid'" :count="products.length" :min-width="180" :gap="16">
        <SdProductCard
          v-for="p in products"
          :key="p.title"
          :title="p.title"
          :subtitle="p.subtitle"
          :price="p.price"
          :image="p.image"
          :badge="p.badge"
          :badge-variant="p.badgeVariant"
        />
      </SdAutoGrid>

      <div v-else class="space-y-2">
        <SdListItem v-for="p in products" :key="p.title" :title="p.title" :subtitle="p.subtitle" :image="p.image">
          <template #meta>
            <div class="text-right">
              <div class="text-sm font-bold text-sd-orange">{{ p.price }}</div>
              <SdBadge v-if="p.badge" :label="p.badge" :variant="p.badgeVariant ?? 'neutral'" size="sm" class="mt-1" />
            </div>
          </template>
          <template #actions>
            <SdButton variant="ghost" icon size="sm"><template #icon-left><PhDotsThree :size="16" weight="bold" /></template></SdButton>
          </template>
        </SdListItem>
      </div>
    </section>
  </div>
</template>
