<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue';

export type DetailPanelSize = 'md' | 'lg' | 'xl';

export interface SdDetailPanelProps {
  open: boolean;
  title?: string;
  subtitle?: string;
  size?: DetailPanelSize;
  closable?: boolean;
}

const props = withDefaults(defineProps<SdDetailPanelProps>(), {
  size: 'md',
  closable: true,
});

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const widthClasses: Record<DetailPanelSize, string> = {
  md: 'w-full max-w-[480px]',
  lg: 'w-full max-w-[640px]',
  xl: 'w-full max-w-[800px]',
};

function close() {
  if (!props.closable) return;
  emit('update:open', false);
}

function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) close();
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
    <!-- Backdrop -->
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
        class="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px]"
        @click="close"
      />
    </Transition>

    <!-- Panel -->
    <Transition
      enter-active-class="transition duration-250 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="open"
        class="fixed inset-y-0 right-0 z-[201] flex flex-col bg-white shadow-sd-lg"
        :class="widthClasses[size]"
      >
        <!-- Header -->
        <div class="flex items-start justify-between px-6 py-4 border-b border-sd-border shrink-0">
          <div class="min-w-0">
            <h2
              v-if="title"
              class="font-heading text-lg font-semibold text-sd-text truncate"
            >
              {{ title }}
            </h2>
            <p
              v-if="subtitle"
              class="text-sm text-sd-text-muted mt-0.5 truncate"
            >
              {{ subtitle }}
            </p>
          </div>
          <div class="flex items-center gap-1 shrink-0 ml-4">
            <slot name="header-actions" />
            <button
              v-if="closable"
              type="button"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-sd-text-muted
                     hover:bg-sd-purple-subtle hover:text-sd-text transition-colors"
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

        <!-- Scrollable body -->
        <div class="flex-1 overflow-y-auto px-6 py-5">
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
  </Teleport>
</template>
