<script setup lang="ts">
import { ref } from 'vue';
import { SdPriceVariants } from '@sanibase/ui';
import type { PriceVariant } from '@sanibase/ui';

// Basic single price
const singlePrice = ref('12.50');
const singleMulti = ref(false);
const singleVariants = ref<PriceVariant[]>([]);

// Pre-filled variants
const menuPrice = ref('');
const menuMulti = ref(true);
const menuVariants = ref<PriceVariant[]>([
  { label: 'Small', price: '8.90' },
  { label: 'Medium', price: '12.50' },
  { label: 'Large', price: '15.90' },
]);

// Empty start
const newPrice = ref('');
const newMulti = ref(false);
const newVariants = ref<PriceVariant[]>([]);

// Sizes
const smPrice = ref('5.00');
const smMulti = ref(false);
const smVariants = ref<PriceVariant[]>([]);
const mdPrice = ref('');
const mdMulti = ref(true);
const mdVariants = ref<PriceVariant[]>([
  { label: 'Regular', price: '10.00' },
  { label: 'Large', price: '14.00' },
]);
const touchPrice = ref('');
const touchMulti = ref(true);
const touchVariants = ref<PriceVariant[]>([
  { label: 'Single', price: '6.50' },
  { label: 'Double', price: '11.00' },
]);

// Disabled
const disPrice = ref('25.00');
const disMulti = ref(false);
const disVariants = ref<PriceVariant[]>([]);
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdPriceVariants</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Single price or multi-variant price inputs. Used for menu items, shop products.</p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Single Price</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-sm">
        <SdPriceVariants
          v-model="singlePrice"
          v-model:variants="singleVariants"
          v-model:multi-variant="singleMulti"
          label="Price"
        />
        <p class="text-xs text-sd-text-muted mt-3">Value: {{ singlePrice }} | Multi: {{ singleMulti }}</p>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Multi-Variant (pre-filled)</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-lg">
        <SdPriceVariants
          v-model="menuPrice"
          v-model:variants="menuVariants"
          v-model:multi-variant="menuMulti"
          label="Pricing"
        />
        <p class="text-xs text-sd-text-muted mt-3">
          Variants: {{ menuVariants.map(v => `${v.label}: ${v.price}`).join(', ') }}
        </p>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Start Empty (click "Add variants")</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-lg">
        <SdPriceVariants
          v-model="newPrice"
          v-model:variants="newVariants"
          v-model:multi-variant="newMulti"
          label="Product Price"
        />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Sizes</h2>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white rounded-sd-md border border-sd-border p-5">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">sm</h3>
          <SdPriceVariants
            v-model="smPrice"
            v-model:variants="smVariants"
            v-model:multi-variant="smMulti"
            label="Price"
            size="sm"
          />
        </div>
        <div class="bg-white rounded-sd-md border border-sd-border p-5">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">md (default)</h3>
          <SdPriceVariants
            v-model="mdPrice"
            v-model:variants="mdVariants"
            v-model:multi-variant="mdMulti"
            label="Price"
            size="md"
          />
        </div>
        <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">touch</h3>
          <SdPriceVariants
            v-model="touchPrice"
            v-model:variants="touchVariants"
            v-model:multi-variant="touchMulti"
            label="Price"
            size="touch"
          />
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Custom Currency</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-sm">
        <SdPriceVariants
          model-value="9.99"
          label="Price (EUR)"
          currency="EUR"
        />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Disabled</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-sm">
        <SdPriceVariants
          v-model="disPrice"
          v-model:variants="disVariants"
          v-model:multi-variant="disMulti"
          label="Price"
          disabled
        />
      </div>
    </section>
  </div>
</template>
