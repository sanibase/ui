<script setup lang="ts">
import { ref } from 'vue';
import { SdButton, SdSignaturePad } from '@sanibase/ui';
import type { SdSignaturePadChange, SdSignaturePadExpose } from '@sanibase/ui';

const pad = ref<SdSignaturePadExpose | null>(null);
const empty = ref(true);
const preview = ref<string | null>(null);
const blobInfo = ref('');

function onChange(e: SdSignaturePadChange): void {
  empty.value = e.empty;
  if (e.empty) {
    preview.value = null;
    blobInfo.value = '';
  }
}

async function exportImage(): Promise<void> {
  if (!pad.value) return;
  preview.value = pad.value.toDataURL();
  const blob = await pad.value.toBlob();
  blobInfo.value = blob ? `${blob.type}, ${blob.size} bytes` : 'null';
}
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">
      SdSignaturePad
    </h1>
    <p class="text-sd-text-secondary text-sm mb-8">
      Draw with a finger, a pen or the mouse. Hands back a trimmed PNG of the ink, or null when empty.
    </p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">
        Basic, German words
      </h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-xl">
        <SdSignaturePad
          ref="pad"
          aria-label="Unterschrift"
          clear-label="Löschen"
          placeholder="Hier unterschreiben"
          data-testid="pad-main"
          @change="onChange"
        />
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <SdButton
            variant="secondary"
            label="Export PNG"
            :disabled="empty"
            @click="exportImage"
          />
          <span class="text-sm text-sd-text-secondary">empty: {{ empty }}<template v-if="blobInfo">, {{ blobInfo }}</template></span>
        </div>
        <div
          v-if="preview"
          class="mt-4 inline-block border border-dashed border-sd-border"
        >
          <img
            :src="preview"
            alt="Exported signature"
            class="block max-w-full"
          >
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">
        Disabled
      </h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-xl">
        <SdSignaturePad
          disabled
          :height="140"
        />
      </div>
    </section>
  </div>
</template>
