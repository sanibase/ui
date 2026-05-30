<script setup lang="ts">
import { computed, ref, watch } from 'vue';

export type BottomSheetHeight = 'auto' | 'half' | 'full';

export interface SdBottomSheetProps {
  open: boolean;
  title?: string;
  height?: BottomSheetHeight;
  closable?: boolean;
  /** Applied to the teleported sheet PANEL (not the backdrop). Lets callers
   * extend the sheet into contexts (like customer tenant themes) that live
   * outside the normal DOM subtree — Teleport-to-body breaks parent CSS
   * scopes. NB: must not be applied to the backdrop, because theme shell
   * classes like `customer-shell` set an opaque base background that would
   * paint over the backdrop's `bg-black/30 backdrop-blur-md`. */
  panelClass?: string;
}

const props = withDefaults(defineProps<SdBottomSheetProps>(), {
  height: 'auto',
  closable: true,
});

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

function close() {
  if (props.closable) emit('update:open', false);
}

watch(() => props.open, (v) => {
  document.body.style.overflow = v ? 'hidden' : '';
});

const heightClasses: Record<BottomSheetHeight, string> = {
  auto: 'max-h-[85vh]',
  half: 'h-[50vh]',
  full: 'h-[calc(100vh-2rem)]',
};

// Swipe-to-dismiss. Gesture is anchored on the header strip (handle +
// title row) so a touch-drag inside the body can still scroll long
// content. Crossing CLOSE_PX in either distance or short-flick distance
// dismisses; anything less springs back.
const CLOSE_PX = 80;
const dragY = ref(0);
const dragging = ref(false);
let startY = 0;

function onHeaderTouchStart(e: TouchEvent): void {
  if (!props.closable) return;
  const t = e.touches[0];
  if (!t) return;
  startY = t.clientY;
  dragY.value = 0;
  dragging.value = true;
}
function onHeaderTouchMove(e: TouchEvent): void {
  if (!dragging.value) return;
  const t = e.touches[0];
  if (!t) return;
  const dy = t.clientY - startY;
  dragY.value = Math.max(0, dy);
}
function onHeaderTouchEnd(): void {
  if (!dragging.value) return;
  const shouldClose = dragY.value >= CLOSE_PX;
  dragging.value = false;
  if (shouldClose) {
    dragY.value = 0;
    close();
  } else {
    dragY.value = 0;
  }
}

const panelStyle = computed(() => {
  if (!dragging.value && dragY.value === 0) return undefined;
  return {
    transform: `translateY(${dragY.value}px)`,
    transition: dragging.value ? 'none' : 'transform 200ms ease-out',
  };
});
</script>

<template>
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
        v-if="open"
        class="fixed inset-0 z-[200] bg-black/30 backdrop-blur-md"
        @click.self="close"
      >
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="translate-y-full"
          enter-to-class="translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="translate-y-0"
          leave-to-class="translate-y-full"
        >
          <div
            v-if="open"
            class="sd-sheet-panel fixed bottom-0 left-0 right-0 z-[201] rounded-t-2xl flex flex-col"
            :class="[heightClasses[height], panelClass]"
            :style="panelStyle"
          >
            <!-- Handle + Header -->
            <div
              class="shrink-0 pt-3 pb-2 px-5 touch-none cursor-grab active:cursor-grabbing select-none"
              @touchstart.passive="onHeaderTouchStart"
              @touchmove.passive="onHeaderTouchMove"
              @touchend="onHeaderTouchEnd"
              @touchcancel="onHeaderTouchEnd"
            >
              <div
                class="w-10 h-1 rounded-full mx-auto mb-3"
                style="background-color: currentColor; opacity: 0.25;"
              />
              <div
                v-if="title || closable"
                class="flex items-center justify-between"
              >
                <h2
                  v-if="title"
                  class="font-heading text-lg font-semibold text-sd-text"
                >
                  {{ title }}
                </h2>
                <span v-else />
                <button
                  v-if="closable"
                  type="button"
                  class="w-8 h-8 flex items-center justify-center rounded-lg text-sd-text-muted hover:bg-sd-bg-surface"
                  @click="close"
                >
                  <svg
                    class="w-4 h-4"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M4 4l8 8M12 4l-8 8"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-5 pb-5">
              <slot />
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="shrink-0 px-5 py-4 border-t border-sd-border"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
/* Sheet panel: translucent + blurred by default so the page behind    */
/* reads as soft frosted glass instead of a solid slab. Non-scoped so  */
/* it wins over the customer-shell bg-white remap; the customer-shell  */
/* override below swaps the tint to the tenant palette.                */
.sd-sheet-panel {
  background-color: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
}
.customer-shell .sd-sheet-panel,
.sd-sheet-panel.customer-shell {
  background-color: color-mix(in srgb, var(--tenant-bg-alt) 72%, transparent);
}
</style>
