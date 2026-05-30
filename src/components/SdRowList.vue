<script setup lang="ts">
import SdEmptyState from './SdEmptyState.vue';
import SdSpinner from './SdSpinner.vue';

export type RowListSize = 'sm' | 'md' | 'touch';

export interface SdRowListProps {
  /** Array of items to render */
  items: unknown[];
  /** Size variant */
  size?: RowListSize;
  /** Show loading skeleton */
  loading?: boolean;
  /** Number of skeleton rows when loading */
  skeletonCount?: number;
  /** Empty state title */
  emptyTitle?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Gap between rows in px */
  gap?: number;
  /** Whether rows are hoverable */
  hoverable?: boolean;
}

withDefaults(defineProps<SdRowListProps>(), {
  size: 'md',
  loading: false,
  skeletonCount: 4,
  emptyTitle: 'No items',
  emptyDescription: 'Nothing to show here yet.',
  gap: 8,
  hoverable: true,
});

defineEmits<{
  'row-click': [item: unknown, index: number];
}>();

const sizeClasses: Record<RowListSize, string> = {
  sm: 'p-3 gap-2.5',
  md: 'p-4 gap-3',
  touch: 'p-5 gap-4',
};

const skeletonAvatarSize: Record<RowListSize, string> = {
  sm: 'w-9 h-9',
  md: 'w-10 h-10',
  touch: 'w-14 h-14',
};

const skeletonTextHeight: Record<RowListSize, string> = {
  sm: 'h-3',
  md: 'h-3.5',
  touch: 'h-4',
};
</script>

<template>
  <div>
    <!-- Loading -->
    <div
      v-if="loading"
      class="flex flex-col"
      :style="{ gap: `${gap}px` }"
    >
      <div
        v-for="i in skeletonCount"
        :key="i"
        class="flex items-center bg-white border border-sd-border rounded-sd-md animate-pulse"
        :class="sizeClasses[size]"
      >
        <div
          class="shrink-0 rounded-sd bg-sd-bg-alt"
          :class="skeletonAvatarSize[size]"
        />
        <div class="flex-1 min-w-0 space-y-2">
          <div
            class="bg-sd-bg-alt rounded"
            :class="[skeletonTextHeight[size], 'w-2/5']"
          />
          <div class="bg-sd-bg-alt rounded h-2.5 w-1/3" />
        </div>
        <div class="shrink-0 bg-sd-bg-alt rounded w-16 h-5" />
      </div>
    </div>

    <!-- Empty -->
    <div
      v-else-if="items.length === 0"
      class="bg-white border border-sd-border rounded-sd-md"
    >
      <SdEmptyState
        :title="emptyTitle"
        :description="emptyDescription"
      >
        <template
          v-if="$slots['empty-icon']"
          #icon
        >
          <slot name="empty-icon" />
        </template>
        <template
          v-if="$slots['empty-action']"
          #action
        >
          <slot name="empty-action" />
        </template>
      </SdEmptyState>
    </div>

    <!-- Rows -->
    <div
      v-else
      class="flex flex-col"
      :style="{ gap: `${gap}px` }"
    >
      <div
        v-for="(item, index) in items"
        :key="index"
        class="flex items-center bg-white border border-sd-border rounded-sd-md transition-all duration-150"
        :class="[
          sizeClasses[size],
          hoverable ? 'cursor-pointer hover:bg-sd-purple-subtle' : '',
          size === 'touch' ? 'active:scale-[0.99]' : '',
        ]"
        @click="$emit('row-click', item, index)"
      >
        <!-- Avatar / Leading -->
        <div
          v-if="$slots.avatar"
          class="shrink-0"
        >
          <slot
            name="avatar"
            :item="item"
            :index="index"
          />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <slot
            name="content"
            :item="item"
            :index="index"
          />
        </div>

        <!-- Meta / Badges -->
        <div
          v-if="$slots.meta"
          class="shrink-0"
        >
          <slot
            name="meta"
            :item="item"
            :index="index"
          />
        </div>

        <!-- Actions -->
        <div
          v-if="$slots.actions"
          class="shrink-0 flex items-center gap-1"
          @click.stop
        >
          <slot
            name="actions"
            :item="item"
            :index="index"
          />
        </div>
      </div>
    </div>
  </div>
</template>
