<script setup lang="ts">
import { SdButton } from '@sanibase/ui';
import type { ButtonVariant, ButtonSize } from '@sanibase/ui';
import { PhPlus, PhFloppyDisk, PhTrash, PhPencil, PhArrowRight, PhX, PhCheck, PhDotsThree, PhGear, PhBell, PhArrowSquareOut } from '@phosphor-icons/vue';

const variants: { name: string; variant: ButtonVariant }[] = [
  { name: 'Primary', variant: 'primary' },
  { name: 'Primary Outline', variant: 'primary-outline' },
  { name: 'Secondary', variant: 'secondary' },
  { name: 'Secondary Outline', variant: 'secondary-outline' },
  { name: 'Success', variant: 'success' },
  { name: 'Success Outline', variant: 'success-outline' },
  { name: 'Warning', variant: 'warning' },
  { name: 'Warning Outline', variant: 'warning-outline' },
  { name: 'Info', variant: 'info' },
  { name: 'Info Outline', variant: 'info-outline' },
  { name: 'Danger', variant: 'danger' },
  { name: 'Danger Outline', variant: 'danger-outline' },
  { name: 'Ghost', variant: 'ghost' },
  { name: 'Hero Primary', variant: 'hero-primary' },
  { name: 'Hero Secondary', variant: 'hero-secondary' },
];

const sizes: { name: string; size: ButtonSize }[] = [
  { name: 'sm (32px)', size: 'sm' },
  { name: 'md (38px)', size: 'md' },
  { name: 'lg (46px)', size: 'lg' },
  { name: 'touch (56px)', size: 'touch' },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdButton</h1>
    <p class="text-sd-text-secondary text-sm mb-8">
      All variants, sizes, and states. Orange = primary CTAs. Purple = secondary actions.
    </p>

    <!-- All Variants -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Variants</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <div class="flex flex-wrap items-center gap-3">
          <SdButton v-for="v in variants" :key="v.variant" :label="v.name" :variant="v.variant" />
        </div>
      </div>
    </section>

    <!-- Hero Buttons -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Hero / Landing Page</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4">
        <div>
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">Brand gradient (CTAs)</h3>
          <div class="flex flex-wrap items-end gap-3">
            <SdButton label="Get Started" variant="hero-primary" size="md" />
            <SdButton label="Get Started" variant="hero-primary" size="lg" />
            <SdButton label="Get Started" variant="hero-primary" size="touch" />
          </div>
        </div>
        <div>
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">Purple gradient (secondary)</h3>
          <div class="flex flex-wrap items-end gap-3">
            <SdButton label="Learn More" variant="hero-secondary" size="md" />
            <SdButton label="Learn More" variant="hero-secondary" size="lg" />
            <SdButton label="Learn More" variant="hero-secondary" size="touch" />
          </div>
        </div>
        <div>
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">Full width</h3>
          <div class="max-w-sm space-y-3">
            <SdButton label="Start Free Trial" variant="hero-primary" size="lg" block />
            <SdButton label="View Demo" variant="hero-secondary" size="lg" block />
          </div>
        </div>
      </div>
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Sizes</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <div class="flex flex-wrap items-end gap-3">
          <SdButton v-for="s in sizes" :key="s.size" :label="s.name" variant="primary" :size="s.size" />
        </div>
        <div class="flex flex-wrap items-end gap-3 mt-4">
          <SdButton v-for="s in sizes" :key="s.size" :label="s.name" variant="secondary" :size="s.size" />
        </div>
      </div>
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">States</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4">
        <div>
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">Disabled</h3>
          <div class="flex flex-wrap items-center gap-3">
            <SdButton label="Primary" variant="primary" disabled />
            <SdButton label="Primary Outline" variant="primary-outline" disabled />
            <SdButton label="Secondary" variant="secondary" disabled />
            <SdButton label="Secondary Outline" variant="secondary-outline" disabled />
            <SdButton label="Danger" variant="danger" disabled />
            <SdButton label="Ghost" variant="ghost" disabled />
          </div>
        </div>
        <div>
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">Loading</h3>
          <div class="flex flex-wrap items-center gap-3">
            <SdButton label="Saving..." variant="primary" loading />
            <SdButton label="Saving..." variant="primary-outline" loading />
            <SdButton label="Saving..." variant="secondary" loading />
            <SdButton label="Deleting..." variant="danger" loading />
          </div>
        </div>
      </div>
    </section>

    <!-- With Icons -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">With Icons</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4">
        <div>
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">Icon Left</h3>
          <div class="flex flex-wrap items-center gap-3">
            <SdButton label="New Item" variant="primary">
              <template #icon-left><PhPlus :size="16" weight="bold" /></template>
            </SdButton>
            <SdButton label="Save" variant="secondary">
              <template #icon-left><PhFloppyDisk :size="16" weight="bold" /></template>
            </SdButton>
            <SdButton label="Edit" variant="secondary-outline">
              <template #icon-left><PhPencil :size="16" weight="regular" /></template>
            </SdButton>
            <SdButton label="Delete" variant="danger">
              <template #icon-left><PhTrash :size="16" weight="bold" /></template>
            </SdButton>
          </div>
        </div>
        <div>
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">Icon Right</h3>
          <div class="flex flex-wrap items-center gap-3">
            <SdButton label="Continue" variant="primary">
              <template #icon-right><PhArrowRight :size="16" weight="bold" /></template>
            </SdButton>
            <SdButton label="Next Step" variant="primary-outline">
              <template #icon-right><PhArrowRight :size="16" weight="regular" /></template>
            </SdButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Link Buttons -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Link Buttons (href)</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <div class="flex flex-wrap items-center gap-3">
          <SdButton label="View All Orders" variant="primary" href="#/orders">
            <template #icon-right><PhArrowSquareOut :size="16" weight="regular" /></template>
          </SdButton>
          <SdButton label="Documentation" variant="secondary-outline" href="#/docs">
            <template #icon-right><PhArrowSquareOut :size="16" weight="regular" /></template>
          </SdButton>
          <SdButton label="GitHub" variant="ghost" href="#/github">
            <template #icon-right><PhArrowSquareOut :size="16" weight="regular" /></template>
          </SdButton>
        </div>
        <p class="text-xs text-sd-text-muted mt-3">
          Renders as &lt;a&gt; instead of &lt;button&gt;. Works with RouterLink in Nuxt.
        </p>
      </div>
    </section>

    <!-- Icon Only -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Icon Only (square)</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4">
        <div>
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">Variants</h3>
          <div class="flex flex-wrap items-center gap-3">
            <SdButton variant="primary" icon>
              <template #icon-left><PhPlus :size="18" weight="bold" /></template>
            </SdButton>
            <SdButton variant="primary-outline" icon>
              <template #icon-left><PhPencil :size="18" weight="regular" /></template>
            </SdButton>
            <SdButton variant="secondary" icon>
              <template #icon-left><PhGear :size="18" weight="bold" /></template>
            </SdButton>
            <SdButton variant="secondary-outline" icon>
              <template #icon-left><PhBell :size="18" weight="regular" /></template>
            </SdButton>
            <SdButton variant="danger" icon>
              <template #icon-left><PhTrash :size="18" weight="bold" /></template>
            </SdButton>
            <SdButton variant="danger-outline" icon>
              <template #icon-left><PhX :size="18" weight="bold" /></template>
            </SdButton>
            <SdButton variant="ghost" icon>
              <template #icon-left><PhDotsThree :size="18" weight="bold" /></template>
            </SdButton>
          </div>
        </div>
        <div>
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">Sizes</h3>
          <div class="flex flex-wrap items-end gap-3">
            <SdButton variant="ghost" icon size="sm">
              <template #icon-left><PhX :size="14" weight="bold" /></template>
            </SdButton>
            <SdButton variant="ghost" icon size="md">
              <template #icon-left><PhX :size="16" weight="bold" /></template>
            </SdButton>
            <SdButton variant="ghost" icon size="lg">
              <template #icon-left><PhX :size="20" weight="bold" /></template>
            </SdButton>
            <SdButton variant="ghost" icon size="touch">
              <template #icon-left><PhX :size="24" weight="bold" /></template>
            </SdButton>
          </div>
        </div>
        <div>
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">Use cases</h3>
          <div class="flex flex-wrap items-center gap-3">
            <SdButton variant="ghost" icon size="sm" aria-label="Close">
              <template #icon-left><PhX :size="14" weight="bold" /></template>
            </SdButton>
            <span class="text-xs text-sd-text-muted">Close dialog</span>

            <span class="w-px h-6 bg-sd-border mx-2" />

            <SdButton variant="primary" icon size="md" aria-label="Accept">
              <template #icon-left><PhCheck :size="18" weight="bold" /></template>
            </SdButton>
            <SdButton variant="danger-outline" icon size="md" aria-label="Reject">
              <template #icon-left><PhX :size="18" weight="bold" /></template>
            </SdButton>
            <span class="text-xs text-sd-text-muted">Accept / Reject</span>

            <span class="w-px h-6 bg-sd-border mx-2" />

            <SdButton variant="ghost" icon size="md" aria-label="More options">
              <template #icon-left><PhDotsThree :size="18" weight="bold" /></template>
            </SdButton>
            <span class="text-xs text-sd-text-muted">Table row actions</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Full Width -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Full Width (block)</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-3 max-w-md">
        <SdButton label="Sign In" variant="primary" block />
        <SdButton label="Create Account" variant="primary-outline" block />
        <SdButton label="Continue as Guest" variant="ghost" block />
      </div>
    </section>

    <!-- Desktop vs Touch Comparison -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Desktop vs Touch</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Desktop -->
        <div class="bg-white rounded-sd-md border border-sd-border p-6">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">
            Desktop (md size) -- mouse + keyboard
          </h3>
          <div class="space-y-3">
            <div class="flex gap-2">
              <SdButton label="Save Order" variant="primary" size="md">
                <template #icon-left><PhFloppyDisk :size="16" weight="bold" /></template>
              </SdButton>
              <SdButton label="Cancel" variant="ghost" size="md" />
            </div>
            <div class="flex gap-2">
              <SdButton label="New Item" variant="secondary" size="md">
                <template #icon-left><PhPlus :size="16" weight="bold" /></template>
              </SdButton>
              <SdButton label="Edit" variant="secondary-outline" size="md">
                <template #icon-left><PhPencil :size="16" weight="regular" /></template>
              </SdButton>
              <SdButton label="Delete" variant="danger-outline" size="md">
                <template #icon-left><PhTrash :size="16" weight="regular" /></template>
              </SdButton>
            </div>
          </div>
        </div>

        <!-- Touch -->
        <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-6">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">
            Touch / POS (touch size) -- finger tapping
          </h3>
          <div class="space-y-3">
            <div class="flex gap-2">
              <SdButton label="Save Order" variant="primary" size="touch">
                <template #icon-left><PhFloppyDisk :size="20" weight="bold" /></template>
              </SdButton>
              <SdButton label="Cancel" variant="ghost" size="touch" />
            </div>
            <div class="flex gap-2">
              <SdButton label="New Item" variant="secondary" size="touch">
                <template #icon-left><PhPlus :size="20" weight="bold" /></template>
              </SdButton>
              <SdButton label="Delete" variant="danger" size="touch">
                <template #icon-left><PhTrash :size="20" weight="bold" /></template>
              </SdButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
