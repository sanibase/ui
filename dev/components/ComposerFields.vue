<script setup lang="ts">
/**
 * Gallery-only composer body — this is the part `SdComposerDock` does NOT own.
 *
 * The dock owns the chrome, the three states and the arrangement; the fields
 * are the host's. This reproduces frame 03 of the SaniMail mockup closely
 * enough to judge the geometry, and nothing in it ships.
 */
import { computed } from 'vue';
import { SdButton, SdTagInput, useComposerDock } from '@sanibase/ui';
import type { ComposerWindow, TagSuggestion } from '@sanibase/ui';
import {
  PhPaperPlaneTilt,
  PhPaperclip,
  PhTextB,
  PhTextItalic,
  PhTextUnderline,
  PhTrash,
} from '@phosphor-icons/vue';

const props = defineProps<{ composer: ComposerWindow }>();

const dock = useComposerDock();

interface Draft {
  to: string[];
  subject: string;
  body: string;
}

const draft = computed<Draft>(() => (props.composer.data ?? {}) as unknown as Draft);

const recipients = computed<string[]>({
  get: () => draft.value.to ?? [],
  set: (to) => dock.update(props.composer.id, { data: { ...draft.value, to } }),
});

const subject = computed<string>({
  get: () => draft.value.subject ?? '',
  set: (subject) => {
    dock.update(props.composer.id, { data: { ...draft.value, subject } });
    // The title bar follows the subject, exactly as it does in a mail client.
    dock.update(props.composer.id, { title: subject });
  },
});

const body = computed<string>({
  get: () => draft.value.body ?? '',
  set: (v) => dock.update(props.composer.id, { data: { ...draft.value, body: v } }),
});

const contacts: TagSuggestion[] = [
  { value: 'marco.buehler@pistor.ch', label: 'Marco Bühler', description: 'marco.buehler@pistor.ch', initials: 'MB' },
  { value: 'bestellung@pistor.ch', label: 'Pistor AG, Bestellwesen', description: 'bestellung@pistor.ch', initials: 'PA' },
  { value: 'kueche@medusabar.ch', label: 'Küche (Gruppe)', description: 'kueche@medusabar.ch', initials: 'KU' },
];
</script>

<template>
  <!-- Von -->
  <div class="flex items-center gap-2 min-h-[42px] px-3.5 py-1 border-b border-sd-border text-[13.5px]">
    <span class="w-9 shrink-0 text-sd-text-secondary text-[12.5px]">Von</span>
    <span class="inline-flex items-center gap-1.5 h-7 px-2 rounded-full bg-sd-bg-surface border border-sd-border text-[12.5px]">
      <span class="w-5 h-5 rounded-full bg-sd-purple text-white text-[9px] flex items-center justify-center">AM</span>
      Anna Meier, anna.meier@medusabar.ch
    </span>
  </div>

  <!-- An -->
  <div class="px-3.5 py-1.5 border-b border-sd-border">
    <SdTagInput
      v-model="recipients"
      :suggestions="contacts"
      :lowercase="false"
      :separators="[',', ';']"
      placeholder="Name oder Adresse"
    />
  </div>

  <!-- Betreff -->
  <div class="flex items-center gap-2 min-h-[42px] px-3.5 border-b border-sd-border text-[13.5px]">
    <label
      :for="`subject-${composer.id}`"
      class="w-9 shrink-0 text-sd-text-secondary text-[12.5px]"
    >Betreff</label>
    <input
      :id="`subject-${composer.id}`"
      v-model="subject"
      data-autofocus
      type="text"
      class="sd-focus-ring flex-1 h-9 bg-transparent outline-none font-medium text-sd-text rounded-sm"
      placeholder="Betreff"
    >
  </div>

  <!-- Toolbar -->
  <div class="flex items-center gap-0.5 px-2.5 py-1 border-b border-sd-border">
    <button
      v-for="tool in [
        { icon: PhTextB, label: 'Fett' },
        { icon: PhTextItalic, label: 'Kursiv' },
        { icon: PhTextUnderline, label: 'Unterstrichen' },
      ]"
      :key="tool.label"
      type="button"
      class="sd-focus-ring w-7 h-7 flex items-center justify-center rounded-md text-sd-text-secondary hover:bg-sd-bg-surface"
      :aria-label="tool.label"
    >
      <component
        :is="tool.icon"
        :size="16"
        aria-hidden="true"
      />
    </button>
  </div>

  <!-- Body -->
  <textarea
    v-model="body"
    class="sd-focus-ring flex-1 min-h-0 w-full resize-none p-4 text-sm leading-relaxed text-sd-text outline-none"
    placeholder="Nachricht"
  />

  <!-- Footer -->
  <div class="flex items-center gap-2 px-3.5 py-2.5 border-t border-sd-border">
    <SdButton
      label="Senden"
      size="sm"
    >
      <template #icon-left>
        <PhPaperPlaneTilt :size="16" />
      </template>
    </SdButton>
    <button
      type="button"
      class="sd-focus-ring w-8 h-8 flex items-center justify-center rounded-md text-sd-text-secondary hover:bg-sd-bg-surface"
      aria-label="Anhang hinzufügen"
    >
      <PhPaperclip
        :size="18"
        aria-hidden="true"
      />
    </button>
    <span class="flex-1" />
    <span class="text-[11.5px] text-sd-text-secondary">Entwurf gespeichert 14:33</span>
    <button
      type="button"
      class="sd-focus-ring w-8 h-8 flex items-center justify-center rounded-md text-sd-text-secondary hover:bg-sd-bg-surface"
      aria-label="Verwerfen"
      @click="dock.close(composer.id)"
    >
      <PhTrash
        :size="18"
        aria-hidden="true"
      />
    </button>
  </div>
</template>
