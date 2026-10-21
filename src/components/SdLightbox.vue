<script setup lang="ts">
/**
 * SdLightbox: one picture as large as fits, in its own layer above
 * everything, including an open SdModal.
 *
 *   - "1 / 2" under the picture, previous / next on both sides (both wrap
 *     around), only when there is more than one picture.
 *   - Close: the round button, a click beside the picture, or Escape.
 *     Escape closes ONLY the lightbox: it is caught on `window` in the
 *     capture phase, before SdModal's own Escape listener on `document`
 *     ever sees it, so a lightbox opened from a dialog goes back to the
 *     dialog.
 *   - ArrowLeft / ArrowRight step through the pictures.
 *   - Focus moves to the close button on open and back to whatever had it
 *     (the thumbnail) on close.
 *
 * Product-neutral: the consumer passes the three accessible labels in its
 * own language. Layout and colours are plain CSS in this file (shipped in
 * dist/ui.css), for the reason SdModal's close control is: the layer is
 * teleported to <body>, and a rule that only exists if the consumer's
 * Tailwind scans this package is not a guarantee.
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

export interface SdLightboxImage {
  src: string;
  alt?: string;
}

export interface SdLightboxProps {
  open: boolean;
  images: SdLightboxImage[];
  /** The picture shown, 0-based. */
  index?: number;
  closeLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
}

const props = withDefaults(defineProps<SdLightboxProps>(), {
  index: 0,
  closeLabel: 'Close',
  previousLabel: 'Previous',
  nextLabel: 'Next',
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  'update:index': [value: number];
}>();

const count = computed(() => props.images.length);
const current = computed(() => {
  if (count.value === 0) return 0;
  return Math.min(Math.max(props.index, 0), count.value - 1);
});
const image = computed<SdLightboxImage | null>(() => props.images[current.value] ?? null);
const several = computed(() => count.value > 1);

const closeButton = ref<HTMLButtonElement | null>(null);
let returnFocus: HTMLElement | null = null;
let bodyOverflow: string | null = null;

function close(): void {
  emit('update:open', false);
}

function step(by: number): void {
  if (!several.value) return;
  emit('update:index', (current.value + by + count.value) % count.value);
}

function onKey(e: KeyboardEvent): void {
  if (!props.open) return;
  if (e.key === 'Escape') {
    // Before SdModal's listener on document: this Escape is ours alone.
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
    close();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    e.stopPropagation();
    step(e.key === 'ArrowLeft' ? -1 : 1);
  }
}

function attach(): void {
  window.addEventListener('keydown', onKey, true);
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  bodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  void nextTick(() => closeButton.value?.focus());
}

function detach(): void {
  window.removeEventListener('keydown', onKey, true);
  if (bodyOverflow !== null) {
    // Whatever it was before (an open SdModal keeps its own 'hidden').
    document.body.style.overflow = bodyOverflow;
    bodyOverflow = null;
  }
  const back = returnFocus;
  returnFocus = null;
  if (back && document.contains(back)) back.focus();
}

watch(
  () => props.open,
  (open, was) => {
    if (open && !was) attach();
    else if (!open && was) detach();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (props.open) detach();
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && image"
      class="sd-lightbox"
      role="dialog"
      aria-modal="true"
      :aria-label="image.alt || undefined"
      data-testid="sd-lightbox"
      @click.self="close"
    >
      <button
        ref="closeButton"
        type="button"
        class="sd-lightbox-button sd-lightbox-close"
        :aria-label="closeLabel"
        data-testid="sd-lightbox-close"
        @click="close"
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
      </button>

      <button
        v-if="several"
        type="button"
        class="sd-lightbox-button sd-lightbox-prev"
        :aria-label="previousLabel"
        data-testid="sd-lightbox-prev"
        @click="step(-1)"
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M10 3L5 8l5 5"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <img
        :key="image.src"
        class="sd-lightbox-image"
        :src="image.src"
        :alt="image.alt ?? ''"
        data-testid="sd-lightbox-image"
      >

      <button
        v-if="several"
        type="button"
        class="sd-lightbox-button sd-lightbox-next"
        :aria-label="nextLabel"
        data-testid="sd-lightbox-next"
        @click="step(1)"
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 3l5 5-5 5"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <p
        v-if="several"
        class="sd-lightbox-count"
        aria-live="polite"
        data-testid="sd-lightbox-count"
      >
        {{ current + 1 }} / {{ count }}
      </p>
    </div>
  </Teleport>
</template>

<style>
/* Plain CSS on purpose: see the comment at the top of this file. */
.sd-lightbox {
  position: fixed;
  inset: 0;
  z-index: 400; /* above SdModal (300) */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px 88px;
  background: rgba(17, 17, 24, 0.86);
}

.sd-lightbox-image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 16px 56px rgba(0, 0, 0, 0.45);
  user-select: none;
}

.sd-lightbox-button {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  cursor: pointer;
  transition: background-color 150ms;
}

.sd-lightbox-button:hover,
.sd-lightbox-button:focus-visible {
  background: rgba(255, 255, 255, 0.26);
}

.sd-lightbox-button:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.sd-lightbox-button svg {
  width: 20px;
  height: 20px;
}

.sd-lightbox-close {
  top: 16px;
  right: 16px;
}

.sd-lightbox-prev {
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.sd-lightbox-next {
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.sd-lightbox-count {
  position: absolute;
  bottom: 14px;
  left: 0;
  right: 0;
  margin: 0;
  text-align: center;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

@media (max-width: 640px) {
  .sd-lightbox {
    padding: 64px 12px;
  }

  .sd-lightbox-prev,
  .sd-lightbox-next {
    top: auto;
    bottom: 8px;
    transform: none;
  }
}
</style>
