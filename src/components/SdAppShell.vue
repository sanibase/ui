<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { PhList, PhX } from '@phosphor-icons/vue';

export interface SdAppShellProps {
  /** Sidebar width in px (desktop) */
  sidebarWidth?: number;
  /** Breakpoint below which sidebar becomes overlay (px) */
  mobileBreakpoint?: number;
  /** Whether sidebar is collapsed on desktop */
  collapsed?: boolean;
  /** Collapsed sidebar width in px */
  collapsedWidth?: number;
}

const props = withDefaults(defineProps<SdAppShellProps>(), {
  sidebarWidth: 260,
  mobileBreakpoint: 768,
  collapsed: false,
  collapsedWidth: 64,
});

const emit = defineEmits<{
  'update:collapsed': [value: boolean];
}>();

const mobileOpen = ref(false);
const isMobile = ref(false);

function checkMobile() {
  isMobile.value = window.innerWidth < props.mobileBreakpoint;
  if (!isMobile.value) mobileOpen.value = false;
}

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile);
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
</script>

<template>
  <div class="h-screen flex flex-col bg-sd-bg">
    <!-- Topbar -->
    <header class="h-14 shrink-0 bg-white border-b border-sd-border flex items-center px-4 gap-3 z-30">
      <!-- Mobile hamburger -->
      <button
        v-if="isMobile"
        type="button"
        class="w-9 h-9 flex items-center justify-center rounded-sd-sm text-sd-text-muted hover:bg-sd-purple-subtle hover:text-sd-text transition-colors"
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
      />
    </header>

    <div class="flex flex-1 overflow-hidden">
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
            class="fixed top-0 left-0 bottom-0 z-[101] bg-white shadow-[4px_0_24px_rgba(0,0,0,0.08)] overflow-y-auto"
            :style="{ width: `${sidebarWidth}px` }"
          >
            <!-- Mobile close button -->
            <div class="flex items-center justify-end p-3">
              <button
                type="button"
                class="w-9 h-9 flex items-center justify-center rounded-sd-sm text-sd-text-muted hover:bg-sd-purple-subtle hover:text-sd-text transition-colors"
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
            />
          </aside>
        </Transition>
      </Teleport>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
