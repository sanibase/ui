<script setup lang="ts">
import { colors } from '@sanibase/ui';

const brandGradient = 'linear-gradient(135deg, #FF8C42, #FF6B6B, #D65D7A)';
const purpleGradient = 'linear-gradient(135deg, #8B5A9F, #6a3d82)';

const colorSwatches = [
  { label: 'Orange', value: colors.orange.DEFAULT },
  { label: 'Orange Dark', value: colors.orange.dark },
  { label: 'Coral', value: colors.coral },
  { label: 'Pink', value: colors.pink },
  { label: 'Purple', value: colors.purple.DEFAULT },
  { label: 'Purple Dark', value: colors.purple.dark },
  { label: 'Purple Deeper', value: colors.purple.deeper },
  { label: 'Purple Light', value: colors.purple.light },
  { label: 'Purple Subtle', value: colors.purple.subtle },
];

const semanticSwatches = [
  { label: 'Success', value: colors.success.DEFAULT, dark: colors.success.dark, light: colors.success.light, text: colors.success.text },
  { label: 'Warning', value: colors.warning.DEFAULT, dark: colors.warning.dark, light: colors.warning.light, text: colors.warning.text },
  { label: 'Error', value: colors.error.DEFAULT, dark: colors.error.dark, light: colors.error.light, text: colors.error.text },
  { label: 'Info', value: colors.info.DEFAULT, dark: colors.info.dark, light: colors.info.light },
];

const neutralSwatches = [
  { label: 'Text', value: colors.text.DEFAULT },
  { label: 'Text Secondary', value: colors.text.secondary },
  { label: 'Text Muted', value: colors.text.muted },
  { label: 'Gray', value: colors.gray },
  { label: 'Background', value: colors.bg.DEFAULT },
  { label: 'Background Alt', value: colors.bg.alt },
  { label: 'Background Surface', value: colors.bg.surface },
  { label: 'Background Dark', value: colors.bg.dark },
  { label: 'Border', value: colors.border.DEFAULT },
  { label: 'Border Light', value: colors.border.light },
];

const typeSamples = [
  { tag: 'h1', label: 'Heading 1', size: '24px', weight: '700', family: 'heading' },
  { tag: 'h2', label: 'Heading 2', size: '20px', weight: '700', family: 'heading' },
  { tag: 'h3', label: 'Heading 3', size: '16px', weight: '600', family: 'heading' },
  { tag: 'h4', label: 'Heading 4', size: '14px', weight: '600', family: 'heading' },
  { tag: 'body', label: 'Body', size: '14px', weight: '400', family: 'body' },
  { tag: 'small', label: 'Small', size: '13px', weight: '500', family: 'body' },
  { tag: 'caption', label: 'Caption', size: '12px', weight: '400', family: 'body' },
  { tag: 'badge', label: 'Badge', size: '11px', weight: '600', family: 'body' },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-6">Design Tokens</h1>

    <!-- Gradients -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Gradients</h2>
      <div class="flex gap-4">
        <div class="flex flex-col items-center gap-2">
          <div class="w-48 h-24 rounded-sd-md shadow-sd-sm" :style="{ background: brandGradient }" />
          <span class="text-xs text-sd-text-muted font-medium">Brand Gradient</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <div class="w-48 h-24 rounded-sd-md shadow-sd-sm" :style="{ background: purpleGradient }" />
          <span class="text-xs text-sd-text-muted font-medium">Purple Gradient</span>
        </div>
      </div>
    </section>

    <!-- Brand Colors -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Brand Colors</h2>
      <div class="flex flex-wrap gap-4">
        <div v-for="s in colorSwatches" :key="s.label" class="flex flex-col items-center gap-2">
          <div
            class="w-20 h-20 rounded-sd border border-sd-border shadow-sd-sm"
            :style="{ background: s.value }"
          />
          <span class="text-xs text-sd-text-secondary font-medium">{{ s.label }}</span>
          <code class="text-[11px] text-sd-text-muted">{{ s.value }}</code>
        </div>
      </div>
    </section>

    <!-- Semantic Colors -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Semantic Colors</h2>
      <div class="flex flex-wrap gap-4">
        <div v-for="s in semanticSwatches" :key="s.label" class="flex flex-col items-center gap-2">
          <div class="flex gap-1">
            <div class="w-10 h-14 rounded-sd-sm" :style="{ background: s.value }" />
            <div v-if="s.dark" class="w-10 h-14 rounded-sd-sm" :style="{ background: s.dark }" />
            <div class="w-10 h-14 rounded-sd-sm border border-sd-border" :style="{ background: s.light }" />
            <div v-if="s.text" class="w-10 h-14 rounded-sd-sm border border-sd-border" :style="{ background: s.light, color: s.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600 }">Aa</div>
          </div>
          <span class="text-xs text-sd-text-secondary font-medium">{{ s.label }}</span>
        </div>
      </div>
    </section>

    <!-- Neutrals -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Neutrals</h2>
      <div class="flex flex-wrap gap-4">
        <div v-for="s in neutralSwatches" :key="s.label" class="flex flex-col items-center gap-2">
          <div
            class="w-20 h-20 rounded-sd border border-sd-border shadow-sd-sm"
            :style="{ background: s.value }"
          />
          <span class="text-xs text-sd-text-secondary font-medium">{{ s.label }}</span>
          <code class="text-[11px] text-sd-text-muted">{{ s.value }}</code>
        </div>
      </div>
    </section>

    <!-- Typography -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Typography</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4">
        <div v-for="t in typeSamples" :key="t.tag" class="flex items-baseline gap-6">
          <code class="text-xs text-sd-text-muted w-16 shrink-0">{{ t.tag }}</code>
          <span
            :class="t.family === 'heading' ? 'font-heading' : 'font-body'"
            :style="{ fontSize: t.size, fontWeight: t.weight, letterSpacing: t.family === 'heading' ? '-0.02em' : undefined }"
          >
            The quick brown fox jumps over the lazy dog
          </span>
          <span class="text-[11px] text-sd-text-muted ml-auto shrink-0">
            {{ t.size }} / {{ t.weight }}
          </span>
        </div>
      </div>
    </section>

    <!-- Spacing -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Spacing (4px grid)</h2>
      <div class="flex items-end gap-4">
        <div v-for="(val, name) in { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px', '2xl': '32px', '3xl': '48px' }"
             :key="name" class="flex flex-col items-center gap-2">
          <div class="bg-sd-border border border-sd-border rounded-sm" :style="{ width: val, height: val }" />
          <span class="text-xs text-sd-text-secondary font-medium">{{ name }}</span>
          <code class="text-[11px] text-sd-text-muted">{{ val }}</code>
        </div>
      </div>
    </section>

    <!-- Shadows -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Shadows</h2>

      <h3 class="text-sm font-semibold text-sd-text-secondary mb-3">Neutral</h3>
      <div class="flex gap-6 mb-6">
        <div v-for="(shadow, label) in { sm: 'shadow-sd-sm', default: 'shadow-sd', lg: 'shadow-sd-lg' }"
             :key="label" class="flex flex-col items-center gap-2">
          <div class="w-24 h-24 bg-white rounded-sd-md border border-sd-border" :class="shadow" />
          <span class="text-xs text-sd-text-secondary font-medium">{{ label }}</span>
        </div>
      </div>

      <h3 class="text-sm font-semibold text-sd-text-secondary mb-3">Branded</h3>
      <div class="flex gap-6">
        <div class="flex flex-col items-center gap-2">
          <div class="w-24 h-24 bg-white rounded-sd-md border border-sd-orange/20 shadow-sd-orange" />
          <span class="text-xs text-sd-text-secondary font-medium">orange (primary)</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <div class="w-24 h-24 bg-white rounded-sd-md border border-sd-purple/20 shadow-sd-purple" />
          <span class="text-xs text-sd-text-secondary font-medium">purple (secondary)</span>
        </div>
      </div>
    </section>

    <!-- Radii -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Border Radius</h2>
      <div class="flex gap-6">
        <div v-for="(cls, label) in { 'sm (6px)': 'rounded-sd-sm', 'default (8px)': 'rounded-sd', 'md (12px)': 'rounded-sd-md', 'lg (16px)': 'rounded-sd-lg' }"
             :key="label" class="flex flex-col items-center gap-2">
          <div class="w-24 h-24 bg-sd-bg-surface border border-sd-border" :class="cls" />
          <span class="text-xs text-sd-text-secondary font-medium">{{ label }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
