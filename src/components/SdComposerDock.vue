<script setup lang="ts">
/**
 * SdComposerDock — non-modal composer windows docked to the bottom right.
 *
 * This is deliberately not `SdModal`. A modal scrims the page and traps
 * focus, which is the exact opposite of "park a draft while you go and look
 * something up" (SaniMail UX §6). Everything behind the dock stays readable,
 * operable and focusable.
 *
 * Accessibility, which is the part that is easy to get wrong here:
 *
 *   - No `role="dialog"`. `dialog` implies modality, and assistive tech
 *     treats it as such. The dock is a `region` landmark named "Entwürfe" and
 *     each window inside it is a `group` named by its own title, so a screen
 *     reader user can find the dock by landmark and tell the drafts apart.
 *   - Focus is never trapped. Tab walks out of a composer and on into the
 *     page, as it must for a non-modal surface.
 *   - `F6` (and `Shift`+`F6`) cycles focus between the page and each open
 *     composer. That is the platform convention for reaching a non-modal
 *     pane, and without it a keyboard user who tabs past the dock has no way
 *     back short of tabbing through the whole document.
 *   - Opening, collapsing and closing are announced on a polite live region,
 *     because nothing else tells a screen reader user that a window appeared
 *     in the corner.
 *   - `Escape` collapses and never closes, so a stray keypress cannot lose a
 *     draft.
 *
 * The dock reads `useComposerDock()` rather than taking the windows as a
 * prop. Drafts have to survive a pillar change, and state held in the page
 * the user navigated away from does not; the store lives in module scope,
 * outside the route tree. Mount this component once in the app shell,
 * alongside the router view rather than inside it.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { PhArrowsIn, PhArrowsOut, PhCaretUp, PhMinus, PhPencilSimple, PhX } from '@phosphor-icons/vue';
import { DEFAULT_DOCK_GEOMETRY, layoutComposers } from './composer/dock-layout';
import type { ComposerPlacement, ComposerState, ComposerWindow, DockGeometry } from './composer/types';
import { useComposerDock } from '../composables/use-composer-dock';

export interface SdComposerDockProps {
  /** Width of a normal composer, px. */
  width?: number;
  /** Width of a collapsed title bar, px. */
  collapsedWidth?: number;
  /** Margin from the right edge, px. */
  edge?: number;
  /** Horizontal gap between windows, px. */
  gap?: number;
  /** Total height of a normal composer, title bar included, px. */
  height?: number;
  /** Title-bar height, which is also the collapsed height, px. */
  headerHeight?: number;
  /** How many composers may be expanded at once. */
  maxOpen?: number;
  /** Below this viewport width a composer goes full screen. */
  phoneBreakpoint?: number;
  /** Upper bound on a maximised composer, px. */
  maxWidth?: number;
  /** Space kept clear above a maximised composer, px. */
  topGap?: number;
  /** Smallest step between overlapping title bars, px. */
  collapsedMinStep?: number;
  /** Base stacking order. Above the shell, below sheets and modals. */
  zIndex?: number;
  /** Accessible name of the dock as a whole. */
  label?: string;
  /** Stand-in title for a composer that has no subject yet. */
  untitledLabel?: string;
  collapseLabel?: string;
  expandLabel?: string;
  maximizeLabel?: string;
  restoreLabel?: string;
  closeLabel?: string;
  /** Live-region announcements. `{title}` is replaced with the window title. */
  openedAnnouncement?: string;
  collapsedAnnouncement?: string;
  expandedAnnouncement?: string;
  closedAnnouncement?: string;
  /**
   * Teleport target. Body by default, so a composer is never clipped by a
   * page's `overflow` or trapped in its stacking context. `false` renders in
   * place, which is what the gallery uses to keep the demo on the page.
   */
  teleportTo?: string | false;
  /**
   * Move focus into a composer when it opens. The dock focuses the first
   * `[data-autofocus]` element inside the window if there is one, otherwise
   * the window itself.
   */
  autofocus?: boolean;
}

const props = withDefaults(defineProps<SdComposerDockProps>(), {
  width: DEFAULT_DOCK_GEOMETRY.width,
  collapsedWidth: DEFAULT_DOCK_GEOMETRY.collapsedWidth,
  edge: DEFAULT_DOCK_GEOMETRY.edge,
  gap: DEFAULT_DOCK_GEOMETRY.gap,
  height: DEFAULT_DOCK_GEOMETRY.height,
  headerHeight: DEFAULT_DOCK_GEOMETRY.headerHeight,
  maxOpen: DEFAULT_DOCK_GEOMETRY.maxOpen,
  phoneBreakpoint: DEFAULT_DOCK_GEOMETRY.phoneBreakpoint,
  maxWidth: DEFAULT_DOCK_GEOMETRY.maxWidth,
  topGap: DEFAULT_DOCK_GEOMETRY.topGap,
  collapsedMinStep: DEFAULT_DOCK_GEOMETRY.collapsedMinStep,
  zIndex: DEFAULT_DOCK_GEOMETRY.zIndex,
  label: 'Entwürfe',
  untitledLabel: 'Neue Nachricht',
  collapseLabel: 'Einklappen',
  expandLabel: 'Aufklappen',
  maximizeLabel: 'Maximieren',
  restoreLabel: 'Verkleinern',
  closeLabel: 'Schliessen',
  openedAnnouncement: 'Entwurf geöffnet: {title}. Mit F6 erreichbar.',
  collapsedAnnouncement: 'Entwurf eingeklappt: {title}',
  expandedAnnouncement: 'Entwurf aufgeklappt: {title}',
  closedAnnouncement: 'Entwurf geschlossen: {title}',
  teleportTo: 'body',
  autofocus: true,
});

const emit = defineEmits<{
  /**
   * The title bar's close button was pressed. The dock has already removed
   * the window unless it carries `confirmClose`, in which case it is still
   * standing and the host owns the decision.
   */
  close: [id: string];
  stateChange: [id: string, state: ComposerState];
  focusChange: [id: string | null];
}>();

const dock = useComposerDock();

const geometry = computed<DockGeometry>(() => ({
  width: props.width,
  collapsedWidth: props.collapsedWidth,
  edge: props.edge,
  gap: props.gap,
  height: props.height,
  headerHeight: props.headerHeight,
  maxOpen: props.maxOpen,
  phoneBreakpoint: props.phoneBreakpoint,
  maxWidth: props.maxWidth,
  topGap: props.topGap,
  collapsedMinStep: props.collapsedMinStep,
  zIndex: props.zIndex,
}));

// ── Viewport ───────────────────────────────────────────────────────────────
// Client only: the dock is client state by definition, and rendering it on
// the server would hydrate against a viewport nobody measured.

const mounted = ref(false);
const viewport = ref({ width: 0, height: 0 });

function measure(): void {
  viewport.value = { width: window.innerWidth, height: window.innerHeight };
}

const placements = computed<ComposerPlacement[]>(() =>
  layoutComposers(dock.composers.value, viewport.value, geometry.value),
);

function placementOf(id: string): ComposerPlacement | undefined {
  return placements.value.find((p) => p.id === id);
}

function titleOf(c: ComposerWindow): string {
  return c.title || props.untitledLabel;
}

// ── Element registry ───────────────────────────────────────────────────────

const rootEl = ref<HTMLElement | null>(null);
const windowEls = new Map<string, HTMLElement>();

function setWindowEl(id: string, el: Element | null): void {
  if (el instanceof HTMLElement) windowEls.set(id, el);
  else windowEls.delete(id);
}

const FOCUSABLE =
  'input, textarea, select, button, [href], [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

function isVisible(el: HTMLElement): boolean {
  const check = (el as { checkVisibility?: () => boolean }).checkVisibility;
  return typeof check === 'function' ? check.call(el) : el.offsetParent !== null;
}

function focusWindow(id: string): void {
  const el = windowEls.get(id);
  if (!el) return;
  const marked = el.querySelector<HTMLElement>('[data-autofocus]');
  // `data-autofocus` is often put on a wrapper component whose root is a div,
  // so fall through to the first focusable thing inside it rather than
  // silently doing nothing. It is also hidden while the window is collapsed,
  // and focusing a `display: none` element drops focus on the floor.
  const inner =
    marked && isVisible(marked)
      ? marked.matches(FOCUSABLE)
        ? marked
        : marked.querySelector<HTMLElement>(FOCUSABLE)
      : null;
  // The window itself is only the last resort: focusing a `tabindex="-1"`
  // container shows no focus ring, so a sighted keyboard user would lose
  // track of where they are.
  const target = inner ?? el.querySelector<HTMLElement>('[data-composer-titlebar]');
  (target ?? el).focus();
}

// ── Live region ────────────────────────────────────────────────────────────

const announcement = ref('');

function announce(template: string, title: string): void {
  const text = template.replace('{title}', title);
  // Clear first, or an identical message twice running is announced once.
  announcement.value = '';
  void nextTick(() => {
    announcement.value = text;
  });
}

// ── Actions ────────────────────────────────────────────────────────────────

function setState(c: ComposerWindow, state: ComposerState): void {
  dock.setState(c.id, state);
  emit('stateChange', c.id, state);
  if (state === 'collapsed') announce(props.collapsedAnnouncement, titleOf(c));
  else announce(props.expandedAnnouncement, titleOf(c));
  void nextTick(() => focusWindow(c.id));
}

function toggleCollapse(c: ComposerWindow): void {
  const collapsed = placementOf(c.id)?.variant === 'collapsed';
  // A window that only *renders* collapsed because the dock ran out of room
  // still has its own state; expanding it bumps recency, which is what wins
  // it the space back.
  setState(c, collapsed ? 'normal' : 'collapsed');
}

function toggleMaximize(c: ComposerWindow): void {
  setState(c, c.state === 'maximized' ? 'normal' : 'maximized');
}

function requestClose(c: ComposerWindow): void {
  const title = titleOf(c);
  if (!c.confirmClose) {
    dock.close(c.id);
    announce(props.closedAnnouncement, title);
  }
  emit('close', c.id);
}

// ── Keyboard ───────────────────────────────────────────────────────────────

/**
 * Escape collapses and never closes. A draft is not something a stray
 * keypress may destroy.
 */
function onWindowKeydown(e: KeyboardEvent, c: ComposerWindow): void {
  if (e.key !== 'Escape') return;
  if (placementOf(c.id)?.variant === 'collapsed') return;
  e.preventDefault();
  e.stopPropagation();
  setState(c, 'collapsed');
}

let returnFocusEl: HTMLElement | null = null;

function insideDock(node: EventTarget | null): boolean {
  return node instanceof Node && Boolean(rootEl.value?.contains(node));
}

function returnFocusToPage(): void {
  if (returnFocusEl && document.contains(returnFocusEl)) returnFocusEl.focus();
  else (document.activeElement as HTMLElement | null)?.blur();
  returnFocusEl = null;
}

/**
 * `F6` moves focus between the page and the open composers, and wraps back
 * out to wherever it came from. This is the standard non-modal escape hatch:
 * without it the dock is reachable only by tabbing to the very end of the
 * document.
 */
function onDocumentKeydown(e: KeyboardEvent): void {
  if (e.key !== 'F6') return;
  const ids = dock.composers.value.map((c) => c.id);
  if (ids.length === 0) return;

  if (!insideDock(document.activeElement)) {
    returnFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    e.preventDefault();
    focusWindow(dock.activeId.value && ids.includes(dock.activeId.value) ? dock.activeId.value : ids[ids.length - 1]!);
    return;
  }

  const currentId = ids.find((id) => windowEls.get(id)?.contains(document.activeElement as Node));
  const at = currentId ? ids.indexOf(currentId) : -1;
  const next = at + (e.shiftKey ? -1 : 1);
  e.preventDefault();
  if (next < 0 || next >= ids.length) returnFocusToPage();
  else focusWindow(ids[next]!);
}

function onWindowFocusIn(c: ComposerWindow): void {
  if (dock.activeId.value === c.id) return;
  dock.focus(c.id);
  emit('focusChange', c.id);
}

// ── Lifecycle ──────────────────────────────────────────────────────────────

onMounted(() => {
  mounted.value = true;
  measure();
  window.addEventListener('resize', measure);
  document.addEventListener('keydown', onDocumentKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', measure);
  document.removeEventListener('keydown', onDocumentKeydown);
});

// Announce and focus a window the moment it appears.
let known = new Set<string>();
watch(
  () => dock.composers.value.map((c) => c.id).join('|'),
  () => {
    const ids = dock.composers.value.map((c) => c.id);
    const added = ids.filter((id) => !known.has(id));
    known = new Set(ids);
    const id = added[added.length - 1];
    if (!id) return;
    const c = dock.get(id);
    if (c) announce(props.openedAnnouncement, titleOf(c));
    if (props.autofocus) void nextTick(() => focusWindow(id));
  },
);

// ── Presentation ───────────────────────────────────────────────────────────

function windowStyle(p: ComposerPlacement): Record<string, string> {
  if (p.variant === 'fullscreen') {
    // 100dvh, never 100vh: with the soft keyboard up a vh-sized composer is
    // taller than the visible area and its send row lands off-screen.
    return { inset: '0', height: '100dvh', zIndex: String(p.zIndex) };
  }
  return {
    right: `${p.right}px`,
    bottom: `${p.bottom}px`,
    width: `${p.width}px`,
    height: `${p.height}px`,
    zIndex: String(p.zIndex),
  };
}
</script>

<template>
  <Teleport
    :to="teleportTo === false ? 'body' : teleportTo"
    :disabled="teleportTo === false"
  >
    <div
      v-if="mounted && dock.composers.value.length > 0"
      ref="rootEl"
      role="region"
      :aria-label="label"
      class="sd-composer-dock"
      :style="{ zIndex }"
    >
      <!-- Nothing else tells a screen reader that a window appeared in the
           corner of a page it is not otherwise reading. -->
      <p
        class="sd-composer-live"
        role="status"
        aria-live="polite"
      >
        {{ announcement }}
      </p>

      <section
        v-for="composer in dock.composers.value"
        :key="composer.id"
        :ref="(el) => setWindowEl(composer.id, el as Element | null)"
        role="group"
        :aria-labelledby="`sd-composer-title-${composer.id}`"
        tabindex="-1"
        class="sd-motion-safe fixed flex flex-col overflow-hidden bg-sd-bg border border-sd-border border-b-0 outline-none transition-[width,height,right,bottom] duration-200 ease-out"
        :class="[
          placementOf(composer.id)?.variant === 'fullscreen'
            ? 'rounded-none border-0 shadow-none'
            : 'rounded-t-[12px] shadow-[0_20px_60px_rgba(20,16,30,0.2)]',
        ]"
        :style="windowStyle(placementOf(composer.id)!)"
        :data-composer-id="composer.id"
        :data-variant="placementOf(composer.id)?.variant"
        @keydown="onWindowKeydown($event, composer)"
        @focusin="onWindowFocusIn(composer)"
      >
        <!-- Title bar -->
        <header
          class="flex-none flex items-center gap-1.5 pl-4 pr-2 text-white bg-sd-text font-heading font-semibold text-[13.5px]"
          :style="{ height: `${headerHeight}px` }"
        >
          <!-- Text only: this button must not contain interactive children. -->
          <button
            :id="`sd-composer-title-${composer.id}`"
            data-composer-titlebar
            type="button"
            class="sd-focus-ring flex-1 min-w-0 flex items-center gap-1.5 h-full text-left rounded-sm"
            :aria-expanded="placementOf(composer.id)?.variant !== 'collapsed'"
            @click="toggleCollapse(composer)"
          >
            <slot
              name="title"
              :composer="composer"
              :placement="placementOf(composer.id)!"
            >
              <PhPencilSimple
                :size="16"
                aria-hidden="true"
                class="shrink-0"
              />
              <span class="truncate">{{ titleOf(composer) }}</span>
            </slot>
          </button>

          <button
            type="button"
            class="sd-focus-ring shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-white/80 hover:bg-white/15 hover:text-white"
            :aria-label="placementOf(composer.id)?.variant === 'collapsed' ? expandLabel : collapseLabel"
            @click="toggleCollapse(composer)"
          >
            <PhCaretUp
              v-if="placementOf(composer.id)?.variant === 'collapsed'"
              :size="16"
              aria-hidden="true"
            />
            <PhMinus
              v-else
              :size="16"
              aria-hidden="true"
            />
          </button>

          <button
            v-if="placementOf(composer.id)?.variant === 'normal' || placementOf(composer.id)?.variant === 'maximized'"
            type="button"
            class="sd-focus-ring shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-white/80 hover:bg-white/15 hover:text-white"
            :aria-label="composer.state === 'maximized' ? restoreLabel : maximizeLabel"
            @click="toggleMaximize(composer)"
          >
            <PhArrowsIn
              v-if="composer.state === 'maximized'"
              :size="16"
              aria-hidden="true"
            />
            <PhArrowsOut
              v-else
              :size="16"
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            class="sd-focus-ring shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-white/80 hover:bg-white/15 hover:text-white"
            :aria-label="closeLabel"
            @click="requestClose(composer)"
          >
            <PhX
              :size="16"
              aria-hidden="true"
            />
          </button>
        </header>

        <!-- Body. The chrome, the states and the arrangement are the dock's;
             the fields are the host's. -->
        <div
          v-show="placementOf(composer.id)?.variant !== 'collapsed'"
          class="flex-1 min-h-0 flex flex-col overflow-hidden"
        >
          <slot
            :composer="composer"
            :placement="placementOf(composer.id)!"
            :close="() => requestClose(composer)"
            :collapse="() => setState(composer, 'collapsed')"
          />
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style>
/* Visually hidden, still announced. Not `sr-only`, so the live region does
   not depend on the consumer's Tailwind having generated that utility. */
.sd-composer-live {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/*
 * The dock itself is a zero-size anchor; every window inside it is fixed.
 *
 * It carries the z-index rather than relying on the windows to: `position:
 * fixed` creates a stacking context on its own, so without one here the
 * windows' z-index would be confined inside a `z-index: auto` context and any
 * `z-10` in the page (a calendar drag handle, say) would paint straight
 * through a composer.
 */
.sd-composer-dock {
  position: fixed;
  inset: auto 0 0 auto;
  width: 0;
  height: 0;
}
</style>
