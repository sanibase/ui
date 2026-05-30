<script setup lang="ts">
export type ProductCardSize = 'sm' | 'md' | 'touch';

export interface SdProductCardProps {
  title: string;
  subtitle?: string;
  price?: string;
  image?: string;
  showImage?: boolean;
  badge?: string;
  badgeVariant?: 'success' | 'warning' | 'error' | 'info' | 'purple' | 'neutral';
  size?: ProductCardSize;
  selected?: boolean;
  disabled?: boolean;
}

withDefaults(defineProps<SdProductCardProps>(), {
  size: 'md',
  selected: false,
  disabled: false,
});

defineEmits<{
  click: [];
}>();
</script>

<template>
  <div
    class="bg-white rounded-sd-md border overflow-hidden transition-all duration-150 cursor-pointer select-none"
    :class="[
      selected ? 'border-sd-orange ring-2 ring-sd-orange/15' : 'border-sd-border hover:shadow-sd',
      disabled ? 'opacity-40 pointer-events-none' : '',
      size === 'touch' ? 'active:scale-[0.97]' : '',
    ]"
    @click="$emit('click')"
  >
    <!-- Image (only when image URL provided or showImage explicitly set) -->
    <template v-if="image || showImage">
      <div
        v-if="image"
        class="w-full bg-sd-bg-alt overflow-hidden"
        :class="size === 'sm' ? 'h-28' : size === 'touch' ? 'h-40' : 'h-32'"
      >
        <img
          :src="image"
          :alt="title"
          class="w-full h-full object-cover"
        >
      </div>
      <div
        v-else
        class="w-full bg-sd-bg-surface flex items-center justify-center"
        :class="size === 'sm' ? 'h-28' : size === 'touch' ? 'h-40' : 'h-32'"
      >
        <svg
          class="text-sd-purple/20"
          :class="size === 'touch' ? 'w-10 h-10' : 'w-8 h-8'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
          />
          <circle
            cx="8.5"
            cy="8.5"
            r="1.5"
          />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
    </template>

    <!-- Content -->
    <div :class="size === 'touch' ? 'p-3.5' : size === 'sm' ? 'p-2.5' : 'p-3'">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          <h3
            class="font-semibold text-sd-text truncate"
            :class="size === 'touch' ? 'text-base' : size === 'sm' ? 'text-[13px]' : 'text-sm'"
          >
            {{ title }}
          </h3>
          <p
            v-if="subtitle"
            class="text-sd-text-muted truncate mt-0.5"
            :class="size === 'touch' ? 'text-sm' : 'text-xs'"
          >
            {{ subtitle }}
          </p>
        </div>
        <slot name="badge">
          <span
            v-if="badge"
            class="text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] shrink-0"
            :class="{
              'bg-sd-success-light text-sd-success': badgeVariant === 'success',
              'bg-sd-warning-light text-sd-warning': badgeVariant === 'warning',
              'bg-sd-error-light text-sd-error': badgeVariant === 'error',
              'bg-sd-info-light text-sd-info': badgeVariant === 'info',
              'bg-sd-purple-subtle text-sd-purple': badgeVariant === 'purple',
              'bg-sd-bg-alt text-sd-text-muted': !badgeVariant || badgeVariant === 'neutral',
            }"
          >
            {{ badge }}
          </span>
        </slot>
      </div>
      <div
        v-if="price"
        class="font-bold text-sd-orange mt-1.5"
        :class="size === 'touch' ? 'text-base' : size === 'sm' ? 'text-sm' : 'text-sm'"
      >
        {{ price }}
      </div>
      <div
        v-if="$slots.actions"
        class="mt-2.5 flex gap-2"
      >
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
