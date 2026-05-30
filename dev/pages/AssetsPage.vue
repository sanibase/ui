<script setup lang="ts">
import { ref, onMounted } from 'vue';

import iconOnlyUrl from '../../src/assets/brand/icon-only.svg';
import iconRoundedDarkUrl from '../../src/assets/brand/icon-rounded-dark.svg';
import iconRoundedWhiteUrl from '../../src/assets/brand/icon-rounded-white.svg';

import visaUrl from '../../src/assets/logos/visa.svg';
import mastercardUrl from '../../src/assets/logos/mastercard.svg';
import mastercardDarkUrl from '../../src/assets/logos/mastercard-dark.svg';
import twintUrl from '../../src/assets/logos/twint.svg';
import postfinanceUrl from '../../src/assets/logos/postfinance.svg';
import applepayUrl from '../../src/assets/logos/applepay.svg';
import applepayDarkUrl from '../../src/assets/logos/applepay-dark.svg';
import googlepayUrl from '../../src/assets/logos/googlepay.svg';
import googlepayDarkUrl from '../../src/assets/logos/googlepay-dark.svg';

const brandAssets = [
  { label: 'Icon Only', url: iconOnlyUrl, file: 'icon-only.svg', note: 'Transparent background', bgClass: 'bg-sd-bg-alt' },
  { label: 'Rounded Dark', url: iconRoundedDarkUrl, file: 'icon-rounded-dark.svg', note: 'Favicon, app icon', bgClass: 'bg-sd-bg-alt' },
  { label: 'Rounded White', url: iconRoundedWhiteUrl, file: 'icon-rounded-white.svg', note: 'Dark UI contexts', bgClass: 'bg-sd-bg-dark' },
];

const paymentLogos = [
  { label: 'Visa', url: visaUrl, darkUrl: visaUrl, file: 'visa.svg' },
  { label: 'Mastercard', url: mastercardUrl, darkUrl: mastercardDarkUrl, file: 'mastercard.svg' },
  { label: 'Twint', url: twintUrl, darkUrl: twintUrl, file: 'twint.svg' },
  { label: 'PostFinance', url: postfinanceUrl, darkUrl: postfinanceUrl, file: 'postfinance.svg' },
  { label: 'Apple Pay', url: applepayUrl, darkUrl: applepayDarkUrl, file: 'applepay.svg' },
  { label: 'Google Pay', url: googlepayUrl, darkUrl: googlepayDarkUrl, file: 'googlepay.svg' },
];

const fileSizes = ref<Record<string, string>>({});

onMounted(async () => {
  const allAssets = [...brandAssets, ...paymentLogos];
  for (const asset of allAssets) {
    try {
      const resp = await fetch(asset.url);
      const blob = await resp.blob();
      const kb = (blob.size / 1024).toFixed(1);
      fileSizes.value[asset.file] = `${kb} KB`;
    } catch {
      fileSizes.value[asset.file] = '?';
    }
  }
});
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">Logos & Assets</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Brand marks and payment logos. All SVG, all 3 marks are 512x512 viewBox.</p>

    <!-- Brand Marks -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Brand Marks</h2>
      <div class="grid grid-cols-3 gap-4">
        <div
          v-for="asset in brandAssets"
          :key="asset.file"
          class="bg-white rounded-sd-md border border-sd-border p-4 flex flex-col items-center gap-3"
        >
          <div
            class="w-full aspect-square flex items-center justify-center rounded-sd"
            :class="asset.bgClass"
          >
            <img :src="asset.url" :alt="asset.label" class="w-20 h-20 object-contain" />
          </div>
          <div class="text-center">
            <p class="text-sm font-medium text-sd-text">{{ asset.label }}</p>
            <p class="text-xs text-sd-text-muted mt-0.5">{{ asset.note }}</p>
            <code class="text-[11px] text-sd-text-muted block mt-1">{{ asset.file }}</code>
            <p class="text-[11px] text-sd-text-muted">{{ fileSizes[asset.file] || '...' }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Payment Logos -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Payment Logos</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div
          v-for="logo in paymentLogos"
          :key="logo.file"
          class="bg-white rounded-sd-md border border-sd-border p-4 flex flex-col items-center gap-3"
        >
          <div class="w-full h-16 flex items-center justify-center">
            <img :src="logo.url" :alt="logo.label" class="max-h-10 max-w-full object-contain" />
          </div>
          <div class="text-center">
            <p class="text-sm font-medium text-sd-text">{{ logo.label }}</p>
            <code class="text-[11px] text-sd-text-muted block">{{ logo.file }}</code>
            <p class="text-[11px] text-sd-text-muted">{{ fileSizes[logo.file] || '...' }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Usage on dark / light backgrounds -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Context Preview</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p class="text-xs font-medium text-sd-text-muted uppercase tracking-wider mb-2">Light background</p>
          <div class="rounded-sd-md border border-sd-border p-8 flex items-center justify-center gap-6 bg-white">
            <img :src="iconRoundedDarkUrl" alt="Dark mark" class="w-10 h-10" />
            <img v-for="logo in paymentLogos" :key="logo.file" :src="logo.url" :alt="logo.label" class="h-5 object-contain" />
          </div>
        </div>
        <div>
          <p class="text-xs font-medium text-sd-text-muted uppercase tracking-wider mb-2">Dark background</p>
          <div class="rounded-sd-md p-8 flex items-center justify-center gap-6 bg-sd-bg-dark">
            <img :src="iconRoundedWhiteUrl" alt="White mark" class="w-10 h-10" />
            <img v-for="logo in paymentLogos" :key="'dark-' + logo.file" :src="logo.darkUrl" :alt="logo.label" class="h-5 object-contain" />
          </div>
        </div>
      </div>
    </section>

    <!-- Generated assets note -->
    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Generated Sizes</h2>
      <p class="text-sm text-sd-text-secondary mb-3">
        PNGs for Android, iOS, OG, and MS Tile are generated from these 3 source SVGs
        via <code class="text-xs bg-sd-bg-alt px-1.5 py-0.5 rounded">generate.sh</code>.
        Not stored in the repo.
      </p>
      <div class="bg-white rounded-sd-md border border-sd-border p-4 text-sm text-sd-text-secondary">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
          <span>Android icons: 36 - 512px</span>
          <span>Apple Touch: 57 - 180px</span>
          <span>Favicons: 16 - 256px</span>
          <span>Maskable: 512px</span>
          <span>MS Tile: 70 - 310px</span>
          <span>App Store / Play Store: 512 - 1024px</span>
          <span>OG Facebook: 1200x630</span>
          <span>OG Twitter: 1200x600</span>
          <span>OG LinkedIn: 1200x627</span>
          <span>OG WhatsApp: 300x300</span>
          <span>Banners: 1920x1080, 1080x1080</span>
          <span>All in light + dark variants</span>
        </div>
      </div>
    </section>
  </div>
</template>
