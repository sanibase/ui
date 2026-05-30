<script setup lang="ts">
export type ListItemSize = 'sm' | 'md' | 'touch';

export interface SdListItemProps {
  title: string;
  subtitle?: string;
  meta?: string;
  image?: string;
  size?: ListItemSize;
  hoverable?: boolean;
  selected?: boolean;
}

withDefaults(defineProps<SdListItemProps>(), {
  size: 'md',
  hoverable: true,
  selected: false,
});

defineEmits<{
  click: [];
}>();
</script>

<template>
  <div
    class="flex items-center gap-3 bg-white border border-sd-border rounded-lg transition-all duration-150"
    :class="[
      size === 'touch' ? 'p-4 gap-4' : size === 'sm' ? 'p-2.5 gap-2.5' : 'p-3',
      selected ? 'border-sd-orange bg-sd-orange/5' : '',
      hoverable ? 'cursor-pointer' : '',
      hoverable && !selected ? 'hover:bg-sd-purple-subtle' : '',
      size === 'touch' ? 'active:scale-[0.99]' : '',
    ]"
    @click="$emit('click')"
  >
    <!-- Avatar / Image -->
    <div
      v-if="image || $slots.avatar"
      class="shrink-0"
    >
      <slot name="avatar">
        <img
          v-if="image"
          :src="image"
          :alt="title"
          class="rounded-sd object-cover"
          :class="size === 'touch' ? 'w-14 h-14' : size === 'sm' ? 'w-9 h-9' : 'w-10 h-10'"
        >
      </slot>
    </div>
    <div
      v-else-if="$slots.icon"
      class="shrink-0"
    >
      <slot name="icon" />
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <h3
        class="font-medium text-sd-text truncate"
        :class="size === 'touch' ? 'text-base' : size === 'sm' ? 'text-[13px]' : 'text-sm'"
      >
        {{ title }}
      </h3>
      <p
        v-if="subtitle"
        class="text-sd-text-muted truncate"
        :class="size === 'touch' ? 'text-sm mt-0.5' : 'text-xs'"
      >
        {{ subtitle }}
      </p>
    </div>

    <!-- Meta / Badge -->
    <div
      v-if="meta || $slots.meta"
      class="shrink-0 text-right"
    >
      <slot name="meta">
        <span class="text-xs text-sd-text-muted">{{ meta }}</span>
      </slot>
    </div>

    <!-- Actions -->
    <div
      v-if="$slots.actions"
      class="shrink-0 flex items-center gap-1"
    >
      <slot name="actions" />
    </div>
  </div>
</template>
