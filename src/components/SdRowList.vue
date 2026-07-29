<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import SdEmptyState from './SdEmptyState.vue';
import { computeVirtualWindow, rowPitch } from '../utils/virtual-window';

export type RowListSize = 'sm' | 'md' | 'touch';
/**
 * `plain` — the markup this component has always emitted: nested divs, no ARIA.
 * `grid`  — `role="grid"` with `row`/`gridcell` and a roving tabindex.
 *
 * A message list must be a grid, not a listbox: an `option` may not contain
 * interactive descendants, and these rows carry a star, a checkbox and hover
 * actions that a screen-reader user would otherwise never reach (UX §14).
 * It is opt-in because turning it on changes how every existing list is
 * announced.
 */
export type RowListSemantics = 'plain' | 'grid';

export interface SdRowListProps {
  /** Array of items to render */
  items: unknown[];
  /** Size variant */
  size?: RowListSize;
  /** Show loading skeleton */
  loading?: boolean;
  /** Number of skeleton rows when loading */
  skeletonCount?: number;
  /** Empty state title */
  emptyTitle?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Gap between rows in px */
  gap?: number;
  /** Whether rows are hoverable */
  hoverable?: boolean;
  /**
   * Render only the rows in view.
   *
   * Off by default, so every existing list keeps its exact markup. On, the
   * list mounts a constant number of rows regardless of `items.length` — the
   * difference between a 40 000-message inbox that scrolls like a native app
   * and one that locks the tab for ten seconds on mount.
   *
   * Requires a bounded height: pass `height`, or give the component a parent
   * with a definite height and leave `height` at its `100%` default.
   */
  virtualized?: boolean;
  /**
   * Row height in px. Rows must be uniform for the windowing arithmetic —
   * 72 comfortable / 56 compact are the two densities in the UX spec.
   */
  itemHeight?: number;
  /** Extra rows rendered above and below the viewport, to hide fast scrolls. */
  overscan?: number;
  /** Scroll viewport height. Any CSS length; a number is treated as px. */
  height?: string | number;
  /**
   * Stable row key. Index keys are wrong for a list that grows at the top
   * (new mail), because every row's identity shifts by one.
   */
  itemKey?: (item: unknown, index: number) => string | number;
  /** Accessibility semantics. See `RowListSemantics`. */
  semantics?: RowListSemantics;
  /** Accessible name, required in practice when `semantics === 'grid'`. */
  ariaLabel?: string;
  /**
   * Emit `loadMore` when the scroll position comes within this many px of the
   * bottom. 0 disables it.
   */
  loadMoreThreshold?: number;
  /** Suppresses further `loadMore` emits — set while a page is in flight. */
  loadingMore?: boolean;
}

const props = withDefaults(defineProps<SdRowListProps>(), {
  size: 'md',
  loading: false,
  skeletonCount: 4,
  emptyTitle: 'No items',
  emptyDescription: 'Nothing to show here yet.',
  gap: 8,
  hoverable: true,
  virtualized: false,
  itemHeight: 72,
  overscan: 6,
  itemKey: undefined,
  height: '100%',
  semantics: 'plain',
  ariaLabel: undefined,
  loadMoreThreshold: 0,
  loadingMore: false,
});

const emit = defineEmits<{
  'row-click': [item: unknown, index: number];
  /** Space on a focused row. The host owns the selection model. */
  'row-select': [item: unknown, index: number];
  /** Scrolled to within `loadMoreThreshold` of the bottom. */
  loadMore: [];
}>();

const sizeClasses: Record<RowListSize, string> = {
  sm: 'p-3 gap-2.5',
  md: 'p-4 gap-3',
  touch: 'p-5 gap-4',
};

const skeletonAvatarSize: Record<RowListSize, string> = {
  sm: 'w-9 h-9',
  md: 'w-10 h-10',
  touch: 'w-14 h-14',
};

const skeletonTextHeight: Record<RowListSize, string> = {
  sm: 'h-3',
  md: 'h-3.5',
  touch: 'h-4',
};

function keyFor(item: unknown, index: number): string | number {
  return props.itemKey ? props.itemKey(item, index) : index;
}

// ── Virtual window ─────────────────────────────────────────────────────────

const scrollEl = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const viewportHeight = ref(0);

/** Distance from one row's top to the next. */
const pitch = computed(() => rowPitch(props.itemHeight, props.gap));

const window_ = computed(() =>
  computeVirtualWindow({
    scrollTop: scrollTop.value,
    viewportHeight: viewportHeight.value,
    itemHeight: props.itemHeight,
    gap: props.gap,
    count: props.items.length,
    overscan: props.overscan,
  }),
);

const totalHeight = computed(() => window_.value.totalHeight);
const startIndex = computed(() => (props.virtualized ? window_.value.startIndex : 0));
const endIndex = computed(() => (props.virtualized ? window_.value.endIndex : props.items.length));
const offsetY = computed(() => (props.virtualized ? window_.value.offsetY : 0));

/** `[item, absoluteIndex]` pairs for the rendered window. */
const windowItems = computed(() =>
  props.items.slice(startIndex.value, endIndex.value).map((item, i) => ({
    item,
    index: startIndex.value + i,
  })),
);

const viewportStyle = computed(() => {
  if (!props.virtualized) return undefined;
  const h = typeof props.height === 'number' ? `${props.height}px` : props.height;
  return { height: h };
});

function onScroll() {
  const el = scrollEl.value;
  if (!el) return;
  scrollTop.value = el.scrollTop;
  if (props.loadMoreThreshold > 0 && !props.loadingMore) {
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (remaining <= props.loadMoreThreshold) emit('loadMore');
  }
}

let ro: ResizeObserver | null = null;

onMounted(() => {
  if (!props.virtualized) return;
  const el = scrollEl.value;
  if (!el) return;
  viewportHeight.value = el.clientHeight;
  ro = new ResizeObserver(() => {
    viewportHeight.value = el.clientHeight;
  });
  ro.observe(el);
});

onBeforeUnmount(() => {
  ro?.disconnect();
  ro = null;
});

/** Bring an absolute index into view. Exposed for `j`/`k` style shortcuts. */
function scrollToIndex(index: number, position: 'start' | 'nearest' = 'nearest') {
  const el = scrollEl.value;
  if (!el) return;
  const top = index * pitch.value;
  if (position === 'start') {
    el.scrollTop = top;
  } else if (top < el.scrollTop) {
    el.scrollTop = top;
  } else if (top + props.itemHeight > el.scrollTop + el.clientHeight) {
    el.scrollTop = top + props.itemHeight - el.clientHeight;
  }
  // Mirror it immediately rather than waiting for the scroll event, which is
  // dispatched asynchronously. Without this, `focusRow` reaches nextTick
  // before the window has re-rendered and the target row does not exist yet —
  // pressing End in a 40 000 row list would silently drop focus.
  scrollTop.value = el.scrollTop;
}

// ── Roving tabindex (grid semantics) ───────────────────────────────────────

const activeIndex = ref(0);
const rowEls = ref<Record<number, HTMLElement>>({});

function setRowEl(el: Element | null, index: number) {
  // Vue calls this with null as a row leaves the window; dropping the entry
  // keeps the map the size of the window rather than of the whole list.
  if (el instanceof HTMLElement) rowEls.value[index] = el;
  else delete rowEls.value[index];
}

watch(() => props.items.length, (len) => {
  if (activeIndex.value > len - 1) activeIndex.value = Math.max(0, len - 1);
});

async function focusRow(index: number) {
  const clamped = Math.min(props.items.length - 1, Math.max(0, index));
  activeIndex.value = clamped;
  scrollToIndex(clamped);
  await nextTick();
  rowEls.value[clamped]?.focus();
}

function onRowKeydown(e: KeyboardEvent, item: unknown, index: number) {
  if (props.semantics !== 'grid') return;
  const page = Math.max(1, Math.floor(viewportHeight.value / pitch.value) - 1);
  switch (e.key) {
    case 'ArrowDown': e.preventDefault(); void focusRow(index + 1); break;
    case 'ArrowUp': e.preventDefault(); void focusRow(index - 1); break;
    case 'Home': e.preventDefault(); void focusRow(0); break;
    case 'End': e.preventDefault(); void focusRow(props.items.length - 1); break;
    case 'PageDown': e.preventDefault(); void focusRow(index + page); break;
    case 'PageUp': e.preventDefault(); void focusRow(index - page); break;
    case 'Enter': e.preventDefault(); emit('row-click', item, index); break;
    case ' ': e.preventDefault(); emit('row-select', item, index); break;
    case 'ArrowRight': {
      // Standard grid behaviour: step into the row's own controls (star,
      // checkbox, hover actions) without leaving the grid.
      e.preventDefault();
      const first = rowEls.value[index]?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      first?.focus();
      break;
    }
    case 'ArrowLeft': e.preventDefault(); rowEls.value[index]?.focus(); break;
    default: break;
  }
}

defineExpose({ scrollToIndex, focusRow, scrollEl });
</script>

<template>
  <div :class="virtualized ? 'min-h-0' : ''">
    <!-- Loading -->
    <div
      v-if="loading"
      class="flex flex-col"
      :style="{ gap: `${gap}px` }"
    >
      <div
        v-for="i in skeletonCount"
        :key="i"
        class="flex items-center bg-white border border-sd-border rounded-sd-md animate-pulse"
        :class="sizeClasses[size]"
      >
        <div
          class="shrink-0 rounded-sd bg-sd-bg-alt"
          :class="skeletonAvatarSize[size]"
        />
        <div class="flex-1 min-w-0 space-y-2">
          <div
            class="bg-sd-bg-alt rounded"
            :class="[skeletonTextHeight[size], 'w-2/5']"
          />
          <div class="bg-sd-bg-alt rounded h-2.5 w-1/3" />
        </div>
        <div class="shrink-0 bg-sd-bg-alt rounded w-16 h-5" />
      </div>
    </div>

    <!-- Empty -->
    <div
      v-else-if="items.length === 0"
      class="bg-white border border-sd-border rounded-sd-md"
    >
      <SdEmptyState
        :title="emptyTitle"
        :description="emptyDescription"
      >
        <template
          v-if="$slots['empty-icon']"
          #icon
        >
          <slot name="empty-icon" />
        </template>
        <template
          v-if="$slots['empty-action']"
          #action
        >
          <slot name="empty-action" />
        </template>
      </SdEmptyState>
    </div>

    <!-- Rows.
         Virtualised and plain paths share one row template; the only
         difference is the scroll viewport and the spacer that keeps the
         scrollbar honest about how long the list really is. -->
    <div
      v-else
      ref="scrollEl"
      :class="virtualized ? 'overflow-y-auto' : ''"
      :style="viewportStyle"
      @scroll="virtualized && onScroll()"
    >
      <div
        :role="semantics === 'grid' ? 'grid' : undefined"
        :aria-label="semantics === 'grid' ? ariaLabel : undefined"
        :aria-rowcount="semantics === 'grid' ? items.length : undefined"
        :style="virtualized ? { height: `${totalHeight}px`, position: 'relative' } : undefined"
      >
        <div
          class="flex flex-col"
          :style="virtualized
            ? { gap: `${gap}px`, position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${offsetY}px)` }
            : { gap: `${gap}px` }"
        >
          <div
            v-for="entry in windowItems"
            :key="keyFor(entry.item, entry.index)"
            :ref="(el) => setRowEl(el as Element | null, entry.index)"
            class="flex items-center bg-white border border-sd-border rounded-sd-md transition-all duration-150"
            :class="[
              sizeClasses[size],
              hoverable ? 'cursor-pointer hover:bg-sd-purple-subtle' : '',
              size === 'touch' ? 'active:scale-[0.99]' : '',
              semantics === 'grid' ? 'sd-focus-ring-always' : '',
            ]"
            :style="virtualized ? { height: `${itemHeight}px` } : undefined"
            :role="semantics === 'grid' ? 'row' : undefined"
            :aria-rowindex="semantics === 'grid' ? entry.index + 1 : undefined"
            :tabindex="semantics === 'grid' ? (entry.index === activeIndex ? 0 : -1) : undefined"
            @click="activeIndex = entry.index; $emit('row-click', entry.item, entry.index)"
            @keydown="onRowKeydown($event, entry.item, entry.index)"
          >
            <!-- Avatar / Leading -->
            <div
              v-if="$slots.avatar"
              class="shrink-0"
              :role="semantics === 'grid' ? 'gridcell' : undefined"
            >
              <slot
                name="avatar"
                :item="entry.item"
                :index="entry.index"
              />
            </div>

            <!-- Content -->
            <div
              class="flex-1 min-w-0"
              :role="semantics === 'grid' ? 'gridcell' : undefined"
            >
              <slot
                name="content"
                :item="entry.item"
                :index="entry.index"
              />
            </div>

            <!-- Meta / Badges -->
            <div
              v-if="$slots.meta"
              class="shrink-0"
              :role="semantics === 'grid' ? 'gridcell' : undefined"
            >
              <slot
                name="meta"
                :item="entry.item"
                :index="entry.index"
              />
            </div>

            <!-- Actions -->
            <div
              v-if="$slots.actions"
              class="shrink-0 flex items-center gap-1"
              :role="semantics === 'grid' ? 'gridcell' : undefined"
              @click.stop
            >
              <slot
                name="actions"
                :item="entry.item"
                :index="entry.index"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Boundary skeleton while the next page is in flight -->
      <div
        v-if="loadingMore"
        class="flex flex-col pt-2"
        :style="{ gap: `${gap}px` }"
      >
        <div
          v-for="i in 3"
          :key="`more-${i}`"
          class="flex items-center bg-white border border-sd-border rounded-sd-md animate-pulse"
          :class="sizeClasses[size]"
          :style="virtualized ? { height: `${itemHeight}px` } : undefined"
        >
          <div
            class="shrink-0 rounded-sd bg-sd-bg-alt"
            :class="skeletonAvatarSize[size]"
          />
          <div class="flex-1 min-w-0 space-y-2">
            <div
              class="bg-sd-bg-alt rounded"
              :class="[skeletonTextHeight[size], 'w-2/5']"
            />
            <div class="bg-sd-bg-alt rounded h-2.5 w-1/3" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
