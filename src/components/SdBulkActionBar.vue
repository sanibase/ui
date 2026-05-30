<script setup lang="ts">
import { computed } from 'vue';
import SdButton from './SdButton.vue';

export type BulkActionBarSize = 'md' | 'touch';

export interface BulkAction {
  key: string;
  label: string;
  variant?: 'primary' | 'secondary-outline' | 'danger';
  icon?: string;
}

export interface SdBulkActionBarProps {
  count: number;
  actions?: BulkAction[];
  size?: BulkActionBarSize;
}

const props = withDefaults(defineProps<SdBulkActionBarProps>(), {
  actions: () => [],
  size: 'md',
});

const emit = defineEmits<{
  action: [key: string];
  clear: [];
}>();

const visible = computed(() => props.count > 0);

const buttonVariant: Record<string, 'primary' | 'secondary-outline' | 'ghost' | 'danger'> = {
  primary: 'primary',
  'secondary-outline': 'secondary-outline',
  danger: 'danger',
};

const barClasses: Record<BulkActionBarSize, string> = {
  md: 'py-2.5 px-4 gap-3',
  touch: 'py-3.5 px-5 gap-4',
};

const countClasses: Record<BulkActionBarSize, string> = {
  md: 'text-sm',
  touch: 'text-base',
};

const buttonSize: Record<BulkActionBarSize, 'sm' | 'md'> = {
  md: 'sm',
  touch: 'md',
};
</script>

<template>
  <Teleport to="body">
    <Transition name="sd-bulk-bar">
      <div
        v-if="visible"
        class="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-between
               bg-white border-t border-sd-border shadow-sd-lg"
        :class="barClasses[size]"
      >
        <!-- Left: count + clear -->
        <div class="flex items-center gap-3">
          <span
            class="font-medium text-sd-text tabular-nums"
            :class="countClasses[size]"
          >
            {{ count }} selected
          </span>
          <button
            type="button"
            class="text-sd-text-muted text-xs font-medium hover:text-sd-text hover:underline transition-colors"
            @click="emit('clear')"
          >
            Clear
          </button>
        </div>

        <!-- Right: action buttons -->
        <div class="flex items-center gap-2">
          <slot>
            <SdButton
              v-for="action in actions"
              :key="action.key"
              :variant="buttonVariant[action.variant || 'secondary-outline'] || 'secondary-outline'"
              :size="buttonSize[size]"
              @click="emit('action', action.key)"
            >
              {{ action.label }}
            </SdButton>
          </slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sd-bulk-bar-enter-active,
.sd-bulk-bar-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.sd-bulk-bar-enter-from,
.sd-bulk-bar-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
