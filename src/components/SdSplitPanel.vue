<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

export type SplitRatio = '1/3' | '1/2' | '2/5' | '3/5';
export type SplitOrientation = 'horizontal' | 'vertical';

export interface SdSplitPanelProps {
  /**
   * Width ratio of the left panel. Ignored when `resizable` is on — the
   * divider position takes over.
   */
  ratio?: SplitRatio;
  /** Breakpoint below which panels stack */
  stackBelow?: 'sm' | 'md' | 'lg';
  /** Gap between panels */
  gap?: 'none' | 'sm' | 'md' | 'lg';
  /** Whether panels have borders */
  bordered?: boolean;
  /** Reverse stack order on mobile (show right panel first) */
  reverseStack?: boolean;
  /**
   * Split axis. `vertical` stacks the panels and puts the divider between
   * them — the reading-pane-at-the-bottom layout.
   */
  orientation?: SplitOrientation;
  /**
   * Draggable divider. Off by default, so a caller that only ever passed
   * `ratio` keeps the fixed-preset behaviour and the same DOM.
   */
  resizable?: boolean;
  /**
   * Size of the first panel in px, `v-model`-able. Undefined means "derive it
   * from `ratio` on first measure", which is what makes `resizable` a
   * one-prop upgrade rather than a migration.
   */
  size?: number;
  /** Lower bound for the first panel, px. */
  minSize?: number;
  /** Upper bound for the first panel, px. Also bounded by the container. */
  maxSize?: number;
  /**
   * Persist the divider position under this key in `localStorage`. Reads on
   * mount (client only, so SSR is unaffected) and writes on release.
   */
  storageKey?: string;
  /** Accessible name for the divider. */
  dividerLabel?: string;
}

const props = withDefaults(defineProps<SdSplitPanelProps>(), {
  ratio: '1/3',
  stackBelow: 'lg',
  gap: 'md',
  bordered: true,
  reverseStack: false,
  orientation: 'horizontal',
  resizable: false,
  size: undefined,
  minSize: 180,
  maxSize: undefined,
  storageKey: undefined,
  dividerLabel: 'Bereiche verkleinern oder vergrössern',
});

const emit = defineEmits<{
  'update:size': [value: number];
  /** Fired once on release, not on every pointermove. */
  resizeEnd: [value: number];
}>();

const ratioClasses: Record<SplitRatio, { left: string; right: string }> = {
  '1/3': { left: 'lg:w-1/3', right: 'lg:w-2/3' },
  '1/2': { left: 'lg:w-1/2', right: 'lg:w-1/2' },
  '2/5': { left: 'lg:w-2/5', right: 'lg:w-3/5' },
  '3/5': { left: 'lg:w-3/5', right: 'lg:w-2/5' },
};

// Override breakpoint prefix in ratio classes at render time
const breakpointRatios: Record<string, Record<SplitRatio, { left: string; right: string }>> = {
  sm: {
    '1/3': { left: 'sm:w-1/3', right: 'sm:w-2/3' },
    '1/2': { left: 'sm:w-1/2', right: 'sm:w-1/2' },
    '2/5': { left: 'sm:w-2/5', right: 'sm:w-3/5' },
    '3/5': { left: 'sm:w-3/5', right: 'sm:w-2/5' },
  },
  md: {
    '1/3': { left: 'md:w-1/3', right: 'md:w-2/3' },
    '1/2': { left: 'md:w-1/2', right: 'md:w-1/2' },
    '2/5': { left: 'md:w-2/5', right: 'md:w-3/5' },
    '3/5': { left: 'md:w-3/5', right: 'md:w-2/5' },
  },
  lg: ratioClasses,
};

const gapClasses: Record<string, string> = {
  none: 'gap-0',
  sm: 'gap-3',
  md: 'gap-5',
  lg: 'gap-8',
};

const stackBreakpoint: Record<string, string> = {
  sm: 'sm:flex-row',
  md: 'md:flex-row',
  lg: 'lg:flex-row',
};

const ratioFraction: Record<SplitRatio, number> = {
  '1/3': 1 / 3,
  '1/2': 1 / 2,
  '2/5': 2 / 5,
  '3/5': 3 / 5,
};

const panelBorder = computed(() =>
  props.bordered ? 'bg-white rounded-sd-md border border-sd-border overflow-hidden' : '',
);

// ── Resizable divider ──────────────────────────────────────────────────────

const rootEl = ref<HTMLElement | null>(null);
const internalSize = ref<number | null>(props.size ?? null);
const dragging = ref(false);

const isVertical = computed(() => props.orientation === 'vertical');

watch(() => props.size, (v) => {
  if (v !== undefined) internalSize.value = v;
});

function containerExtent(): number {
  const el = rootEl.value;
  if (!el) return 0;
  return isVertical.value ? el.clientHeight : el.clientWidth;
}

function clamp(px: number): number {
  const extent = containerExtent();
  const upper = Math.min(props.maxSize ?? Number.POSITIVE_INFINITY, Math.max(0, extent - props.minSize));
  return Math.min(Math.max(px, props.minSize), Math.max(props.minSize, upper));
}

function readStored(): number | null {
  if (!props.storageKey || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`sd-split:${props.storageKey}`);
    if (!raw) return null;
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    // Private mode, storage disabled, quota — a lost divider position is not
    // worth throwing over.
    return null;
  }
}

function writeStored(px: number) {
  if (!props.storageKey || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`sd-split:${props.storageKey}`, String(Math.round(px)));
  } catch { /* see readStored */ }
}

function commit(px: number, persist: boolean) {
  const next = clamp(px);
  internalSize.value = next;
  emit('update:size', next);
  if (persist) {
    writeStored(next);
    emit('resizeEnd', next);
  }
}

const panelSize = computed(() => internalSize.value);

const firstPanelStyle = computed(() => {
  if (!props.resizable || panelSize.value === null) return undefined;
  return isVertical.value
    ? { height: `${panelSize.value}px`, flex: '0 0 auto' }
    : { width: `${panelSize.value}px`, flex: '0 0 auto' };
});

function onPointerMove(e: PointerEvent) {
  if (!dragging.value || !rootEl.value) return;
  const rect = rootEl.value.getBoundingClientRect();
  commit(isVertical.value ? e.clientY - rect.top : e.clientX - rect.left, false);
}

function endDrag() {
  if (!dragging.value) return;
  dragging.value = false;
  document.body.style.userSelect = '';
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', endDrag);
  window.removeEventListener('pointercancel', endDrag);
  if (panelSize.value !== null) commit(panelSize.value, true);
}

function onDividerPointerDown(e: PointerEvent) {
  if (!props.resizable) return;
  e.preventDefault();
  dragging.value = true;
  // Without this a drag selects the text in both panels.
  document.body.style.userSelect = 'none';
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
}

/** Keyboard resize — a divider that only responds to a mouse is not operable. */
function onDividerKeydown(e: KeyboardEvent) {
  if (!props.resizable || panelSize.value === null) return;
  const step = e.shiftKey ? 48 : 16;
  const back = isVertical.value ? 'ArrowUp' : 'ArrowLeft';
  const fwd = isVertical.value ? 'ArrowDown' : 'ArrowRight';
  if (e.key === back) { e.preventDefault(); commit(panelSize.value - step, true); }
  else if (e.key === fwd) { e.preventDefault(); commit(panelSize.value + step, true); }
  else if (e.key === 'Home') { e.preventDefault(); commit(props.minSize, true); }
  else if (e.key === 'End') { e.preventDefault(); commit(containerExtent(), true); }
}

/** Double-click resets to the `ratio` preset — the usual escape hatch. */
function onDividerDblClick() {
  if (!props.resizable) return;
  commit(containerExtent() * ratioFraction[props.ratio], true);
}

onMounted(() => {
  if (!props.resizable) return;
  const stored = readStored();
  const initial = props.size ?? stored ?? containerExtent() * ratioFraction[props.ratio];
  // Emit, don't just set: a `v-model:size` binding must reflect the position
  // the divider actually took, including one restored from storage.
  commit(initial, false);
});

onBeforeUnmount(endDrag);
</script>

<template>
  <div
    ref="rootEl"
    class="flex flex-col w-full"
    :class="[
      isVertical ? 'h-full' : stackBreakpoint[stackBelow],
      resizable ? 'gap-0' : gapClasses[gap],
      reverseStack && !isVertical ? 'flex-col-reverse' : '',
    ]"
  >
    <!-- Left / top panel -->
    <div
      class="w-full min-w-0"
      :class="[
        resizable ? 'min-h-0' : 'shrink-0',
        !resizable && !isVertical ? (breakpointRatios[stackBelow] || ratioClasses)[ratio].left : '',
        panelBorder,
      ]"
      :style="firstPanelStyle"
    >
      <slot name="left" />
    </div>

    <!-- Divider. Only exists when `resizable`, so the non-resizable DOM is
         exactly what it was. `separator` with aria-orientation and a
         tabindex is the ARIA window-splitter pattern. -->
    <div
      v-if="resizable"
      role="separator"
      tabindex="0"
      :aria-orientation="isVertical ? 'horizontal' : 'vertical'"
      :aria-label="dividerLabel"
      :aria-valuenow="panelSize ?? undefined"
      :aria-valuemin="minSize"
      :aria-valuemax="maxSize"
      class="sd-focus-ring group relative shrink-0 touch-none"
      :class="[
        isVertical ? 'h-1.5 w-full cursor-row-resize' : 'w-1.5 self-stretch cursor-col-resize',
        dragging ? 'bg-sd-orange/40' : 'bg-transparent hover:bg-sd-orange/20',
        'transition-colors',
      ]"
      @pointerdown="onDividerPointerDown"
      @keydown="onDividerKeydown"
      @dblclick="onDividerDblClick"
    >
      <!-- Grab affordance -->
      <span
        class="absolute rounded-full bg-sd-border group-hover:bg-sd-orange transition-colors"
        :class="isVertical
          ? 'left-1/2 top-1/2 h-1 w-10 -translate-x-1/2 -translate-y-1/2'
          : 'top-1/2 left-1/2 w-1 h-10 -translate-x-1/2 -translate-y-1/2'"
      />
    </div>

    <!-- Right / bottom panel -->
    <div
      class="w-full min-w-0 flex-1"
      :class="[
        resizable ? 'min-h-0' : '',
        !resizable && !isVertical ? (breakpointRatios[stackBelow] || ratioClasses)[ratio].right : '',
        panelBorder,
      ]"
    >
      <slot name="right" />
    </div>
  </div>
</template>
