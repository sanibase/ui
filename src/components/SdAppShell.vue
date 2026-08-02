<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { PhList, PhX } from '@phosphor-icons/vue';
import { FULL_VIEWPORT_HEIGHT, styleText } from '../utils/dynamic-viewport';

/**
 * Layout mode, derived from available space rather than device class.
 *
 * The height rule is authoritative: a phone in landscape (851×393) matches
 * both a width rule and a height rule, and the two contradict each other. A
 * short viewport gets `landscape-compact`, never `tablet` (UX §3).
 */
export type ShellLayout = 'desktop' | 'tablet' | 'phone' | 'landscape-compact';

export interface SdAppShellProps {
  /** Sidebar width in px (desktop) */
  sidebarWidth?: number;
  /** Breakpoint below which sidebar becomes overlay (px) */
  mobileBreakpoint?: number;
  /** Whether sidebar is collapsed on desktop */
  collapsed?: boolean;
  /** Collapsed sidebar width in px */
  collapsedWidth?: number;
  /** Width of the icon rail, px. Only used when the `rail` slot is filled. */
  railWidth?: number;
  /**
   * Show the `bottom-nav` slot instead of the sidebar drawer trigger while
   * `isMobile`. Off by default — the admin and kiosk shells keep the
   * hamburger they have today.
   */
  bottomNav?: boolean;
  /** Viewport width at or above which the layout is `desktop`. */
  desktopBreakpoint?: number;
  /** Viewport height below which the layout is `landscape-compact`. */
  compactHeight?: number;
  /**
   * Pad the shell by the safe-area insets. On by default: the insets are 0
   * everywhere except on a notched or gesture-bar device, where their absence
   * puts the bottom navigation under the system bar.
   */
  safeArea?: boolean;
  /** Accessible label for the mobile drawer trigger. */
  menuLabel?: string;
  /** Accessible label for the drawer close button. */
  closeLabel?: string;
}

const props = withDefaults(defineProps<SdAppShellProps>(), {
  sidebarWidth: 260,
  mobileBreakpoint: 768,
  collapsed: false,
  collapsedWidth: 64,
  railWidth: 64,
  bottomNav: false,
  desktopBreakpoint: 1280,
  compactHeight: 480,
  safeArea: true,
  menuLabel: 'Menü',
  closeLabel: 'Schliessen',
});

const emit = defineEmits<{
  'update:collapsed': [value: boolean];
  /** Fires whenever the derived layout mode changes. */
  'layout-change': [value: ShellLayout];
}>();

void emit;

const slots = defineSlots<{
  /** 64px icon rail, left of the sidebar. Absent slot, absent rail. */
  rail?: (props: { layout: ShellLayout }) => unknown;
  topbar?: (props: { isMobile: boolean; toggleSidebar: () => void; layout: ShellLayout }) => unknown;
  sidebar?: (props: { collapsed: boolean; isMobile: boolean; layout: ShellLayout }) => unknown;
  'bottom-nav'?: (props: { layout: ShellLayout }) => unknown;
  default?: (props: { layout: ShellLayout }) => unknown;
}>();

const mobileOpen = ref(false);
const isMobile = ref(false);
const viewportWidth = ref(0);
const viewportHeight = ref(0);

function checkMobile() {
  // Deliberately unchanged: `isMobile` stays a pure width test, because the
  // admin and kiosk layouts branch on it and a height rule would flip the
  // hamburger on for a short desktop window.
  isMobile.value = window.innerWidth < props.mobileBreakpoint;
  viewportWidth.value = window.innerWidth;
  viewportHeight.value = window.innerHeight;
  if (!isMobile.value) mobileOpen.value = false;
}

const layout = computed<ShellLayout>(() => {
  if (viewportHeight.value > 0 && viewportHeight.value < props.compactHeight) return 'landscape-compact';
  if (viewportWidth.value >= props.desktopBreakpoint) return 'desktop';
  if (viewportWidth.value >= props.mobileBreakpoint) return 'tablet';
  return 'phone';
});

watch(layout, (v) => emit('layout-change', v));

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
  window.addEventListener('orientationchange', checkMobile);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile);
  window.removeEventListener('orientationchange', checkMobile);
});

watch(() => mobileOpen.value, (open) => {
  if (isMobile.value) {
    document.body.style.overflow = open ? 'hidden' : '';
  }
});

function toggleMobile() {
  mobileOpen.value = !mobileOpen.value;
}

function closeMobile() {
  mobileOpen.value = false;
}

const currentSidebarWidth = ref(props.collapsed ? props.collapsedWidth : props.sidebarWidth);

watch(() => props.collapsed, (v) => {
  currentSidebarWidth.value = v ? props.collapsedWidth : props.sidebarWidth;
});

const hasRail = computed(() => Boolean(slots.rail));
const showBottomNav = computed(() => props.bottomNav && Boolean(slots['bottom-nav']) && isMobile.value);
/** With a bottom nav the drawer trigger is redundant chrome. */
const showHamburger = computed(() => isMobile.value && !showBottomNav.value && Boolean(slots.sidebar));

/**
 * `100dvh`, with a `100vh` fallback that ships with the component.
 *
 * See `utils/dynamic-viewport.ts` for why the fallback is an array here and not
 * an `h-screen` class: the class was never in this package's stylesheet, so the
 * fallback only existed for consumers whose own Tailwind happened to scan
 * `@sanibase/ui/dist`. On a desktop, and on any consumer that does scan it,
 * this renders exactly what it rendered before.
 */
const shellStyle = computed(() =>
  styleText(
    FULL_VIEWPORT_HEIGHT,
    props.safeArea && 'padding-left:env(safe-area-inset-left, 0px)',
    props.safeArea && 'padding-right:env(safe-area-inset-right, 0px)',
    props.safeArea && 'padding-top:env(safe-area-inset-top, 0px)',
  ),
);

/**
 * The phone drawer is the phone's navigation, so it gets the same treatment.
 *
 * It is `position: fixed` and was stretched with `top-0 bottom-0`, whose insets
 * resolve against the initial containing block — the *large* viewport again. On
 * a phone browser with the URL bar up, the bottom of the drawer, where a
 * sidebar's account and sign-out items sit, is behind the chrome. Sizing it by
 * dynamic viewport height instead of pinning it to `bottom` fixes that; on
 * every desktop the two are identical, and the drawer only renders below
 * `mobileBreakpoint` in the first place.
 */
const drawerStyle = computed(() =>
  styleText(
    `width:${props.sidebarWidth}px`,
    FULL_VIEWPORT_HEIGHT,
    props.safeArea && 'padding-top:env(safe-area-inset-top, 0px)',
    props.safeArea && 'padding-bottom:env(safe-area-inset-bottom, 0px)',
  ),
);

const bottomNavStyle = computed(() =>
  props.safeArea ? { paddingBottom: 'env(safe-area-inset-bottom, 0px)' } : undefined,
);

defineExpose({ layout, isMobile, openSidebar: () => { mobileOpen.value = true; }, closeSidebar: closeMobile });
</script>

<template>
  <div
    class="flex flex-col bg-sd-bg"
    :style="shellStyle"
  >
    <!-- Topbar -->
    <header class="h-14 shrink-0 bg-white border-b border-sd-border flex items-center px-4 gap-3 z-30">
      <!-- Mobile hamburger -->
      <button
        v-if="showHamburger"
        type="button"
        class="sd-focus-ring w-9 h-9 flex items-center justify-center rounded-sd-sm text-sd-text-muted hover:bg-sd-purple-subtle hover:text-sd-text transition-colors"
        :aria-label="menuLabel"
        :aria-expanded="mobileOpen"
        @click="toggleMobile"
      >
        <PhList
          :size="22"
          weight="bold"
        />
      </button>

      <slot
        name="topbar"
        :is-mobile="isMobile"
        :toggle-sidebar="toggleMobile"
        :layout="layout"
      />
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Icon rail. Rendered only when the slot is filled, so no existing
           shell grows a 64px column it never asked for. Present in every
           layout except phone portrait, where the bottom nav replaces it. -->
      <nav
        v-if="hasRail && !showBottomNav"
        class="shrink-0 bg-white border-r border-sd-border flex flex-col items-center overflow-y-auto"
        :style="{ width: `${railWidth}px` }"
      >
        <slot
          name="rail"
          :layout="layout"
        />
      </nav>

      <!-- Desktop sidebar -->
      <aside
        v-if="!isMobile"
        class="shrink-0 bg-white border-r border-sd-border overflow-y-auto transition-[width] duration-200"
        :style="{ width: `${currentSidebarWidth}px` }"
      >
        <slot
          name="sidebar"
          :collapsed="collapsed"
          :is-mobile="false"
          :layout="layout"
        />
      </aside>

      <!-- Mobile sidebar overlay -->
      <Teleport to="body">
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="isMobile && mobileOpen"
            class="fixed inset-0 z-[100] bg-black/40"
            @click="closeMobile"
          />
        </Transition>

        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="-translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-x-0"
          leave-to-class="-translate-x-full"
        >
          <aside
            v-if="isMobile && mobileOpen"
            class="fixed top-0 left-0 z-[101] bg-white shadow-[4px_0_24px_rgba(0,0,0,0.08)] overflow-y-auto"
            :style="drawerStyle"
          >
            <!-- Mobile close button -->
            <div class="flex items-center justify-end p-3">
              <button
                type="button"
                class="sd-focus-ring w-9 h-9 flex items-center justify-center rounded-sd-sm text-sd-text-muted hover:bg-sd-purple-subtle hover:text-sd-text transition-colors"
                :aria-label="closeLabel"
                @click="closeMobile"
              >
                <PhX
                  :size="20"
                  weight="bold"
                />
              </button>
            </div>
            <slot
              name="sidebar"
              :collapsed="false"
              :is-mobile="true"
              :layout="layout"
            />
          </aside>
        </Transition>
      </Teleport>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto">
        <slot :layout="layout" />
      </main>
    </div>

    <!-- Bottom navigation. Opt-in, phone-portrait only, safe-area padded so
         it does not sit under the Android gesture bar. -->
    <nav
      v-if="showBottomNav"
      class="shrink-0 bg-white border-t border-sd-border"
      :style="bottomNavStyle"
    >
      <slot
        name="bottom-nav"
        :layout="layout"
      />
    </nav>
  </div>
</template>
