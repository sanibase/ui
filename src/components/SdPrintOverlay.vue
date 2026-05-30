<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue';
import SdButton from './SdButton.vue';

export interface SdPrintOverlayProps {
  open: boolean;
  title?: string;
}

const props = withDefaults(defineProps<SdPrintOverlayProps>(), {
  title: 'Print Preview',
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  print: [];
}>();

function close() {
  emit('update:open', false);
}

function onPrint() {
  emit('print');
  window.print();
}

function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) close();
}

onMounted(() => document.addEventListener('keydown', onEscape));
onBeforeUnmount(() => document.removeEventListener('keydown', onEscape));

watch(() => props.open, (v) => {
  if (v) {
    document.body.style.overflow = 'hidden';
    document.body.classList.add('sd-print-active');
  } else {
    document.body.style.overflow = '';
    document.body.classList.remove('sd-print-active');
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
        class="sd-print-overlay fixed inset-0 z-[300] flex flex-col bg-sd-bg-alt"
      >
        <!-- Toolbar -->
        <div class="sd-print-no-print shrink-0 bg-white border-b border-sd-border px-6 h-14 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button
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
            <h2 class="font-heading text-base font-semibold text-sd-text">
              {{ title }}
            </h2>
          </div>

          <div class="flex items-center gap-2">
            <slot name="toolbar" />
            <SdButton
              variant="primary"
              size="sm"
              @click="onPrint"
            >
              Print
            </SdButton>
          </div>
        </div>

        <!-- Print content area -->
        <div class="flex-1 overflow-y-auto flex justify-center py-8 px-4">
          <div class="sd-print-content bg-white shadow-sd-lg rounded-sd-md w-full max-w-[800px] min-h-[600px]">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
/* When printing, only show the print content */
@media print {
  body.sd-print-active > *:not(.sd-print-overlay) {
    display: none !important;
  }
  .sd-print-overlay {
    position: static !important;
    background: white !important;
  }
  .sd-print-no-print {
    display: none !important;
  }
  .sd-print-content {
    box-shadow: none !important;
    border-radius: 0 !important;
    max-width: 100% !important;
  }
}
</style>
