<script setup lang="ts">
import { ref } from 'vue';
import { SdTextarea } from '@sanibase/ui';

const notes = ref('');
const bio = ref('This is a pre-filled bio that demonstrates auto-resize. Try adding more lines and watch it grow.');
const limited = ref('');
const errVal = ref('');
const smVal = ref('');
const mdVal = ref('');
const lgVal = ref('');
const touchVal = ref('');
const desktopNotes = ref('');
const touchNotes = ref('');
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdTextarea</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Multi-line text input with auto-resize and character count.</p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Basic</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdTextarea v-model="notes" label="Notes" placeholder="Add notes about this order..." />
        <SdTextarea v-model="bio" label="Bio (auto-resize)" hint="Grows as you type" />
        <SdTextarea v-model="limited" label="Description" placeholder="Max 200 characters" :maxlength="200" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">States</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdTextarea v-model="errVal" label="With Error" error="Description is required" placeholder="..." />
        <SdTextarea label="Disabled" model-value="Disabled textarea content" disabled />
        <SdTextarea label="Read Only" model-value="This content cannot be edited" readonly />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Sizes</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 space-y-4 max-w-md">
        <SdTextarea v-model="smVal" label="sm" size="sm" placeholder="Small textarea..." :rows="2" />
        <SdTextarea v-model="mdVal" label="md (default)" size="md" placeholder="Medium textarea..." :rows="2" />
        <SdTextarea v-model="lgVal" label="lg" size="lg" placeholder="Large textarea..." :rows="2" />
        <SdTextarea v-model="touchVal" label="touch" size="touch" placeholder="Touch textarea..." :rows="2" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Desktop vs Touch</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-sd-md border border-sd-border p-6">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">Desktop (md)</h3>
          <SdTextarea v-model="desktopNotes" placeholder="Order notes..." size="md" :rows="3" />
        </div>
        <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-6">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">Touch / POS (touch)</h3>
          <SdTextarea v-model="touchNotes" placeholder="Order notes..." size="touch" :rows="3" />
        </div>
      </div>
    </section>
  </div>
</template>
