<script setup lang="ts">
import { type Component, computed, useAttrs } from 'vue';
import { PhArrowLeft } from '@phosphor-icons/vue';

/**
 * The way back from a sub page (ADMIN-UI-RULES R6.1): top left, above the
 * title, an arrow and the parent's name ("<- Katalog") in the grey outline.
 * On a phone the arrow alone, 44 x 44.
 *
 * `label` is the parent's name as shown; `hint` is the full name a screen
 * reader and the hover hint use ("Zurück zu Katalog"), required because on a
 * phone the arrow is all there is.
 *
 * Renders a router link when given one: `<SdBackLink :as="NuxtLink" to="/katalog" ...>`
 * (every attribute but the ones below is passed through), an `<a>` with
 * `href`, else a `<button>` that emits `click` (a list-detail view that steps
 * back without changing the URL).
 */
defineOptions({ inheritAttrs: false });

export interface SdBackLinkProps {
  label: string;
  hint: string;
  /** The element or component to render, e.g. NuxtLink / RouterLink. */
  as?: string | Component;
}

const props = withDefaults(defineProps<SdBackLinkProps>(), { as: undefined });
const attrs = useAttrs();

const tag = computed<string | Component>(() => {
  if (props.as) return props.as;
  return attrs.href ? 'a' : 'button';
});
</script>

<template>
  <component
    :is="tag"
    v-bind="attrs"
    :type="tag === 'button' ? 'button' : undefined"
    :aria-label="hint"
    :title="hint"
    class="sd-back-link sd-btn-neutral-outline inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[6px] px-3 text-[13px] font-semibold no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sd-orange/30 focus-visible:ring-offset-2"
  >
    <PhArrowLeft class="sd-back-link-icon shrink-0" />
    <span class="sd-back-link-label">{{ label }}</span>
  </component>
</template>

<style>
/* ADMIN-UI-RULES R6.1: 32px with words on a wide screen, the arrow alone at 44 x 44 on a phone. */
.sd-back-link {
  height: 32px;
  align-self: flex-start;
}
.sd-back-link-icon {
  width: 16px;
  height: 16px;
}
@media (max-width: 639.98px) {
  .sd-back-link {
    width: 44px;
    height: 44px;
    padding: 0;
  }
  .sd-back-link-label {
    display: none;
  }
  .sd-back-link-icon {
    width: 20px;
    height: 20px;
  }
}
</style>
