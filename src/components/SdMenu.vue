<script setup lang="ts">
import { type Component, computed, nextTick, onBeforeUnmount, ref } from 'vue';
import { PhCaretLeft, PhCheck, PhDotsThreeVertical } from '@phosphor-icons/vue';
import SdIconButton from './SdIconButton.vue';

/**
 * The more menu: a ⋮ at the end of a row that opens a short list of actions
 * (ADMIN-UI-RULES R7).
 *
 * The rule lives in the component, not in each caller:
 * - the trigger is always ⋮, grey, no outline, 32px (44px on a phone), and it
 *   needs a name ("Aktionen für Margherita");
 * - every item is an icon and words, grey;
 * - an item marked `danger` is red and always sits last, after a line, in
 *   whatever order the caller listed it;
 * - an item with `children` opens a second page (a "Verschieben nach" list),
 *   with a way back to the first.
 *
 * The list is teleported to <body> with fixed coordinates, so a row inside an
 * `overflow: hidden` card or a scrolling table cannot clip it; it opens below
 * the trigger and flips above when the window has no room underneath.
 */
export interface SdMenuItem {
  /** What `select` reports. Unique within one page of the menu. */
  key: string;
  label: string;
  icon?: Component;
  /** Muted words at the right end of the item ("alle Karten"). */
  hint?: string;
  /** A muted line under the item, e.g. why it is disabled. */
  note?: string;
  /** Red and last, after a divider. */
  danger?: boolean;
  disabled?: boolean;
  /** Hover hint for the item. */
  title?: string;
  /** An on/off item: shows a tick when true (role menuitemcheckbox). */
  checked?: boolean;
  /** An on/off item drawn as a switch; the menu stays open when it flips. */
  toggle?: boolean;
  /** Items whose group differs from the one before get a divider between them. */
  group?: string;
  /** A second page, opened by this item. */
  children?: SdMenuItem[];
  /** Keep the menu open after this item is chosen. */
  keepOpen?: boolean;
}

export interface SdMenuProps {
  items: SdMenuItem[];
  /** The trigger's name and hover hint, e.g. "Aktionen für Margherita". Required. */
  label: string;
  /** Which edge of the trigger the list lines up with. */
  align?: 'end' | 'start';
  disabled?: boolean;
  /** Name of the way back from a second page; defaults to the opening item's label. */
  backLabel?: string;
}

const props = withDefaults(defineProps<SdMenuProps>(), {
  align: 'end',
  disabled: false,
  backLabel: undefined,
});

const emit = defineEmits<{
  select: [key: string, item: SdMenuItem];
  open: [];
  close: [];
}>();

const isOpen = ref(false);
const page = ref<SdMenuItem | null>(null);
const root = ref<HTMLElement | null>(null);
const list = ref<HTMLElement | null>(null);
const pos = ref<{ top: number; left: number }>({ top: 0, left: 0 });

const MENU_WIDTH = 240;
const EDGE = 8;

interface Row {
  item: SdMenuItem;
  divider: boolean;
}

/** The current page in drawing order: plain items as given, danger items last. */
const rows = computed<Row[]>(() => {
  const source = page.value?.children ?? props.items;
  const plain = source.filter((i) => !i.danger);
  const danger = source.filter((i) => i.danger);
  const out: Row[] = [];
  plain.forEach((item, idx) => {
    const prev = plain[idx - 1];
    out.push({ item, divider: idx > 0 && (prev?.group ?? '') !== (item.group ?? '') });
  });
  danger.forEach((item, idx) => {
    out.push({ item, divider: idx === 0 && plain.length > 0 });
  });
  return out;
});

function trigger(): HTMLElement | null {
  return root.value?.querySelector<HTMLElement>('button, a') ?? null;
}

function place(): void {
  const el = trigger();
  if (!el) return;
  const r = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(MENU_WIDTH, vw - EDGE * 2);
  let left = props.align === 'end' ? r.right - width : r.left;
  left = Math.max(EDGE, Math.min(left, vw - width - EDGE));
  const h = list.value?.offsetHeight ?? 0;
  let top = r.bottom + 4;
  if (h && top + h > vh - EDGE && r.top - h - 4 >= EDGE) top = r.top - h - 4;
  pos.value = { top, left };
}

function focusable(): HTMLElement[] {
  return Array.from(list.value?.querySelectorAll<HTMLElement>('[data-sd-menu-item]:not([disabled])') ?? []);
}

async function focusFirst(): Promise<void> {
  await nextTick();
  place();
  focusable()[0]?.focus();
}

function openMenu(): void {
  if (props.disabled || isOpen.value) return;
  isOpen.value = true;
  page.value = null;
  emit('open');
  document.addEventListener('pointerdown', onDocDown, true);
  window.addEventListener('scroll', onViewportChange, true);
  window.addEventListener('resize', onViewportChange);
  void focusFirst();
}

function close(refocus = false): void {
  if (!isOpen.value) return;
  isOpen.value = false;
  page.value = null;
  emit('close');
  document.removeEventListener('pointerdown', onDocDown, true);
  window.removeEventListener('scroll', onViewportChange, true);
  window.removeEventListener('resize', onViewportChange);
  if (refocus) trigger()?.focus();
}

function toggleMenu(): void {
  if (isOpen.value) close();
  else openMenu();
}

function choose(item: SdMenuItem): void {
  if (item.disabled) return;
  if (item.children && item.children.length) {
    page.value = item;
    void focusFirst();
    return;
  }
  emit('select', item.key, item);
  if (!item.toggle && !item.keepOpen) close(true);
}

function back(): void {
  page.value = null;
  void focusFirst();
}

function onDocDown(e: Event): void {
  const target = e.target as Node;
  if (list.value?.contains(target) || root.value?.contains(target)) return;
  close();
}

/** The list follows its trigger when the page scrolls or the window changes size. */
function onViewportChange(e: Event): void {
  if (e.type === 'scroll' && list.value && e.target instanceof Node && list.value.contains(e.target)) return;
  place();
}

function onKey(e: KeyboardEvent): void {
  const all = focusable();
  const at = all.indexOf(document.activeElement as HTMLElement);
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    close(true);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    all[(at + 1) % all.length]?.focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    all[(at - 1 + all.length) % all.length]?.focus();
  } else if (e.key === 'Home') {
    e.preventDefault();
    all[0]?.focus();
  } else if (e.key === 'End') {
    e.preventDefault();
    all[all.length - 1]?.focus();
  } else if (e.key === 'Tab') {
    close();
  }
}

function roleOf(item: SdMenuItem): string {
  if (item.toggle) return 'menuitemcheckbox';
  if (item.checked !== undefined) return 'menuitemcheckbox';
  return 'menuitem';
}

onBeforeUnmount(() => close());

defineExpose({ open: openMenu, close });
</script>

<template>
  <span
    ref="root"
    class="sd-menu inline-flex"
    @click.stop
  >
    <SdIconButton
      :label="label"
      :disabled="disabled"
      aria-haspopup="menu"
      :aria-expanded="isOpen ? 'true' : 'false'"
      @click="toggleMenu"
    >
      <PhDotsThreeVertical />
    </SdIconButton>
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="list"
        role="menu"
        :aria-label="label"
        class="sd-menu-list fixed z-[300] rounded-[10px] border border-sd-border bg-white p-1.5 shadow-[0_10px_30px_rgba(26,26,46,0.14)]"
        :style="{ top: `${pos.top}px`, left: `${pos.left}px`, width: `min(${MENU_WIDTH}px, calc(100vw - ${EDGE * 2}px))` }"
        @keydown="onKey"
        @click.stop
      >
        <template v-if="page">
          <button
            type="button"
            data-sd-menu-item
            class="sd-menu-item flex w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm text-sd-text-muted hover:bg-sd-bg-alt focus-visible:bg-sd-bg-alt focus-visible:outline-none"
            @click="back"
          >
            <PhCaretLeft class="sd-menu-icon shrink-0" />
            <span class="flex-1 truncate">{{ backLabel ?? page.label }}</span>
          </button>
          <hr class="my-1 border-sd-border">
        </template>
        <div :class="page ? 'max-h-64 overflow-y-auto' : ''">
          <template
            v-for="row in rows"
            :key="row.item.key"
          >
            <hr
              v-if="row.divider"
              class="my-1 border-sd-border"
            >
            <button
              type="button"
              data-sd-menu-item
              :role="roleOf(row.item)"
              :aria-checked="row.item.toggle || row.item.checked !== undefined ? Boolean(row.item.checked) : undefined"
              :aria-haspopup="row.item.children?.length ? 'menu' : undefined"
              :disabled="row.item.disabled"
              :title="row.item.title"
              class="sd-menu-item flex w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm hover:bg-sd-bg-alt focus-visible:bg-sd-bg-alt focus-visible:outline-none disabled:cursor-not-allowed disabled:hover:bg-transparent"
              :class="row.item.disabled ? 'text-sd-text-muted' : row.item.danger ? 'text-sd-error' : 'text-sd-text'"
              @click="choose(row.item)"
            >
              <component
                :is="row.item.icon"
                v-if="row.item.icon"
                class="sd-menu-icon shrink-0"
              />
              <span class="min-w-0 flex-1">
                <span class="block truncate">{{ row.item.label }}</span>
                <span
                  v-if="row.item.note"
                  class="block whitespace-normal text-xs text-sd-text-muted"
                >{{ row.item.note }}</span>
              </span>
              <span
                v-if="row.item.hint"
                class="shrink-0 text-xs text-sd-text-muted"
              >{{ row.item.hint }}</span>
              <span
                v-if="row.item.toggle"
                aria-hidden="true"
                class="sd-menu-switch relative h-[18px] w-8 shrink-0 rounded-full transition-colors"
                :class="row.item.checked ? (row.item.disabled ? 'bg-sd-text-muted' : 'bg-sd-orange') : 'bg-sd-gray'"
              >
                <span
                  class="absolute left-[3px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform"
                  :class="row.item.checked ? 'translate-x-[14px]' : 'translate-x-0'"
                />
              </span>
              <PhCheck
                v-else-if="row.item.checked"
                class="sd-menu-icon shrink-0 text-sd-purple"
              />
            </button>
          </template>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<style>
/* Real CSS so it ships in dist/ui.css: the list is teleported out of every consumer's scope. */
.sd-menu-item {
  min-height: 38px;
  padding-top: 6px;
  padding-bottom: 6px;
}
.sd-menu-icon {
  width: 16px;
  height: 16px;
}
@media (max-width: 639.98px) {
  .sd-menu-item {
    min-height: 44px;
  }
  .sd-menu-icon {
    width: 20px;
    height: 20px;
  }
}
</style>
