<script setup lang="ts">
import { onMounted, ref } from 'vue';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface SdToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

const props = withDefaults(defineProps<SdToastProps>(), {
  variant: 'success',
  duration: 3000,
});

const emit = defineEmits<{
  close: [];
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

onMounted(() => {
  if (props.duration > 0) {
    setTimeout(close, props.duration);
  }
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
      <button
        type="button"
        class="transition-colors shrink-0"
        style="color: #6b7280;"
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
