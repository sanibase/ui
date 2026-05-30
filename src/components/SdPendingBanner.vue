<script setup lang="ts">
import SdButton from './SdButton.vue';

export type PendingBannerVariant = 'warning' | 'info' | 'error';
export type PendingBannerSize = 'sm' | 'md' | 'touch';

export interface BannerAction {
  key: string;
  label: string;
  variant?: 'primary' | 'secondary-outline' | 'danger';
}

export interface SdPendingBannerProps {
  message: string;
  variant?: PendingBannerVariant;
  actions?: BannerAction[];
  size?: PendingBannerSize;
  dismissible?: boolean;
}

const props = withDefaults(defineProps<SdPendingBannerProps>(), {
  variant: 'warning',
  actions: () => [],
  size: 'md',
  dismissible: false,
});

const emit = defineEmits<{
  action: [key: string];
  dismiss: [];
}>();

const variantClasses: Record<PendingBannerVariant, { bg: string; border: string; icon: string }> = {
  warning: {
    bg: 'bg-sd-warning-light',
    border: 'border-sd-warning/30',
    icon: 'text-sd-warning',
  },
  info: {
    bg: 'bg-sd-info-light',
    border: 'border-sd-info/30',
    icon: 'text-sd-info',
  },
  error: {
    bg: 'bg-sd-error-light',
    border: 'border-sd-error/30',
    icon: 'text-sd-error',
  },
};

const padClasses: Record<PendingBannerSize, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  touch: 'px-5 py-4',
};

const textClasses: Record<PendingBannerSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  touch: 'text-base',
};

const iconSize: Record<PendingBannerSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  touch: 'w-6 h-6',
};

const buttonSize: Record<PendingBannerSize, 'sm' | 'sm' | 'md'> = {
  sm: 'sm',
  md: 'sm',
  touch: 'md',
};

const buttonVariantMap: Record<string, 'primary' | 'secondary-outline' | 'danger'> = {
  primary: 'primary',
  'secondary-outline': 'secondary-outline',
  danger: 'danger',
};
</script>

<template>
  <div
    class="rounded-sd-sm border flex items-start gap-3"
    :class="[variantClasses[variant].bg, variantClasses[variant].border, padClasses[size]]"
  >
    <!-- Icon -->
    <svg
      :class="[iconSize[size], variantClasses[variant].icon]"
      class="shrink-0 mt-0.5"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <template v-if="variant === 'warning'">
        <path
          fill-rule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clip-rule="evenodd"
        />
      </template>
      <template v-else-if="variant === 'error'">
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
          clip-rule="evenodd"
        />
      </template>
      <template v-else>
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
          clip-rule="evenodd"
        />
      </template>
    </svg>

    <!-- Message -->
    <p
      class="flex-1 min-w-0 font-medium text-sd-text"
      :class="textClasses[size]"
    >
      {{ message }}
    </p>

    <!-- Actions -->
    <div class="flex items-center gap-1.5 shrink-0">
      <SdButton
        v-for="action in actions"
        :key="action.key"
        :variant="buttonVariantMap[action.variant || 'secondary-outline'] || 'secondary-outline'"
        :size="buttonSize[size]"
        @click="emit('action', action.key)"
      >
        {{ action.label }}
      </SdButton>
      <button
        v-if="dismissible"
        type="button"
        class="text-sd-text-muted hover:text-sd-text transition-colors ml-1"
        @click="emit('dismiss')"
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
</template>
