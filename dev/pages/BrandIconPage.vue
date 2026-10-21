<script setup lang="ts">
import { SdBrandIcon } from '@sanibase/ui';
import { BRAND_SLUGS, brandIcons } from '@sanibase/brand-icons';

const social = BRAND_SLUGS.filter((s) => brandIcons[s].group === 'social');
const payment = BRAND_SLUGS.filter((s) => brandIcons[s].group === 'payment');
const groups = [
  { title: 'Social, maps, reviews', slugs: social },
  { title: 'Payment', slugs: payment },
];
const sizes = [16, 20, 24, 32, 48];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdBrandIcon</h1>
    <p class="text-sd-text-secondary text-sm mb-8">
      Brand logos from <code>@sanibase/brand-icons</code>. <code>color</code> is the official mark, never
      recoloured; <code>mono</code> is one shape in <code>currentColor</code>. <code>size</code> is the
      height, width follows the mark. Each brand's usage rule is in the data; hover a tile to read it.
    </p>

    <template v-for="group in groups" :key="group.title">
      <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">
        {{ group.title }}
      </h2>
      <section class="mb-10 grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))">
        <div
          v-for="slug in group.slugs"
          :key="slug"
          class="rounded-lg border border-sd-border p-3"
          :title="brandIcons[slug].usage"
        >
          <div class="flex items-center gap-3 mb-2">
            <SdBrandIcon :brand="slug" :size="28" />
            <span class="text-sd-text"><SdBrandIcon :brand="slug" variant="mono" :size="28" /></span>
            <span class="rounded bg-sd-bg-dark p-1 text-white"><SdBrandIcon :brand="slug" variant="mono" :size="20" /></span>
          </div>
          <div class="text-sm font-medium text-sd-text">{{ brandIcons[slug].name }}</div>
          <code class="text-xs text-sd-text-muted">{{ slug }}{{ brandIcons[slug].colorMark ? '' : ' (mono only)' }}</code>
        </div>
      </section>
    </template>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Sizes</h2>
    <section class="mb-10 space-y-4">
      <div v-for="size in sizes" :key="size" class="flex items-center gap-6">
        <SdBrandIcon brand="google" :size="size" />
        <SdBrandIcon brand="instagram" :size="size" />
        <SdBrandIcon brand="twint" :size="size" />
        <SdBrandIcon brand="googlepay" :size="size" />
        <code class="text-xs text-sd-text-muted">{{ size }}px</code>
      </div>
      <div class="flex items-center gap-6 text-2xl">
        <SdBrandIcon brand="facebook" size="1em" />
        <span class="text-sd-text">Text at 1em, icon at <code>size="1em"</code></span>
      </div>
    </section>

    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Rules</h2>
    <section class="mb-10 space-y-4 text-sm text-sd-text">
      <div class="flex items-center gap-3">
        <SdBrandIcon brand="twitter" :size="24" />
        <span><code>brand="twitter"</code> shows the X logo, labelled "X". The stored key stays <code>twitter</code>.</span>
      </div>
      <div class="flex items-center gap-3">
        <SdBrandIcon brand="applemaps" :size="24" />
        <span><code>brand="applemaps"</code> renders nothing: Apple does not allow its logo as an icon. Use a text link "Apple Maps".</span>
      </div>
      <div class="flex items-center gap-3">
        <SdBrandIcon brand="mastercard" :size="24" />
        <span><code>brand="mastercard"</code> has no colour mark yet, so <code>color</code> falls back to <code>mono</code>.</span>
      </div>
      <div class="flex items-center gap-3">
        <SdBrandIcon brand="whatsapp" title="" :size="24" />
        <span>WhatsApp with <code>title=""</code>: decorative, because this text names it.</span>
      </div>
    </section>
  </div>
</template>
