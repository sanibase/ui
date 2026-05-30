<script setup lang="ts">
import { SdCard, SdProductCard, SdAutoGrid } from '@sanibase/ui';
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdCard &amp; SdProductCard</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Base container card and product-specific card variant.</p>

    <!-- ── BASE CARD ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">SdCard</h2>
    <section class="mb-10">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SdCard>
          <h3 class="text-sm font-semibold text-sd-text">Default Card</h3>
          <p class="text-xs text-sd-text-muted mt-1">Basic container with border and padding.</p>
        </SdCard>
        <SdCard hoverable>
          <h3 class="text-sm font-semibold text-sd-text">Hoverable</h3>
          <p class="text-xs text-sd-text-muted mt-1">Shadow on hover. Good for clickable items.</p>
        </SdCard>
        <SdCard selected>
          <h3 class="text-sm font-semibold text-sd-text">Selected</h3>
          <p class="text-xs text-sd-text-muted mt-1">Purple border + ring for selected state.</p>
        </SdCard>
      </div>
    </section>

    <!-- ── PRODUCT CARD WITH IMAGES ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 mt-12 border-b border-sd-border pb-2">SdProductCard -- With Images</h2>
    <section class="mb-10">
      <SdAutoGrid :count="4" :min-width="180" :gap="16">
        <SdProductCard
          title="Margherita"
          subtitle="Classic tomato &amp; mozzarella"
          price="CHF 18.50"
          image="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop"
          badge="Popular"
          badge-variant="success"
        />
        <SdProductCard
          title="Caesar Salad"
          subtitle="Romaine, croutons, parmesan"
          price="CHF 16.00"
          image="https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop"
        />
        <SdProductCard
          title="Tiramisu"
          subtitle="Classic Italian dessert"
          price="CHF 12.00"
          image="https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop"
          badge="New"
          badge-variant="purple"
        />
        <SdProductCard
          title="No Image"
          subtitle="Placeholder shown"
          price="CHF 9.00"
          show-image
        />
      </SdAutoGrid>
    </section>

    <!-- ── PRODUCT CARD WITHOUT IMAGES ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 mt-12 border-b border-sd-border pb-2">SdProductCard -- Text Only</h2>
    <section class="mb-10">
      <SdAutoGrid :count="4" :min-width="160" :gap="12">
        <SdProductCard title="Espresso" price="CHF 4.50" />
        <SdProductCard title="Cappuccino" price="CHF 5.50" badge="Popular" badge-variant="success" />
        <SdProductCard title="Mineral Water" price="CHF 3.50" />
        <SdProductCard title="Fresh Juice" price="CHF 7.00" badge="Sold out" badge-variant="error" />
      </SdAutoGrid>
    </section>

    <!-- ── TOUCH SIZE ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 mt-12 border-b border-sd-border pb-2">Touch Size -- POS</h2>
    <section class="mb-10">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-4">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">Text only</h3>
          <SdAutoGrid :count="6" :min-width="160" :gap="12" size="touch">
            <SdProductCard title="Margherita" price="CHF 18.50" size="touch" />
            <SdProductCard title="Quattro Stagioni" price="CHF 22.00" size="touch" />
            <SdProductCard title="Risotto" price="CHF 24.50" size="touch" badge="New" badge-variant="purple" />
            <SdProductCard title="Caesar Salad" price="CHF 16.00" size="touch" />
            <SdProductCard title="Tiramisu" price="CHF 12.00" size="touch" />
            <SdProductCard title="Bruschetta" price="CHF 9.50" size="touch" />
          </SdAutoGrid>
        </div>
        <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-4">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">With images</h3>
          <SdAutoGrid :count="4" :min-width="180" :gap="12" size="touch">
            <SdProductCard title="Margherita" price="CHF 18.50" size="touch" image="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop" />
            <SdProductCard title="Caesar Salad" price="CHF 16.00" size="touch" image="https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop" />
            <SdProductCard title="Tiramisu" price="CHF 12.00" size="touch" image="https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop" badge="New" badge-variant="purple" />
            <SdProductCard title="Bruschetta" price="CHF 9.50" size="touch" show-image />
          </SdAutoGrid>
        </div>
      </div>
    </section>
  </div>
</template>
