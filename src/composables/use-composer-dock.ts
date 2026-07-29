import { computed, type ComputedRef, ref, type Ref } from 'vue';
import type { ComposerState, ComposerWindow, OpenComposerOptions } from '../components/composer/types';

// ---------------------------------------------------------------------------
// Composer dock — the store.
//
// Module scope, deliberately, exactly like `useToast`. A composer has to
// survive a pillar change ("switching to Kalender to check a date does not
// kill the draft", SaniMail UX §6), and anything held inside a page component
// dies with its route. State that lives here is outside the route tree
// entirely, so navigation cannot reach it.
//
// `SdComposerDock` reads this store rather than taking a `composers` prop for
// the same reason: a prop-driven dock invites the host to hold the drafts in
// the page it navigated away from, which is the bug this component exists to
// prevent.
// ---------------------------------------------------------------------------

const composers: Ref<ComposerWindow[]> = ref([]);
const activeId: Ref<string | null> = ref(null);

/** Monotonic, so recency is a plain number comparison in the layout. */
let clock = 0;
let nextId = 0;

function stamp(): number {
  clock += 1;
  return clock;
}

function find(id: string): ComposerWindow | undefined {
  return composers.value.find((c) => c.id === id);
}

export interface UseComposerDock {
  /** Open windows, in the order they were opened. */
  composers: Ref<ComposerWindow[]>;
  /** The window that last had focus, or null. */
  activeId: Ref<string | null>;
  count: ComputedRef<number>;
  /** Opening an id that is already open re-focuses and expands it instead. */
  open: (options?: OpenComposerOptions) => string;
  close: (id: string) => void;
  closeAll: () => void;
  /** Mark as most recent. Does not change the window's state. */
  focus: (id: string) => void;
  setState: (id: string, state: ComposerState) => void;
  collapse: (id: string) => void;
  expand: (id: string) => void;
  maximize: (id: string) => void;
  toggleCollapse: (id: string) => void;
  update: (id: string, patch: Partial<Omit<ComposerWindow, 'id'>>) => void;
  get: (id: string) => ComposerWindow | undefined;
}

export function useComposerDock(): UseComposerDock {
  function open(options: OpenComposerOptions = {}): string {
    const existing = options.id ? find(options.id) : undefined;
    if (existing) {
      // Re-opening a draft that is already in the dock brings it forward
      // rather than duplicating it — two windows onto one draft is a way to
      // lose half of it.
      existing.touchedAt = stamp();
      if (existing.state === 'collapsed') existing.state = 'normal';
      if (options.title !== undefined) existing.title = options.title;
      if (options.data !== undefined) existing.data = options.data;
      activeId.value = existing.id;
      return existing.id;
    }

    nextId += 1;
    const id = options.id ?? `composer-${nextId}`;
    composers.value.push({
      id,
      title: options.title ?? '',
      state: options.state ?? 'normal',
      touchedAt: stamp(),
      confirmClose: options.confirmClose,
      data: options.data,
    });
    activeId.value = id;
    return id;
  }

  function close(id: string): void {
    composers.value = composers.value.filter((c) => c.id !== id);
    if (activeId.value === id) {
      // Hand the dock back to the most recent survivor, so focus and the
      // expanded budget both have somewhere sensible to go.
      const next = [...composers.value].sort((a, b) => b.touchedAt - a.touchedAt)[0];
      activeId.value = next?.id ?? null;
    }
  }

  function closeAll(): void {
    composers.value = [];
    activeId.value = null;
  }

  function focus(id: string): void {
    const c = find(id);
    if (!c) return;
    c.touchedAt = stamp();
    activeId.value = id;
  }

  function setState(id: string, state: ComposerState): void {
    const c = find(id);
    if (!c) return;
    if (state === 'maximized') {
      // Only one maximised window; the others fall back to normal rather than
      // fighting over the same space.
      for (const other of composers.value) {
        if (other.id !== id && other.state === 'maximized') other.state = 'normal';
      }
    }
    c.state = state;
    c.touchedAt = stamp();
    activeId.value = id;
  }

  const collapse = (id: string) => setState(id, 'collapsed');
  const expand = (id: string) => setState(id, 'normal');
  const maximize = (id: string) => setState(id, 'maximized');

  function toggleCollapse(id: string): void {
    const c = find(id);
    if (!c) return;
    setState(id, c.state === 'collapsed' ? 'normal' : 'collapsed');
  }

  function update(id: string, patch: Partial<Omit<ComposerWindow, 'id'>>): void {
    const c = find(id);
    if (!c) return;
    Object.assign(c, patch);
  }

  return {
    composers,
    activeId,
    count: computed(() => composers.value.length),
    open,
    close,
    closeAll,
    focus,
    setState,
    collapse,
    expand,
    maximize,
    toggleCollapse,
    update,
    get: find,
  };
}
