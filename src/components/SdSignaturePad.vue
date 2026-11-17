<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { PhEraser } from '@phosphor-icons/vue';
import SdButton from './SdButton.vue';
import { sdCssVariables } from '../tokens/css-variables';
import {
  addPoint,
  drawSignature,
  exportPlan,
  fitTransform,
  IDENTITY_TRANSFORM,
  isSignatureEmpty,
  type SignaturePoint,
  type SignatureSize,
  type SignatureStroke,
  type SignatureTransform,
  toFrame,
} from '../utils/signature-geometry';

/**
 * A pad to sign on with a finger, a pen or the mouse. It draws and hands back
 * an image of what was drawn, nothing more: whatever the signature means (a
 * typed name next to it, a contract it belongs to) is the host's business.
 *
 * API
 * - Props: `height` (CSS px, default 180), `disabled`, `penColor` (default
 *   the `--sd-text` token), `background` of the exported image
 *   (`'transparent'` default, or `'white'` from `--sd-bg`), `ariaLabel`,
 *   `clearLabel`, `placeholder`. Texts default to English; a host passes its
 *   own words, as with every component here.
 * - Emits `change` with `{ empty }` after every finished stroke and after a
 *   clear that removed something.
 * - Exposes (template ref): `clear()`, `isEmpty()`,
 *   `toBlob(type = 'image/png', quality?)` resolving to a Blob or null, and
 *   `toDataURL(type = 'image/png', quality?)` returning a data URL or null.
 *   The image is trimmed to the ink plus a small margin, at two pixels per
 *   CSS px; null when nothing was drawn. A JPEG always gets the white
 *   background, as JPEG has no transparency.
 *
 * Behaviour
 * - Pointer Events, one pointer at a time (a second finger is ignored), with
 *   `touch-action: none` so drawing never scrolls the page.
 * - Strokes are kept as point lists, so a resize redraws them scaled rather
 *   than losing them (see utils/signature-geometry.ts), and the canvas is
 *   sized by devicePixelRatio so the line stays sharp.
 * - The canvas is an image to assistive tech (role="img" with `ariaLabel`)
 *   and takes no focus; the clear button is a real neutral-outline SdButton,
 *   46px high, disabled while the pad is empty or disabled.
 */
export type SignatureBackground = 'transparent' | 'white';

export interface SdSignaturePadChange {
  empty: boolean;
}

export interface SdSignaturePadProps {
  /** Height of the drawing area in CSS px. The width follows the container. */
  height?: number;
  disabled?: boolean;
  /** Ink colour. Defaults to the `--sd-text` token. */
  penColor?: string;
  /** Background of the exported image (the pad itself always shows the page surface). */
  background?: SignatureBackground;
  /** The pad's name for a screen reader. */
  ariaLabel?: string;
  clearLabel?: string;
  /** Light grey words on the line of an empty pad. Empty string hides them. */
  placeholder?: string;
}

/** What a template ref on SdSignaturePad can call. */
export interface SdSignaturePadExpose {
  clear(): void;
  isEmpty(): boolean;
  toBlob(type?: string, quality?: number): Promise<Blob | null>;
  toDataURL(type?: string, quality?: number): string | null;
}

const props = withDefaults(defineProps<SdSignaturePadProps>(), {
  height: 180,
  disabled: false,
  penColor: undefined,
  background: 'transparent',
  ariaLabel: 'Signature',
  clearLabel: 'Clear',
  placeholder: 'Sign here',
});

const emit = defineEmits<{ change: [value: SdSignaturePadChange] }>();

/** Image pixels per reference CSS px in an export. */
const EXPORT_SCALE = 2;

const surface = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const empty = ref(true);

// Plain, not reactive: points arrive at pointer rate and only the canvas reads them.
const strokes: SignatureStroke[] = [];
let frame: SignatureSize | null = null;
let size: SignatureSize = { width: 0, height: props.height };
let transform: SignatureTransform = { ...IDENTITY_TRANSFORM };
let active: { id: number; stroke: SignatureStroke } | null = null;
let frameRequest = 0;
let observer: ResizeObserver | null = null;

function token(name: string): string {
  const el = canvas.value;
  const live = el && typeof getComputedStyle === 'function' ? getComputedStyle(el).getPropertyValue(name).trim() : '';
  return live || sdCssVariables[name] || '';
}

const inkColor = (): string => props.penColor || token('--sd-text');

function measure(): SignatureSize {
  const el = surface.value;
  return { width: el?.clientWidth ?? 0, height: el?.clientHeight || props.height };
}

function redraw(): void {
  frameRequest = 0;
  const el = canvas.value;
  const ctx = el?.getContext('2d');
  if (!el || !ctx) return;
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size.width, size.height);
  drawSignature(ctx, strokes, transform, inkColor());
}

function scheduleDraw(): void {
  if (frameRequest) return;
  if (typeof requestAnimationFrame === 'function') frameRequest = requestAnimationFrame(redraw);
  else redraw();
}

/** Size the backing store to the box times devicePixelRatio and refit the drawing. */
function sync(): void {
  const el = canvas.value;
  if (!el) return;
  size = measure();
  const dpr = window.devicePixelRatio || 1;
  el.width = Math.max(1, Math.round(size.width * dpr));
  el.height = Math.max(1, Math.round(size.height * dpr));
  transform = frame ? fitTransform(frame, size) : { ...IDENTITY_TRANSFORM };
  redraw();
}

function local(e: PointerEvent): SignaturePoint {
  const r = canvas.value!.getBoundingClientRect();
  return toFrame({ x: e.clientX - r.left, y: e.clientY - r.top }, transform);
}

function onPointerDown(e: PointerEvent): void {
  if (props.disabled || active || !canvas.value) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  e.preventDefault();
  try {
    canvas.value.setPointerCapture?.(e.pointerId);
  } catch {
    // A synthetic or already released pointer cannot be captured; drawing still works.
  }
  if (isSignatureEmpty(strokes)) {
    strokes.length = 0;
    frame = measure();
    transform = { ...IDENTITY_TRANSFORM };
  }
  const stroke: SignatureStroke = [];
  strokes.push(stroke);
  addPoint(stroke, local(e));
  active = { id: e.pointerId, stroke };
  empty.value = false;
  scheduleDraw();
}

function onPointerMove(e: PointerEvent): void {
  if (!active || e.pointerId !== active.id) return;
  e.preventDefault();
  const coalesced = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
  let added = false;
  for (const ev of coalesced.length > 0 ? coalesced : [e]) added = addPoint(active.stroke, local(ev)) || added;
  if (added) scheduleDraw();
}

function endStroke(e?: PointerEvent): void {
  if (!active || (e && e.pointerId !== active.id)) return;
  const id = active.id;
  active = null;
  try {
    if (canvas.value?.hasPointerCapture?.(id)) canvas.value.releasePointerCapture(id);
  } catch {
    // Already released.
  }
  scheduleDraw();
  emit('change', { empty: isSignatureEmpty(strokes) });
}

function clear(): void {
  const had = !isSignatureEmpty(strokes);
  strokes.length = 0;
  active = null;
  frame = null;
  transform = { ...IDENTITY_TRANSFORM };
  empty.value = true;
  redraw();
  if (had) emit('change', { empty: true });
}

function isEmpty(): boolean {
  return isSignatureEmpty(strokes);
}

function renderImage(type: string): HTMLCanvasElement | null {
  const plan = exportPlan(strokes, { scale: EXPORT_SCALE });
  if (!plan) return null;
  const out = document.createElement('canvas');
  out.width = plan.width;
  out.height = plan.height;
  const ctx = out.getContext('2d');
  if (!ctx) return null;
  if (props.background === 'white' || type === 'image/jpeg') {
    ctx.fillStyle = token('--sd-bg');
    ctx.fillRect(0, 0, plan.width, plan.height);
  }
  drawSignature(ctx, strokes, plan.transform, inkColor());
  return out;
}

function toBlob(type = 'image/png', quality?: number): Promise<Blob | null> {
  const out = renderImage(type);
  if (!out) return Promise.resolve(null);
  return new Promise((resolve) => out.toBlob((b) => resolve(b), type, quality));
}

function toDataURL(type = 'image/png', quality?: number): string | null {
  return renderImage(type)?.toDataURL(type, quality) ?? null;
}

watch(
  () => props.disabled,
  (off) => {
    if (off) endStroke();
  },
);
watch(
  () => props.height,
  () => nextTick(sync),
);
watch(
  () => props.penColor,
  () => scheduleDraw(),
);

onMounted(() => {
  sync();
  if (typeof ResizeObserver !== 'undefined' && surface.value) {
    observer = new ResizeObserver(() => sync());
    observer.observe(surface.value);
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
  if (frameRequest && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frameRequest);
  frameRequest = 0;
});

defineExpose<SdSignaturePadExpose>({ clear, isEmpty, toBlob, toDataURL });
</script>

<template>
  <div
    class="sd-signature-pad"
    :class="{ 'sd-signature-pad-disabled': disabled }"
  >
    <div
      ref="surface"
      class="sd-signature-surface"
      :style="{ height: `${height}px` }"
    >
      <div
        v-if="empty && placeholder"
        class="sd-signature-placeholder"
        aria-hidden="true"
      >
        {{ placeholder }}
      </div>
      <canvas
        ref="canvas"
        class="sd-signature-canvas"
        role="img"
        :aria-label="ariaLabel"
        :aria-disabled="disabled ? 'true' : undefined"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="endStroke"
        @pointercancel="endStroke"
        @lostpointercapture="endStroke"
      />
    </div>
    <div class="sd-signature-actions">
      <SdButton
        variant="neutral-outline"
        size="lg"
        class="sd-signature-clear"
        :label="clearLabel"
        :disabled="disabled || empty"
        @click="clear"
      >
        <template #icon-left>
          <PhEraser
            class="h-4 w-4 shrink-0"
            aria-hidden="true"
          />
        </template>
      </SdButton>
    </div>
  </div>
</template>

<style>
/*
 * Real CSS, so the pad looks right whatever the consumer's Tailwind scans
 * (dist/ui.css carries no utility classes). Every colour reads a token with
 * its literal as the fallback.
 */
.sd-signature-surface {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--sd-bg, #ffffff);
  border: 1.5px solid var(--sd-gray, #d1d5db);
  border-radius: 12px;
}
.sd-signature-pad:not(.sd-signature-pad-disabled) .sd-signature-surface:hover {
  border-color: var(--sd-text-muted, #7e7e96);
}
.sd-signature-pad-disabled .sd-signature-surface {
  background: var(--sd-bg-alt, #fafafa);
}
.sd-signature-canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  /* The page must not scroll or zoom while a finger draws. */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  cursor: crosshair;
}
.sd-signature-pad-disabled .sd-signature-canvas {
  cursor: not-allowed;
}
/* A signature line near the bottom with the hint under it. */
.sd-signature-placeholder {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 18px;
  padding-top: 6px;
  border-top: 1.5px dashed var(--sd-gray, #d1d5db);
  color: var(--sd-text-muted, #7e7e96);
  font-size: 13px;
  line-height: 1.3;
  pointer-events: none;
  user-select: none;
}
.sd-signature-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>
