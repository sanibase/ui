<script setup lang="ts">
import { PhLock } from '@phosphor-icons/vue';

export type ModuleLockedSize = 'sm' | 'md' | 'touch';

export interface SdModuleLockedProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  size?: ModuleLockedSize;
}

const props = withDefaults(defineProps<SdModuleLockedProps>(), {
  title: 'Module not available',
  description: 'This module is not included in your current plan.',
  actionLabel: 'Upgrade Plan',
  size: 'md',
});

const emit = defineEmits<{
  action: [];
}>();

const iconSize: Record<ModuleLockedSize, number> = {
  sm: 28,
  md: 36,
  touch: 44,
};

const titleClasses: Record<ModuleLockedSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  touch: 'text-lg',
};

const descClasses: Record<ModuleLockedSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  touch: 'text-base',
};

const btnClasses: Record<ModuleLockedSize, string> = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  touch: 'text-base px-5 py-3',
};

const padClasses: Record<ModuleLockedSize, string> = {
  sm: 'p-4',
  md: 'p-6',
  touch: 'p-8',
};
</script>

<template>
  <div class="relative overflow-hidden rounded-sd-md border border-sd-border">
    <!-- Blurred/greyed content behind -->
    <div class="opacity-20 pointer-events-none select-none blur-[1px]">
      <slot>
        <div class="h-48 bg-sd-bg-alt" />
      </slot>
    </div>

    <!-- Overlay -->
    <div
      class="absolute inset-0 flex flex-col items-center justify-center text-center bg-white/70 backdrop-blur-[2px]"
      :class="padClasses[size]"
    >
      <div class="w-14 h-14 rounded-full bg-sd-bg-alt flex items-center justify-center mb-3">
        <PhLock
          :size="iconSize[size]"
          weight="regular"
          class="text-sd-text-muted"
        />
      </div>
      <h3
        class="font-heading font-semibold text-sd-text"
        :class="titleClasses[size]"
      >
        {{ title }}
      </h3>
      <p
        class="text-sd-text-muted mt-1 max-w-xs"
        :class="descClasses[size]"
      >
        {{ description }}
      </p>
      <button
        v-if="actionLabel"
        type="button"
        class="mt-4 rounded-lg bg-sd-purple text-white font-medium
               hover:bg-sd-purple-dark active:bg-sd-purple-deeper transition-colors"
        :class="btnClasses[size]"
        @click="emit('action')"
      >
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>
