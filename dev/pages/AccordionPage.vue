<script setup lang="ts">
import { ref } from 'vue';
import { SdAccordion, SdCheckbox, SdToggle } from '@sanibase/ui';
import type { AccordionItem } from '@sanibase/ui';

const faqOpen = ref<string[]>(['shipping']);
const settingsOpen = ref<string[]>([]);
const modifiersOpen = ref<string[]>(['toppings']);

const emailNotif = ref(true);
const pushNotif = ref(false);
const smsNotif = ref(false);
const twoFactor = ref(true);
const loginAlerts = ref(true);

const faqItems: AccordionItem[] = [
  { key: 'shipping', label: 'Shipping & Delivery' },
  { key: 'returns', label: 'Returns & Refunds' },
  { key: 'payment', label: 'Payment Methods' },
  { key: 'support', label: 'Customer Support', badge: 'New' },
];

const settingsItems: AccordionItem[] = [
  { key: 'notifications', label: 'Notifications', badge: 3 },
  { key: 'privacy', label: 'Privacy & Security' },
  { key: 'billing', label: 'Billing', disabled: true },
];

const modifierItems: AccordionItem[] = [
  { key: 'toppings', label: 'Extra Toppings', badge: 5 },
  { key: 'sides', label: 'Sides', badge: 3 },
  { key: 'drinks', label: 'Drinks', badge: 8 },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdAccordion</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Collapsible sections with animated chevron. Supports single or multiple open sections.</p>

    <!-- ── MULTIPLE OPEN ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Multiple Open (default)</h2>
    <section class="mb-10 max-w-2xl">
      <SdAccordion v-model="faqOpen" :items="faqItems">
        <template #shipping>
          <p class="text-sm text-sd-text-secondary leading-relaxed">We offer free shipping on orders over CHF 50. Standard delivery takes 2-3 business days. Express delivery is available for CHF 9.90.</p>
        </template>
        <template #returns>
          <p class="text-sm text-sd-text-secondary leading-relaxed">Items can be returned within 30 days of purchase. Please ensure items are in their original condition. Refunds are processed within 5 business days.</p>
        </template>
        <template #payment>
          <p class="text-sm text-sd-text-secondary leading-relaxed">We accept Visa, Mastercard, TWINT, and bank transfers. All payments are processed securely.</p>
        </template>
        <template #support>
          <p class="text-sm text-sd-text-secondary leading-relaxed">Our support team is available Monday to Friday, 9:00 - 17:00. Reach us at support@example.ch or call +41 44 000 00 00.</p>
        </template>
      </SdAccordion>
    </section>

    <!-- ── SINGLE OPEN ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Single Open (accordion mode)</h2>
    <section class="mb-10 max-w-2xl">
      <SdAccordion v-model="settingsOpen" :items="settingsItems" single>
        <template #notifications>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-sd-text">Email notifications</span>
              <SdToggle v-model="emailNotif" size="sm" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-sd-text">Push notifications</span>
              <SdToggle v-model="pushNotif" size="sm" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-sd-text">SMS alerts</span>
              <SdToggle v-model="smsNotif" size="sm" />
            </div>
          </div>
        </template>
        <template #privacy>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-sd-text">Two-factor authentication</span>
              <SdToggle v-model="twoFactor" size="sm" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-sd-text">Login alerts</span>
              <SdToggle v-model="loginAlerts" size="sm" />
            </div>
          </div>
        </template>
        <template #billing>
          <p class="text-sm text-sd-text-secondary">Billing settings are managed by the account owner.</p>
        </template>
      </SdAccordion>
      <p class="text-xs text-sd-text-muted mt-2">"Billing" is disabled.</p>
    </section>

    <!-- ── TOUCH -- ORDERING MODIFIERS ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Touch Size -- Ordering Modifiers</h2>
    <section class="mb-10 max-w-2xl">
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-4">
        <SdAccordion v-model="modifiersOpen" :items="modifierItems" size="touch">
          <template #toppings>
            <div class="space-y-3">
              <SdCheckbox label="Extra Cheese (+CHF 2.00)" size="touch" />
              <SdCheckbox label="Mushrooms (+CHF 2.50)" size="touch" />
              <SdCheckbox label="Olives (+CHF 1.50)" size="touch" />
              <SdCheckbox label="Jalapenos (+CHF 1.50)" size="touch" />
              <SdCheckbox label="Pepperoni (+CHF 3.00)" size="touch" />
            </div>
          </template>
          <template #sides>
            <div class="space-y-3">
              <SdCheckbox label="Garlic Bread (CHF 4.50)" size="touch" />
              <SdCheckbox label="Side Salad (CHF 6.00)" size="touch" />
              <SdCheckbox label="Fries (CHF 5.00)" size="touch" />
            </div>
          </template>
          <template #drinks>
            <div class="space-y-3">
              <SdCheckbox label="Cola (CHF 3.50)" size="touch" />
              <SdCheckbox label="Sparkling Water (CHF 3.00)" size="touch" />
              <SdCheckbox label="Beer (CHF 6.50)" size="touch" />
            </div>
          </template>
        </SdAccordion>
      </div>
    </section>
  </div>
</template>
