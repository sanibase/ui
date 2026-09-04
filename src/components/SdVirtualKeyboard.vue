<script setup lang="ts">
/**
 * SdVirtualKeyboard — on-screen QWERTZ/QWERTY + numpad for locked-down
 * kiosk tablets where the OS virtual keyboard is unavailable.
 *
 * The keyboard tracks the currently focused <input>/<textarea> and writes
 * directly to it (.value + 'input' event) so v-model bindings update.
 * It does NOT steal focus: every key uses @pointerdown.prevent so the input
 * keeps focus through taps. To opt out per-input, set `data-vkbd="off"`.
 *
 * IMPORTANT (touch): never put @touchstart.prevent on the keyboard root —
 * preventDefault on touchstart cancels the synthesised click chain on
 * tablet, so every key (including the close X) silently dies. Per-button
 * @pointerdown.prevent gives focus retention without breaking clicks.
 *
 * Layout selection:
 *  - inputs with type=number/tel or inputmode=numeric|decimal|tel → numpad
 *  - everything else → alphabetic. Alphabetic mode is a 3-column workspace:
 *      LEFT    — 2-col grid of email/text shortcuts (@, ., -, _, , ; .com .ch)
 *      MIDDLE  — QWERTZ (de) or QWERTY (en) letters with physical-keyboard
 *                stagger so A sits between Q and W
 *      RIGHT   — 3-col numpad. Bottom-right ⏎ dismisses the keyboard so the
 *                Enter on the right edge mirrors a real keyboard's position.
 *
 * Enter behaviour: ⏎ in BOTH modes dismisses the keyboard (kiosk pattern —
 * tap the key to confirm and get out of the way). It does not submit forms
 * or insert newlines; the form's own button is still on screen for that.
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { PhArrowUp, PhBackspace } from '@phosphor-icons/vue';
import { _setVirtualKeyboardState } from '../composables/use-virtual-keyboard';

export type VkbdLayout = 'alpha' | 'numpad';
export type VkbdLocale = 'de' | 'en';

export interface SdVirtualKeyboardProps {
  /** Active locale — controls QWERTZ vs QWERTY and umlauts row. */
  locale?: VkbdLocale;
  /** Force a layout regardless of focused input. */
  forceLayout?: VkbdLayout | null;
  /** When true, ignore focusin/focusout and stay hidden. */
  suppressed?: boolean;
  /**
   * When false, focusing an input does NOT pop the keyboard — it only
   * opens via the exposed open() method (an explicit "Keyboard" button on
   * the page). Once open, focus changes retarget it as usual and the
   * normal dismissals (⏎, outside tap, blur) hide it again. Use on pages
   * that are also used with a physical keyboard or mouse (e.g. the admin
   * login), where auto-popping on every focus is intrusive.
   */
  autoShow?: boolean;
}

const props = withDefaults(defineProps<SdVirtualKeyboardProps>(), {
  locale: 'de',
  forceLayout: null,
  suppressed: false,
  autoShow: true,
});

const target = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);
const visible = ref(false);
const shift = ref(false);
const caps = ref(false);
const layoutOverride = ref<VkbdLayout | null>(null);
// Alpha-mode sub-page: letters (QWERTZ/QWERTY) or the ?123 symbols grid.
// A page within alpha — NOT a third VkbdLayout — because symbols are an
// operator choice while typing text, never something an input's type can
// ask for. Resets to letters on every (re)focus, like shift.
const alphaPage = ref<'letters' | 'symbols'>('letters');

const previewValue = ref('');
const previewCaret = ref(0);
const isPassword = ref(false);
// True when a numpad-mode input was just focused but the operator hasn't
// typed yet. While true, the preview bar shows empty so the operator
// thinks "fresh entry"; the real input value is preserved untouched.
// First digit/backspace flips this off and replaces the value cleanly.
// Tapping close (or focusing away) without typing leaves the value
// intact — so accidental focus doesn't wipe data.
const numpadFresh = ref(false);

function isEditableTarget(el: EventTarget | null): el is HTMLInputElement | HTMLTextAreaElement {
  if (!(el instanceof HTMLElement)) return false;
  if (el.dataset['vkbd'] === 'off') return false;
  if (el.closest('[data-vkbd="off"]')) return false;
  // An input that's already readonly (or has our own readonly mark) is
  // either intentionally non-editable by the page, or it's the same
  // input we just made readonly — re-entering this branch would treat
  // our own override as the original state and never restore it.
  if (el instanceof HTMLInputElement && el.readOnly && !el.hasAttribute('data-sd-vkbd-readonly-by-us')) return false;
  if (el instanceof HTMLTextAreaElement) {
    if (el.readOnly && !el.hasAttribute('data-sd-vkbd-readonly-by-us')) return false;
    return true;
  }
  if (el instanceof HTMLInputElement) {
    const t = (el.type || 'text').toLowerCase();
    return ['text', 'email', 'search', 'url', 'password', 'tel', 'number'].includes(t);
  }
  return false;
}

// No-op on Linux POS kiosk: we used to flip the input to readOnly to
// kill Android's caret + drag-handle bleed-through. The kiosk runs
// Chromium on Linux where that chrome doesn't exist, and readOnly
// suppresses the blinking caret regardless of caret-color — so the
// orange | inside the focused field never showed. The marker attr
// (data-sd-vkbd-target) still drives the global muting rules; just
// the readOnly flip is gone. Hardware-keyboard typing is fine — both
// paths land in .value + dispatch 'input', so they coexist.
function applyReadonly(_el: HTMLInputElement | HTMLTextAreaElement) {
  /* intentionally empty */
}

function clearReadonly(_el: HTMLInputElement | HTMLTextAreaElement | null) {
  /* intentionally empty */
}

function detectLayout(el: HTMLInputElement | HTMLTextAreaElement): VkbdLayout {
  if (props.forceLayout) return props.forceLayout;
  if (layoutOverride.value) return layoutOverride.value;
  if (el instanceof HTMLInputElement) {
    const t = (el.type || 'text').toLowerCase();
    if (t === 'number' || t === 'tel') return 'numpad';
  }
  const im = (el.getAttribute('inputmode') || '').toLowerCase();
  if (['numeric', 'decimal', 'tel'].includes(im)) return 'numpad';
  return 'alpha';
}

const layout = computed<VkbdLayout>(() => {
  if (props.forceLayout) return props.forceLayout;
  if (layoutOverride.value) return layoutOverride.value;
  return target.value ? detectLayout(target.value) : 'alpha';
});

const upper = computed(() => caps.value !== shift.value);

// QWERTZ (German). Home row is 11 keys so after the half-key offset A
// still ends up between Q and W. ß lives on the bottom row to match the
// physical keyboard's letter-cluster, not the number row.
const ALPHA_ROWS_DE = [
  ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'ü'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ö', 'ä'],
  ['y', 'x', 'c', 'v', 'b', 'n', 'm', 'ß'],
];

const ALPHA_ROWS_EN = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

const alphaRows = computed(() => (props.locale === 'de' ? ALPHA_ROWS_DE : ALPHA_ROWS_EN));

// ?123 page — swaps the middle letter cluster only; the left shortcut
// grid and right side-numpad stay put. Row widths mirror the letter grid.
// Coverage target: every symbol class common in passwords plus the
// CH-relevant currency signs; shift has no effect here.
const SYMBOL_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['!', '?', '*', '+', '-', '_', '=', '/', '\\', ':', ';'],
  ['#', '$', '%', '&', '(', ')', '"', "'", '@', '€'],
];

// Left-hand shortcut grid. 2 cols × 4 rows = 8 keys, ordered so the
// most-used (@, .) are at the top thumb-reach zone.
const SHORTCUT_GRID = [
  ['@', '.'],
  ['_', '-'],
  [',', ';'],
  ['.com', '.ch'],
];

function readPreviewFromTarget(el: HTMLInputElement | HTMLTextAreaElement) {
  previewValue.value = el.value;
  try {
    previewCaret.value = el.selectionStart ?? el.value.length;
  } catch {
    previewCaret.value = el.value.length;
  }
  isPassword.value = el instanceof HTMLInputElement && el.type === 'password';
}

const previewBefore = computed(() => {
  if (numpadFresh.value) return '';
  const text = isPassword.value ? '•'.repeat(previewValue.value.length) : previewValue.value;
  return text.slice(0, previewCaret.value);
});
const previewAfter = computed(() => {
  if (numpadFresh.value) return '';
  const text = isPassword.value ? '•'.repeat(previewValue.value.length) : previewValue.value;
  return text.slice(previewCaret.value);
});
const previewIsEmpty = computed(() => numpadFresh.value || !previewValue.value);

// Tag the focused input with a marker attr so a global rule can mute
// the tap highlight + selection chrome. We ALSO write caret-color +
// outline inline-with-!important: the global stylesheet rule loses to
// any utility class that sets caret-color (e.g. some Tailwind variants
// generate a higher-specificity caret rule), so an inline !important
// is the only reliable way to ensure the orange | shows in every
// flavour of input — text, tel, swiss-number/decimal alike.
function setVkbdMark(el: HTMLElement | null, on: boolean) {
  if (!el) return;
  if (on) {
    el.setAttribute('data-sd-vkbd-target', '');
    el.style.setProperty('caret-color', 'var(--sd-orange, #f97316)', 'important');
    el.style.setProperty('outline', 'none', 'important');
  } else {
    el.removeAttribute('data-sd-vkbd-target');
    el.style.removeProperty('caret-color');
    el.style.removeProperty('outline');
  }
}

function focusin(e: FocusEvent) {
  if (props.suppressed) return;
  if (!isEditableTarget(e.target)) return;
  if (target.value && target.value !== e.target) {
    setVkbdMark(target.value, false);
    clearReadonly(target.value);
  }
  target.value = e.target;
  setVkbdMark(target.value, true);
  applyReadonly(target.value);
  // autoShow=false pages keep the keyboard hidden on focus — the page's
  // explicit Keyboard button calls open(). An already-open keyboard stays
  // open across focus changes either way (retarget, don't dismiss).
  if (props.autoShow || visible.value) visible.value = true;
  shift.value = false;
  layoutOverride.value = null;
  alphaPage.value = 'letters';
  numpadFresh.value = detectLayout(e.target) === 'numpad';
  readPreviewFromTarget(e.target);
}

/**
 * Programmatic open — the explicit-button counterpart to autoShow=false.
 * Adopts the currently focused editable when no target is tracked yet, so
 * `field.focus(); kbd.open()` and a bare `kbd.open()` after focus both work.
 */
function open(): void {
  if (props.suppressed) return;
  if (!target.value && isEditableTarget(document.activeElement)) {
    target.value = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
    setVkbdMark(target.value, true);
    applyReadonly(target.value);
    numpadFresh.value = detectLayout(target.value) === 'numpad';
    readPreviewFromTarget(target.value);
  }
  if (!target.value) return;
  visible.value = true;
}

defineExpose({ open });

function focusout(e: FocusEvent) {
  const next = e.relatedTarget as HTMLElement | null;
  if (next && next.closest('[data-sd-vkbd-root]')) return;
  setTimeout(() => {
    if (document.activeElement === target.value) return;
    if (!isEditableTarget(document.activeElement)) {
      setVkbdMark(target.value, false);
      clearReadonly(target.value);
      visible.value = false;
      target.value = null;
    } else {
      setVkbdMark(target.value, false);
      clearReadonly(target.value);
      target.value = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
      setVkbdMark(target.value, true);
      applyReadonly(target.value);
      readPreviewFromTarget(target.value);
    }
  }, 0);
}

function refocus() {
  if (target.value) {
    target.value.focus();
    readPreviewFromTarget(target.value);
  }
}

function getCaret(el: HTMLInputElement | HTMLTextAreaElement): [number, number] {
  try {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    return [start, end];
  } catch {
    return [el.value.length, el.value.length];
  }
}

function setCaret(el: HTMLInputElement | HTMLTextAreaElement, pos: number) {
  try {
    el.setSelectionRange(pos, pos);
  } catch {
    /* number inputs reject this; ignore */
  }
}

function fireInput(el: HTMLInputElement | HTMLTextAreaElement) {
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function insert(text: string) {
  const el = target.value;
  if (!el) return;
  const [start, end] = getCaret(el);
  const before = el.value.slice(0, start);
  const after = el.value.slice(end);
  el.value = before + text + after;
  setCaret(el, start + text.length);
  fireInput(el);
  if (shift.value && !caps.value) shift.value = false;
}

function backspace() {
  const el = target.value;
  if (!el) return;
  const [start, end] = getCaret(el);
  if (start === end && start === 0) return;
  let newStart = start;
  if (start === end) {
    el.value = el.value.slice(0, start - 1) + el.value.slice(end);
    newStart = start - 1;
  } else {
    el.value = el.value.slice(0, start) + el.value.slice(end);
  }
  setCaret(el, newStart);
  fireInput(el);
}

function close() {
  setVkbdMark(target.value, false);
  clearReadonly(target.value);
  visible.value = false;
  numpadFresh.value = false;
  alphaPage.value = 'letters';
  target.value?.blur();
  target.value = null;
}

function clearTarget() {
  numpadFresh.value = false;
  const el = target.value;
  if (!el) return;
  el.value = '';
  setCaret(el, 0);
  fireInput(el);
  refocus();
}

// Numpad-mode helpers: ALWAYS append/pop at the end. Click position is
// ignored — staff intuitively expect digits to land at the right side
// of the field, not wherever the caret happened to be from the tap.
// `el.value += '7'` style works even on type="number" where
// setSelectionRange throws.
function appendToEnd(text: string) {
  const el = target.value;
  if (!el) return;
  el.value = el.value + text;
  fireInput(el);
}

function popFromEnd() {
  const el = target.value;
  if (!el) return;
  if (el.value.length === 0) return;
  el.value = el.value.slice(0, -1);
  fireInput(el);
}

function pressNum(k: string) {
  // First key after a numpad-mode focus replaces the existing value
  // with a fresh entry. Without this, ⌫ on a stale value would feel
  // like editing the old number, which is the opposite of the
  // "fresh entry" promise the empty preview makes.
  if (numpadFresh.value) {
    const el = target.value;
    if (el) {
      el.value = '';
      fireInput(el);
    }
    numpadFresh.value = false;
    if (k === '{bksp}') { refocus(); return; }
  }
  if (k === '{bksp}') { popFromEnd(); refocus(); return; }
  appendToEnd(k);
  refocus();
}

function pressKey(k: string) {
  if (k === '{shift}') {
    if (shift.value) {
      caps.value = !caps.value;
      shift.value = caps.value;
    } else {
      shift.value = true;
    }
    refocus();
    return;
  }
  if (k === '{bksp}') { backspace(); refocus(); return; }
  if (k === '{space}') { insert(' '); refocus(); return; }
  // Enter dismisses the keyboard in both modes — kiosk pattern. The form's
  // visible submit button still works; we don't steal that affordance.
  if (k === '{enter}' || k === '{close}') { close(); return; }
  if (k === '{layout}') {
    layoutOverride.value = layout.value === 'alpha' ? 'numpad' : 'alpha';
    refocus();
    return;
  }
  if (k === '{symbols}') { alphaPage.value = 'symbols'; refocus(); return; }
  if (k === '{abc}') { alphaPage.value = 'letters'; refocus(); return; }
  const out = k.length === 1 && upper.value ? k.toUpperCase() : k;
  insert(out);
  refocus();
}

// Tap-outside-dismisses. Buttons use `@pointerdown.prevent` everywhere
// to keep keyboard focus, which means the focusout pathway never fires
// when staff taps a non-input control next to the focused field — the
// keyboard then floats over the lower portion of payment / EOD overlays
// indefinitely. Listening at the capture phase, on a tap that lands
// outside both the keyboard root AND the currently focused editable,
// we explicitly blur the target so focusout cleans up as designed.
/**
 * Whether a tap target is a control a person meant to press, as opposed to
 * the empty space beside one. Ancestors count: the finger lands on the label
 * or icon inside the button, not on the button element itself.
 */
const INTERACTIVE_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  'summary',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="tab"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[contenteditable="true"]',
].join(',');

function isInteractiveControl(t: Node | null): boolean {
  return t instanceof Element && t.closest(INTERACTIVE_SELECTOR) !== null;
}

function dismissOnOutsideTap(e: PointerEvent) {
  if (!visible.value || !target.value) return;
  const t = e.target as Node | null;
  if (!t) return;
  const inKbd = t instanceof Element && t.closest('[data-sd-vkbd-root]');
  if (inKbd) return;
  if (target.value.contains?.(t)) return;
  // Tap on something that's neither the keyboard nor the focused input.
  // Blur to teardown the keyboard via the existing focusout flow.
  target.value.blur();
  // A tap that lands on a real control reaches it on this same gesture:
  // the keyboard closing is a side effect of the press, never a substitute
  // for it. A cancel button that needs two taps while a pad is up reads as
  // "cancel is broken" (SaniDesk POS v2, 2026-09-04), and on a step flow
  // the only thing outside the pad IS the button that walks the flow on.
  if (isInteractiveControl(t)) return;
  // Empty space is different. Sequenced dismissal: this same tap would
  // otherwise also reach a modal's backdrop @click.self handler and close
  // it on the same gesture — two stray taps and the operator has lost the
  // step. Swallow the upcoming click (synthesised from this pointerdown) at
  // the capture phase so a tap on nothing closes the keyboard only.
  // Persistent modals keep ignoring backdrop taps either way — their own
  // onBackdrop already short-circuits.
  const swallow = (ev: Event) => {
    ev.stopImmediatePropagation();
    ev.preventDefault();
    document.removeEventListener('click', swallow, true);
  };
  document.addEventListener('click', swallow, true);
  // Safety: if the synthesised click never fires (rare on touch
  // cancel), drop the listener after a beat so we don't eat a future
  // unrelated click.
  setTimeout(() => document.removeEventListener('click', swallow, true), 200);
}

// Sync our internal visibility + measured height into the singleton so
// any consumer can read it. ResizeObserver picks up layout switches
// between numpad (narrow shell) and alpha (full-width frame).
const rootEl = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

function syncVkbdState() {
  const h = visible.value ? (rootEl.value?.offsetHeight ?? 0) : 0;
  _setVirtualKeyboardState(visible.value, h);
}

// Keyboard-aware visibility helper. We want the focused input centered
// in the band between the top of the viewport and the top of the
// keyboard. Strategy in order:
//   1. scrollIntoView({block:'center'}) — if the input is in a
//      scrollable parent (modal body with overflow-y-auto), the parent
//      scrolls and we don't have to move any layer.
//   2. If after that the input's rect.bottom is still inside the
//      keyboard's vertical band, find the closest position:fixed
//      ancestor (the modal/overlay panel) and translateY(-overlap) it
//      so the input clears the keyboard exactly.
// We undo the transform when the keyboard hides so the modal returns
// to its centered resting position.
let liftedEl: HTMLElement | null = null;

function findFixedAncestor(el: Element | null): HTMLElement | null {
  let node: Element | null = el;
  while (node && node !== document.body) {
    const cs = window.getComputedStyle(node);
    if (cs.position === 'fixed') return node as HTMLElement;
    node = node.parentElement;
  }
  return null;
}

function clearLift() {
  if (liftedEl) {
    liftedEl.style.transform = '';
    liftedEl.style.transition = '';
    liftedEl.style.willChange = '';
    liftedEl = null;
  }
}

async function ensureTargetVisible() {
  if (!visible.value || !target.value) {
    clearLift();
    return;
  }
  const el = target.value;
  // Pass 1 — scroll the closest scrollable parent so the input is
  // centered in its viewport. Smooth + center keeps the eye on the
  // field rather than snapping to top/bottom.
  try {
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  } catch { /* older browsers */ el.scrollIntoView(); }

  // Wait two frames so the scroll settles before we re-measure.
  await nextTick();
  await new Promise<void>((r) => requestAnimationFrame(() => r()));

  const rect = el.getBoundingClientRect();
  const kbdH = rootEl.value?.offsetHeight ?? 0;
  const safeBottom = window.innerHeight - kbdH - 16;

  // If the input is still partially under the keyboard, lift the
  // closest fixed-position ancestor by exactly the overlap amount —
  // not more, not less — so the input centers in the safe band.
  const overlap = rect.bottom - safeBottom;
  if (overlap > 0) {
    const fixed = findFixedAncestor(el);
    if (fixed) {
      // Centre the input vertically in the safe band rather than just
      // clearing the keyboard. (rect.center after scroll vs band centre.)
      const inputCentre = rect.top + rect.height / 2;
      const bandCentre = (window.innerHeight - kbdH) / 2;
      const lift = Math.min(overlap + 16, Math.max(0, inputCentre - bandCentre));
      if (lift > 0) {
        if (liftedEl && liftedEl !== fixed) clearLift();
        liftedEl = fixed;
        fixed.style.transition = 'transform 200ms ease-out';
        fixed.style.willChange = 'transform';
        fixed.style.transform = `translateY(-${Math.round(lift)}px)`;
      }
    }
  } else {
    clearLift();
  }
}

watch(visible, async () => {
  await nextTick();
  syncVkbdState();
  ensureTargetVisible();
});
watch(layout, async () => {
  await nextTick();
  syncVkbdState();
  ensureTargetVisible();
});
watch(target, async () => {
  await nextTick();
  ensureTargetVisible();
});

onMounted(() => {
  document.addEventListener('focusin', focusin);
  document.addEventListener('focusout', focusout);
  document.addEventListener('pointerdown', dismissOnOutsideTap, true);
  resizeObserver = new ResizeObserver(syncVkbdState);
});

onUnmounted(() => {
  document.removeEventListener('focusin', focusin);
  document.removeEventListener('focusout', focusout);
  document.removeEventListener('pointerdown', dismissOnOutsideTap, true);
  resizeObserver?.disconnect();
  clearLift();
  _setVirtualKeyboardState(false, 0);
});

// Attach the observer once the root element is in the DOM. Re-runs on
// every show/hide because the v-if drops the element.
watch(rootEl, (el) => {
  if (resizeObserver) resizeObserver.disconnect();
  if (el && resizeObserver) resizeObserver.observe(el);
  syncVkbdState();
});

watch(() => props.suppressed, (v) => {
  if (v) {
    visible.value = false;
    target.value = null;
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="visible"
        ref="rootEl"
        data-sd-vkbd-root
        class="fixed bottom-0 left-0 right-0 z-[700] select-none"
        style="background: rgba(18,8,32,0.96); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); box-shadow: 0 -8px 32px rgba(0,0,0,0.5);"
      >
        <!-- Standalone numpad mode: tight shell so the topbar matches the
             numpad's width instead of stretching across the screen. -->
        <div
          v-if="layout === 'numpad'"
          class="vkbd-numpad-shell"
        >
          <!-- Topbar removed: the preview/caret is on the focused input
               itself; layout is auto-detected from input type/inputmode
               (no manual toggle); ⏎ inside the numpad and outside-tap
               both dismiss, so the X is redundant too. -->


          <!-- 4 cols × 4 rows. Right column is action stack:
               ⌫ / C / ⏎(spans rows 3-4). Bottom row: 00 / 0 / .
               All digits use pressNum → always append at end of value. -->
          <div class="vkbd-numpad-only">
            <button
              class="vkbd-key vkbd-num"
              @pointerdown.prevent
              @click="pressNum('7')"
            >
              7
            </button>
            <button
              class="vkbd-key vkbd-num"
              @pointerdown.prevent
              @click="pressNum('8')"
            >
              8
            </button>
            <button
              class="vkbd-key vkbd-num"
              @pointerdown.prevent
              @click="pressNum('9')"
            >
              9
            </button>
            <button
              class="vkbd-key vkbd-num vkbd-fn"
              @pointerdown.prevent
              @click="pressNum('{bksp}')"
            >
              <PhBackspace
                :size="22"
                weight="bold"
              />
            </button>

            <button
              class="vkbd-key vkbd-num"
              @pointerdown.prevent
              @click="pressNum('4')"
            >
              4
            </button>
            <button
              class="vkbd-key vkbd-num"
              @pointerdown.prevent
              @click="pressNum('5')"
            >
              5
            </button>
            <button
              class="vkbd-key vkbd-num"
              @pointerdown.prevent
              @click="pressNum('6')"
            >
              6
            </button>
            <button
              class="vkbd-key vkbd-num vkbd-num-clear"
              @pointerdown.prevent
              @click="clearTarget"
            >
              C
            </button>

            <button
              class="vkbd-key vkbd-num"
              @pointerdown.prevent
              @click="pressNum('1')"
            >
              1
            </button>
            <button
              class="vkbd-key vkbd-num"
              @pointerdown.prevent
              @click="pressNum('2')"
            >
              2
            </button>
            <button
              class="vkbd-key vkbd-num"
              @pointerdown.prevent
              @click="pressNum('3')"
            >
              3
            </button>
            <button
              class="vkbd-key vkbd-num vkbd-enter vkbd-num-enter-tall"
              @pointerdown.prevent
              @click="close"
            >
              ⏎
            </button>

            <button
              class="vkbd-key vkbd-num"
              @pointerdown.prevent
              @click="pressNum('00')"
            >
              00
            </button>
            <button
              class="vkbd-key vkbd-num"
              @pointerdown.prevent
              @click="pressNum('0')"
            >
              0
            </button>
            <button
              class="vkbd-key vkbd-num"
              @pointerdown.prevent
              @click="pressNum('.')"
            >
              .
            </button>
          </div>
        </div>

        <div
          v-else
          class="vkbd-frame"
        >
          <!-- Topbar removed (see numpad note above). -->


          <!-- Alpha mode: 3 columns side-by-side -->
          <div class="vkbd-3col">
            <!-- LEFT: shortcut grid (2 cols × 4 rows) -->
            <div class="vkbd-left">
              <template
                v-for="(row, ri) in SHORTCUT_GRID"
                :key="`sl-${ri}`"
              >
                <button
                  v-for="k in row"
                  :key="`s-${k}`"
                  class="vkbd-key vkbd-shortcut"
                  @pointerdown.prevent
                  @click="pressKey(k)"
                >
                  {{ k }}
                </button>
              </template>
            </div>

            <!-- MIDDLE: QWERTZ letters, or the ?123 symbols page -->
            <div
              v-if="alphaPage === 'letters'"
              class="vkbd-letters"
            >
              <div class="vkbd-row">
                <button
                  v-for="k in alphaRows[0]"
                  :key="`t-${k}`"
                  class="vkbd-key"
                  @pointerdown.prevent
                  @click="pressKey(k)"
                >
                  {{ upper ? k.toUpperCase() : k }}
                </button>
              </div>
              <div class="vkbd-row vkbd-row-home">
                <button
                  v-for="k in alphaRows[1]"
                  :key="`h-${k}`"
                  class="vkbd-key"
                  @pointerdown.prevent
                  @click="pressKey(k)"
                >
                  {{ upper ? k.toUpperCase() : k }}
                </button>
              </div>
              <div class="vkbd-row vkbd-row-bottom">
                <button
                  class="vkbd-key vkbd-fn vkbd-wide"
                  :class="{ 'vkbd-shift-on': shift && !caps, 'vkbd-caps-on': caps }"
                  @pointerdown.prevent
                  @click="pressKey('{shift}')"
                >
                  <PhArrowUp
                    :size="22"
                    weight="bold"
                  />
                </button>
                <button
                  v-for="k in alphaRows[2]"
                  :key="`b-${k}`"
                  class="vkbd-key"
                  @pointerdown.prevent
                  @click="pressKey(k)"
                >
                  {{ upper ? k.toUpperCase() : k }}
                </button>
                <button
                  class="vkbd-key vkbd-fn vkbd-wide"
                  @pointerdown.prevent
                  @click="pressKey('{bksp}')"
                >
                  <PhBackspace
                    :size="22"
                    weight="bold"
                  />
                </button>
              </div>
              <div class="vkbd-row vkbd-row-space">
                <!-- Label is symbols-only (?!*#) — digits already live on
                     the side numpad, so the usual ?123 would mislead. -->
                <button
                  class="vkbd-key vkbd-fn vkbd-wide"
                  @pointerdown.prevent
                  @click="pressKey('{symbols}')"
                >
                  ?!*#
                </button>
                <button
                  class="vkbd-key vkbd-space vkbd-space-split"
                  @pointerdown.prevent
                  @click="pressKey('{space}')"
                />
              </div>
            </div>

            <!-- ?123 symbols page: digits + the password/text symbol set.
                 Shift is meaningless here so its slot hosts the ABC return
                 key; backspace keeps its letter-page position. -->
            <div
              v-else
              class="vkbd-letters"
            >
              <div class="vkbd-row">
                <button
                  v-for="k in SYMBOL_ROWS[0]"
                  :key="`y1-${k}`"
                  class="vkbd-key"
                  @pointerdown.prevent
                  @click="pressKey(k)"
                >
                  {{ k }}
                </button>
                <!-- Backspace lives at the end of the digits row (top right),
                     mirroring a physical keyboard's number-row position. -->
                <button
                  class="vkbd-key vkbd-fn vkbd-wide"
                  @pointerdown.prevent
                  @click="pressKey('{bksp}')"
                >
                  <PhBackspace
                    :size="22"
                    weight="bold"
                  />
                </button>
              </div>
              <div class="vkbd-row vkbd-row-home">
                <button
                  v-for="k in SYMBOL_ROWS[1]"
                  :key="`y2-${k}`"
                  class="vkbd-key"
                  @pointerdown.prevent
                  @click="pressKey(k)"
                >
                  {{ k }}
                </button>
              </div>
              <div class="vkbd-row vkbd-row-bottom">
                <button
                  class="vkbd-key vkbd-fn vkbd-wide"
                  @pointerdown.prevent
                  @click="pressKey('{abc}')"
                >
                  ABC
                </button>
                <button
                  v-for="k in SYMBOL_ROWS[2]"
                  :key="`y3-${k}`"
                  class="vkbd-key"
                  @pointerdown.prevent
                  @click="pressKey(k)"
                >
                  {{ k }}
                </button>
              </div>
              <div class="vkbd-row vkbd-row-space">
                <button
                  class="vkbd-key vkbd-fn vkbd-wide"
                  @pointerdown.prevent
                  @click="pressKey('{abc}')"
                >
                  ABC
                </button>
                <button
                  class="vkbd-key vkbd-space vkbd-space-split"
                  @pointerdown.prevent
                  @click="pressKey('{space}')"
                />
              </div>
            </div>

            <!-- RIGHT: side numpad. Digits append at end (same rule as
                   standalone numpad). Enter on bottom-right closes — mirrors
                   a real keyboard's enter position. -->
            <div class="vkbd-side-numpad">
              <button
                v-for="n in ['7','8','9','4','5','6','1','2','3']"
                :key="`sn-${n}`"
                class="vkbd-key vkbd-num-side"
                @pointerdown.prevent
                @click="pressNum(n)"
              >
                {{ n }}
              </button>
              <button
                class="vkbd-key vkbd-num-side"
                @pointerdown.prevent
                @click="pressNum('0')"
              >
                0
              </button>
              <button
                class="vkbd-key vkbd-num-side"
                @pointerdown.prevent
                @click="pressNum('.')"
              >
                .
              </button>
              <button
                class="vkbd-key vkbd-num-side vkbd-enter"
                @pointerdown.prevent
                @click="close"
              >
                ⏎
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* +20% over the previous 56px. KEY_W drives the QWERTZ stagger: home row
   offset by KEY_W/2 + GAP/2 so A's center lands between Q and W above. */
.vkbd-frame {
  --vkbd-key-w: 68px;
  --vkbd-key-h: 64px;
  --vkbd-gap: 6px;
  --vkbd-section-gap: 18px;
  max-width: 1320px;
  margin: 0 auto;
  padding: 10px 12px 14px;
}

.vkbd-row {
  display: flex;
  gap: var(--vkbd-gap);
  justify-content: flex-start;
  margin-bottom: var(--vkbd-gap);
}
.vkbd-row:last-child { margin-bottom: 0; }
.vkbd-row-home {
  padding-left: calc((var(--vkbd-key-w) + var(--vkbd-gap)) / 2);
}
.vkbd-row-space {
  margin-top: 2px;
}

.vkbd-key {
  width: var(--vkbd-key-w);
  height: var(--vkbd-key-h);
  flex: 0 0 var(--vkbd-key-w);
  border-radius: 10px;
  background: rgba(255,255,255,0.10);
  color: #fff;
  font-size: 22px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255,255,255,0.04);
  transition: background-color 80ms;
  -webkit-tap-highlight-color: transparent;
  padding: 0;
}
.vkbd-key:active {
  background: rgba(255,255,255,0.22);
}
.vkbd-fn {
  background: rgba(139,90,159,0.30);
  font-size: 16px;
}
.vkbd-fn:active {
  background: rgba(139,90,159,0.55);
}
.vkbd-wide {
  width: calc(var(--vkbd-key-w) * 1.5 + var(--vkbd-gap) / 2);
  flex-basis: calc(var(--vkbd-key-w) * 1.5 + var(--vkbd-gap) / 2);
}
.vkbd-enter {
  background: rgba(245,158,11,0.85);
  color: #120820;
  font-size: 24px;
}
.vkbd-enter:active {
  background: rgba(245,158,11,1);
}
.vkbd-space {
  /* Width matches the home-row width so the spacebar sits cleanly under it. */
  width: calc(var(--vkbd-key-w) * 11 + var(--vkbd-gap) * 10);
  flex-basis: calc(var(--vkbd-key-w) * 11 + var(--vkbd-gap) * 10);
}
/* Spacebar sharing its row with the ?123/ABC toggle: shrink by exactly
   one wide key + gap so the row's right edge stays aligned. */
.vkbd-space-split {
  width: calc(var(--vkbd-key-w) * 9.5 + var(--vkbd-gap) * 9 - var(--vkbd-gap) / 2);
  flex-basis: calc(var(--vkbd-key-w) * 9.5 + var(--vkbd-gap) * 9 - var(--vkbd-gap) / 2);
}
.vkbd-shift-on {
  background: rgba(245,158,11,0.55);
  color: #120820;
}
.vkbd-caps-on {
  background: rgba(245,158,11,0.85);
  color: #120820;
}

/* 3-column workspace: left grid · letters · side numpad. */
.vkbd-3col {
  display: flex;
  align-items: flex-start;
  gap: var(--vkbd-section-gap);
  justify-content: center;
}
.vkbd-left {
  display: grid;
  grid-template-columns: 84px 84px;
  gap: var(--vkbd-gap);
  align-content: start;
}
.vkbd-shortcut {
  width: 84px;
  flex-basis: 84px;
  font-size: 16px;
  background: rgba(139,90,159,0.20);
}
.vkbd-shortcut:active {
  background: rgba(139,90,159,0.45);
}
.vkbd-letters {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.vkbd-side-numpad {
  display: grid;
  grid-template-columns: repeat(3, 76px);
  gap: var(--vkbd-gap);
  align-content: start;
}
.vkbd-num-side {
  width: 76px;
  flex-basis: 76px;
  font-size: 22px;
}

/* Standalone numpad: 4 cols × 4 rows of square 96×96 keys. Right column
   is the action stack: ⌫ row 1, C row 2, ⏎ rows 3-4 (spans 2 cells +
   the gap → tall dominant dismiss). Bottom row: 00 / 0 / .
   Shell padding is vertical-only so topbar + grid share the same
   left/right edges — the preview text and X icon land flush with the
   outermost keys instead of being inset by ~12px. */
.vkbd-numpad-shell {
  --vkbd-gap: 6px;
  --vkbd-num-size: 96px;
  width: calc(var(--vkbd-num-size) * 4 + var(--vkbd-gap) * 3);
  margin: 0 auto;
  padding: 10px 0 14px;
}
.vkbd-numpad-only {
  display: grid;
  grid-template-columns: repeat(4, var(--vkbd-num-size));
  grid-template-rows: repeat(4, var(--vkbd-num-size));
  gap: var(--vkbd-gap);
}
.vkbd-num {
  width: var(--vkbd-num-size);
  flex-basis: var(--vkbd-num-size);
  height: var(--vkbd-num-size);
  font-size: 28px;
}
/* Compound selector beats the .vkbd-num height rule above on specificity.
   Without compounding, .vkbd-num's fixed 96px height wins and the enter
   collapses back to a single cell despite spanning two grid rows. */
.vkbd-num.vkbd-num-enter-tall {
  grid-row: 3 / span 2;
  grid-column: 4;
  height: calc(var(--vkbd-num-size) * 2 + var(--vkbd-gap));
}
.vkbd-num-clear {
  background: rgba(239,68,68,0.30);
  color: #fff;
  font-size: 22px;
}
.vkbd-num-clear:active {
  background: rgba(239,68,68,0.55);
}
/* Topbar in numpad mode: sized to numpad width, ABC + X each fixed to
   one key-width so their right edges land exactly on the rightmost
   key's right edge. Preview text starts flush with key 7's left edge. */
.vkbd-topbar-narrow {
  margin-bottom: 10px;
}
.vkbd-topbar-narrow .vkbd-meta,
.vkbd-topbar-narrow .vkbd-meta-close {
  width: var(--vkbd-num-size);
  padding: 0;
  justify-content: center;
}

/* Top bar: preview + layout toggle + close X. */
.vkbd-topbar {
  display: flex;
  align-items: stretch;
  gap: var(--vkbd-gap);
  margin-bottom: 10px;
}
/* Action-only variant (preview removed — caret + outline now live on
   the focused input itself). Buttons right-align so the close X stays
   in its expected far-right position. */
.vkbd-topbar-actions {
  justify-content: flex-end;
}
.vkbd-preview {
  flex: 1;
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 10px 14px;
  min-height: 44px;
}
.vkbd-preview-text {
  flex: 1;
  color: #fff;
  font-size: 18px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: pre-wrap;
  word-break: break-all;
  overflow: hidden;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.vkbd-preview-empty {
  color: rgba(255,255,255,0.35);
  font-style: italic;
}
.vkbd-caret {
  display: inline-block;
  width: 2px;
  height: 22px;
  background: #f59e0b;
  margin: 0 1px;
  animation: vkbd-blink 1s infinite;
  vertical-align: middle;
}
@keyframes vkbd-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0.2; }
}
.vkbd-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  border-radius: 10px;
  background: rgba(139,90,159,0.20);
  color: #fff;
  font-size: 13px;
}
.vkbd-meta:active {
  background: rgba(139,90,159,0.45);
}
.vkbd-meta-close {
  background: rgba(239,68,68,0.25);
}
.vkbd-meta-close:active {
  background: rgba(239,68,68,0.55);
}
</style>

<!-- Non-scoped global block: while an input is being driven by the
     virtual keyboard we mark it visually so the operator can see at a
     glance which field the keys are landing in — orange ring outline
     + a soft orange glow + the brand-orange blinking caret. The tap-
     highlight and drag-selection are kept muted (those were Chrome-on-
     Android selection chrome bleeding through our overlay). -->
<style>
[data-sd-vkbd-target] {
  caret-color: var(--sd-orange, #f97316) !important;
  outline: none !important;
  -webkit-tap-highlight-color: transparent !important;
  /* user-select: none was here to suppress Android's drag-handle, but
     in WebKit/Chromium it ALSO suppresses the blinking caret on the
     input — which is exactly the indicator we now want visible. The
     POS kiosk runs Linux Chromium where the Android handle doesn't
     exist, so we drop it entirely. */
}
[data-sd-vkbd-target]::selection {
  background: transparent;
}
</style>
