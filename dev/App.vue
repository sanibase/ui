<script setup lang="ts">
import { RouterView, RouterLink, useRoute } from 'vue-router';
import { computed } from 'vue';
import { SdComposerDock } from '@sanibase/ui';
import ComposerFields from './components/ComposerFields.vue';

const route = useRoute();
const isHome = computed(() => route.path === '/');
</script>

<template>
  <div class="min-h-screen bg-sd-bg-alt">
    <!-- Top bar -->
    <header class="sticky top-0 z-50 bg-white border-b border-sd-border px-6 h-14 flex items-center gap-4">
      <RouterLink to="/" class="flex items-center gap-3 no-underline">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
             style="background: linear-gradient(135deg, #8B5A9F, #6a3d82)">
          Sd
        </div>
        <span class="font-heading text-lg font-bold text-sd-text">SaniDesk UI</span>
      </RouterLink>
      <span class="text-sd-text-muted text-sm">Component Gallery</span>

      <div v-if="!isHome" class="ml-auto">
        <RouterLink to="/" class="text-sm text-sd-purple hover:underline">&larr; All components</RouterLink>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-7xl mx-auto px-6 py-8">
      <RouterView />
    </main>

    <!--
      Mounted in the shell, next to the RouterView and never inside it. That
      is the whole integration contract: a dock rendered by a page unmounts
      with that page, and a draft that dies on navigation is the bug this
      component exists to prevent. Drive it from `/composer-dock`, then
      navigate anywhere in the gallery — the drafts stay open.
    -->
    <SdComposerDock>
      <template #default="{ composer }">
        <ComposerFields :composer="composer" />
      </template>
    </SdComposerDock>
  </div>
</template>
