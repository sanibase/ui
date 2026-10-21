<script setup lang="ts">
/**
 * A brand logo (Google, Instagram, TWINT, Visa ...) from @sanibase/brand-icons.
 *
 * `color` is the official mark and is never recoloured. `mono` is one shape in
 * `currentColor`, so it takes the text colour around it. Each brand's usage
 * rule travels with the data (`brandIcons[slug].usage`): read it before
 * placing a logo.
 */
import { computed, useId } from 'vue';
import {
  brandIconBox,
  type BrandIconVariant,
  type BrandSlugOrAlias,
  getBrandIcon,
  scopeSvgIds,
} from '@sanibase/brand-icons';

export interface SdBrandIconProps {
  /**
   * Brand slug (`instagram`, `googlepay`) or alias (`twitter` shows X).
   * An unknown key, or a brand without an icon (Apple Maps), renders nothing.
   */
  // `string & {}` keeps editor completion for the known slugs while still
  // accepting a platform key read from stored data.
  brand: BrandSlugOrAlias | (string & {});
  /** `color` (official mark, the default) or `mono` (currentColor). */
  variant?: BrandIconVariant;
  /**
   * Height in px (number) or a CSS length. Width follows the mark's aspect
   * ratio, so wide marks (TWINT, Google Pay) keep their proportions.
   */
  size?: number | string;
  /**
   * Accessible label. Defaults to the brand's name. Pass `''` when visible
   * text next to the icon already names the brand: the icon is then hidden
   * from assistive technology.
   */
  title?: string;
}

const props = withDefaults(defineProps<SdBrandIconProps>(), {
  variant: 'color',
  size: 20,
  title: undefined,
});

const DEFAULT_SIZE = 20;

const icon = computed(() => getBrandIcon(props.brand, props.variant));

const box = computed(() => {
  if (!icon.value) return undefined;
  try {
    return brandIconBox(icon.value.viewBox, props.size);
  } catch {
    // A malformed size must not take the page down; draw at the default.
    return brandIconBox(icon.value.viewBox, DEFAULT_SIZE);
  }
});

const label = computed(() => props.title ?? icon.value?.name ?? '');

// Two copies of a mark on one page must not share gradient / clip-path ids:
// a hidden first copy would strip the second of its gradient.
const uid = useId();
const body = computed(() => {
  if (!icon.value) return '';
  return icon.value.body.includes('id="') ? scopeSvgIds(icon.value.body, `sdbi-${uid}`) : icon.value.body;
});

// The template sets the mark with v-html. That markup is a constant from
// @sanibase/brand-icons, looked up by key and checked when it was generated
// (no scripts, event handlers or external references). Nothing from props
// reaches it: the label goes into an attribute, which Vue escapes, and an
// unknown brand renders nothing. (No comment in the template: it would make
// the root a fragment in dev and SSR.)
/* eslint-disable vue/no-v-html -- constant, key-looked-up markup, see above */
</script>

<template>
  <svg
    v-if="icon && box"
    xmlns="http://www.w3.org/2000/svg"
    class="sd-brand-icon"
    :viewBox="icon.viewBox"
    :style="{ width: box.width, height: box.height, flexShrink: 0 }"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
    :focusable="label ? undefined : 'false'"
    :data-brand="icon.slug"
    :data-variant="icon.variant"
    v-html="body"
  />
</template>
