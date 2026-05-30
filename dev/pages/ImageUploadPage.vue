<script setup lang="ts">
import { ref } from 'vue';
import { SdImageUpload, useToast, SdToast } from '@sanibase/ui';

const toast = useToast();

const menuImage = ref<string | null>('https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=400&fit=crop');
const brandLogo = ref<string | null>(null);
const touchImage = ref<string | null>(null);
const loadingImage = ref<string | null>(null);

function onFileSelected(file: File) {
  toast.success(`Selected: ${file.name} (${Math.round(file.size / 1024)}KB)`);
}

function onError(message: string) {
  toast.error(message);
}
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdImageUpload</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Preview + upload + remove. Supports drag-and-drop, file validation, and immediate local preview.</p>

    <!-- ── WITH EXISTING IMAGE ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">With Existing Image</h2>
    <section class="mb-10">
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <SdImageUpload
          v-model="menuImage"
          placeholder="Menu item photo"
          @file-selected="onFileSelected"
          @error="onError"
        />
        <p class="text-xs text-sd-text-muted mt-3">Hover the image to see the replace overlay. Click "Remove" to clear.</p>
      </div>
    </section>

    <!-- ── EMPTY ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Empty -- Upload Prompt</h2>
    <section class="mb-10">
      <div class="bg-white rounded-sd-md border border-sd-border p-6 flex gap-6">
        <SdImageUpload
          v-model="brandLogo"
          placeholder="Upload logo"
          @file-selected="onFileSelected"
          @error="onError"
        />
        <div class="flex-1 pt-2">
          <p class="text-sm text-sd-text font-medium">Brand logo</p>
          <p class="text-xs text-sd-text-muted mt-1">Accepted: JPG, PNG, WebP. Max 5MB.</p>
          <p class="text-xs text-sd-text-muted mt-0.5">Drag and drop or click to browse.</p>
        </div>
      </div>
    </section>

    <!-- ── LOADING ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Loading State</h2>
    <section class="mb-10">
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <SdImageUpload
          v-model="loadingImage"
          loading
        />
        <p class="text-xs text-sd-text-muted mt-3">Shown while image is uploading to server.</p>
      </div>
    </section>

    <!-- ── SIZES ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Sizes</h2>
    <section class="mb-10">
      <div class="bg-white rounded-sd-md border border-sd-border p-6 flex items-end gap-6">
        <div class="text-center">
          <SdImageUpload size="sm" placeholder="sm" @file-selected="onFileSelected" @error="onError" />
          <p class="text-xs text-sd-text-muted mt-2">sm</p>
        </div>
        <div class="text-center">
          <SdImageUpload size="md" placeholder="md" @file-selected="onFileSelected" @error="onError" />
          <p class="text-xs text-sd-text-muted mt-2">md</p>
        </div>
        <div class="text-center">
          <SdImageUpload size="touch" placeholder="touch" @file-selected="onFileSelected" @error="onError" />
          <p class="text-xs text-sd-text-muted mt-2">touch</p>
        </div>
      </div>
    </section>

    <!-- ── TOUCH -- WIDE ASPECT ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Touch Size -- Wide Aspect (16/9)</h2>
    <section class="mb-10">
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-4">
        <SdImageUpload
          v-model="touchImage"
          size="touch"
          aspect-ratio="16/9"
          placeholder="Upload cover photo"
          @file-selected="onFileSelected"
          @error="onError"
        />
      </div>
    </section>

    <!-- Toast container -->
    <div class="fixed bottom-6 right-6 z-[999] flex flex-col gap-2">
      <SdToast
        v-for="t in toast.toasts.value"
        :key="t.id"
        :message="t.message"
        :variant="t.variant"
        :duration="t.duration"
        @close="toast.remove(t.id)"
      />
    </div>
  </div>
</template>
