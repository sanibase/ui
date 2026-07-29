<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface SdToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  /**
   * Convenience action rendered as a text button before the close control —
   * the "Rückgängig" of an undo toast. For anything richer use the `action`
   * slot, which replaces this button entirely.
   */
  actionLabel?: string;
  /**
   * Freeze the auto-dismiss countdown while the pointer is over the toast.
   * Off by default so existing toasts keep their exact timing; on it is the
   * difference between reaching an undo button and watching it vanish.
   */
  pauseOnHover?: boolean;
  /** Accessible label for the close control. */
  closeLabel?: string;
}

const props = withDefaults(defineProps<SdToastProps>(), {
  variant: 'success',
  duration: 3000,
  actionLabel: undefined,
  pauseOnHover: false,
  closeLabel: 'Schliessen',
});

const emit = defineEmits<{
  close: [];
  /** The convenience action button was pressed. */
  action: [];
}>();

const visible = ref(true);

const variants: Record<ToastVariant, { bg: string; border: string }> = {
  success: { bg: 'bg-sd-success', border: 'border-[1.5px] border-sd-success/40' },
  error: { bg: 'bg-sd-error', border: 'border-[1.5px] border-sd-error/40' },
  warning: { bg: 'bg-sd-warning', border: 'border-[1.5px] border-sd-warning/40' },
  info: { bg: 'bg-sd-info', border: 'border-[1.5px] border-sd-info/40' },
};

function close() {
  visible.value = false;
  setTimeout(() => emit('close'), 200);
}

function onAction() {
  emit('action');
  close();
}

// The countdown is restartable so pauseOnHover can suspend and resume it.
let timer: ReturnType<typeof setTimeout> | null = null;
let remaining = props.duration;
let startedAt = 0;

function startTimer() {
  if (remaining <= 0) return;
  startedAt = Date.now();
  timer = setTimeout(close, remaining);
}

function pauseTimer() {
  if (!props.pauseOnHover || !timer) return;
  clearTimeout(timer);
  timer = null;
  remaining -= Date.now() - startedAt;
}

function resumeTimer() {
  if (!props.pauseOnHover || timer) return;
  startTimer();
}

onMounted(startTimer);

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
});
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-3 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="-translate-y-2 opacity-0"
  >
    <!-- Inline style for the slab colors so the toast renders identically
         in every surface, including the customer-shell where Tailwind's
         `bg-white`/`text-sd-text` would get remapped to tenant tones and
         vanish into a dark page bg. The SaniDesk light-toast aesthetic is
         the universal contract; tenants don't get to re-skin it. -->
    <div
      v-if="visible"
      class="flex items-center gap-3 px-4 py-3 rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.1)] border min-w-[280px] max-w-[420px]"
      :class="variants[variant].border"
      style="background: #ffffff;"
      role="status"
      aria-live="polite"
      @mouseenter="pauseTimer"
      @mouseleave="resumeTimer"
      @focusin="pauseTimer"
      @focusout="resumeTimer"
    >
      <span
        class="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
        :class="variants[variant].bg"
      >
        <!-- Success: checkmark -->
        <svg
          v-if="variant === 'success'"
          class="w-3.5 h-3.5 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
        <!-- Error: X -->
        <svg
          v-else-if="variant === 'error'"
          class="w-3.5 h-3.5 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
        >
          <path d="M6 6l12 12M18 6l-12 12" />
        </svg>
        <!-- Warning: triangle with ! -->
        <svg
          v-else-if="variant === 'warning'"
          class="w-3.5 h-3.5 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line
            x1="12"
            y1="9"
            x2="12"
            y2="13"
          />
          <line
            x1="12"
            y1="17"
            x2="12.01"
            y2="17"
          />
        </svg>
        <!-- Info: i in circle -->
        <svg
          v-else
          class="w-3.5 h-3.5 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke-width="2"
          />
          <line
            x1="12"
            y1="16"
            x2="12"
            y2="12"
          />
          <line
            x1="12"
            y1="8"
            x2="12.01"
            y2="8"
          />
        </svg>
      </span>
      <span
        class="text-sm flex-1"
        style="color: #1a1a2e;"
      >{{ message }}</span>

      <!-- Action: slot wins, then the actionLabel convenience, then nothing.
           Undo lives here (UX §6 "Undo, everywhere"). -->
      <span
        v-if="$slots.action || actionLabel"
        class="shrink-0"
      >
        <slot
          name="action"
          :close="close"
        >
          <button
            type="button"
            class="sd-focus-ring text-sm font-semibold uppercase tracking-wide px-2 py-1 rounded-md transition-colors hover:bg-black/5"
            style="color: #8B5A9F;"
            @click="onAction"
          >
            {{ actionLabel }}
          </button>
        </slot>
      </span>

      <button
        type="button"
        class="sd-focus-ring transition-colors shrink-0"
        style="color: #6b7280;"
        :aria-label="closeLabel"
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
  </Transition>
</template>
