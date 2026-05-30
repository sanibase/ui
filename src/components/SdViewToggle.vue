<script setup lang="ts">
export type ViewMode = 'grid' | 'list' | 'table';

export interface SdViewToggleProps {
  modelValue: ViewMode;
  modes?: ViewMode[];
}

const props = withDefaults(defineProps<SdViewToggleProps>(), {
  modes: () => ['grid', 'list', 'table'],
});

const emit = defineEmits<{
  'update:modelValue': [value: ViewMode];
}>();

const icons: Record<ViewMode, string> = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  list: 'M3 4h18M3 10h18M3 16h18M3 22h18',
  table: 'M3 3h18v18H3zM3 9h18M3 15h18M9 3v18',
};
</script>

<template>
  <div class="inline-flex rounded-lg border border-sd-border bg-white overflow-hidden">
    <button
      v-for="mode in modes"
      :key="mode"
      type="button"
      class="px-2.5 py-1.5 transition-colors duration-150"
      :class="modelValue === mode ? 'bg-sd-orange text-white' : 'text-sd-text-muted hover:bg-sd-bg-surface'"
      @click="emit('update:modelValue', mode)"
    >
      <svg
        class="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path :d="icons[mode]" />
      </svg>
    </button>
  </div>
</template>
