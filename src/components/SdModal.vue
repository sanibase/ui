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
                class="font-heading text-lg font-semibold text-sd-text"
              >
                {{ title }}
              </h2>
              <span v-else />
              <button
                v-if="closable"
                type="button"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-sd-text-muted hover:bg-sd-bg-surface hover:text-sd-text transition-colors"
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
