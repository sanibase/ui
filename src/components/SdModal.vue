<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface SdModalProps {
  open: boolean;
  title?: string;
  size?: ModalSize;
  closable?: boolean;
  persistent?: boolean;
}

const props = withDefaults(defineProps<SdModalProps>(), {
  size: 'md',
  closable: true,
  persistent: false,
});

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[720px]',
  xl: 'max-w-[900px]',
  full: 'max-w-[calc(100vw-32px)] max-h-[calc(100vh-32px)]',
};

function close() {
  if (!props.closable) return;
  emit('update:open', false);
}

function onBackdrop() {
  if (!props.persistent) close();
}

function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) {
    e.stopImmediatePropagation();
    close();
  }
}

onMounted(() => document.addEventListener('keydown', onEscape));
onBeforeUnmount(() => document.removeEventListener('keydown', onEscape));

watch(() => props.open, (v) => {
  if (v) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  } else {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }
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
        class="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
        @click.self="onBackdrop"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-[0.96] translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-[0.96]"
        >
          <div
            v-if="open"
            class="bg-white rounded-sd-md w-full shadow-[0_12px_48px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col max-h-[90vh]"
            :class="sizeClasses[size]"
          >
            <!-- Header -->
            <div
              v-if="title || closable"
              class="flex items-center justify-between px-6 py-4 border-b border-sd-border shrink-0"
            >
              <h2
                v-if="title"
                class="font-heading text-lg font-semibold text-sd-text min-w-0 break-words"
              >
                {{ title }}
              </h2>
              <span v-else />
              <!-- Sizing lives in .sd-modal-close, not in utility classes: it
                   has to hold even where the consumer's Tailwind never scans
                   this package. -->
              <button
                v-if="closable"
                type="button"
                class="sd-modal-close flex items-center justify-center rounded-lg text-sd-text-muted hover:bg-sd-bg-surface hover:text-sd-text transition-colors"
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

            <!-- Body -->
            <div class="px-6 py-5 overflow-y-auto flex-1">
              <slot />
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="px-6 py-4 border-t border-sd-border flex items-center justify-end gap-2 shrink-0"
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
/* ---------------------------------------------------------------------------
 * The close control.
 *
 * Deliberately plain CSS shipped in `dist/ui.css` rather than utility classes,
 * for two reasons. The dialog is teleported to <body>, so it carries no
 * consuming component's scope id: `:deep()` from the parent matches nothing
 * and attribute fallthrough has no root element to land on. A consumer that
 * needs the control to be hittable therefore cannot make it so, and a rule
 * that only exists if the consumer's Tailwind happens to scan
 * `@sanibase/ui/dist` is not a guarantee either. These three declarations are.
 *
 * - `flex-shrink: 0` is the actual defect. The header is a flex row, and a
 *   long title was free to squeeze the button down to 26px wide. It no longer
 *   is; the title wraps instead, which is what it already did before it ran
 *   out of room.
 * - The `::after` overlay carries the 44px hit area (the house minimum) while
 *   the button keeps drawing at 32px. Growing the button itself would have
 *   made every dialog header 12px taller. The overlay is centred, so the 6px
 *   it adds on each side stay inside the header's own px-6/py-4 padding, over
 *   nothing else that can be clicked.
 * ------------------------------------------------------------------------- */
.sd-modal-close {
  position: relative;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
}

.sd-modal-close::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 44px;
  height: 44px;
  transform: translate(-50%, -50%);
}
</style>
