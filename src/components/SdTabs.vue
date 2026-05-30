<script setup lang="ts">
export type TabSize = 'sm' | 'md' | 'touch';

export interface TabItem {
  label: string;
  value: string | number;
  count?: number;
  disabled?: boolean;
}

export interface SdTabsProps {
  modelValue: string | number;
  tabs: TabItem[];
  size?: TabSize;
}

defineProps<SdTabsProps>();

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
}>();
</script>

<template>
  <div class="flex border-b border-sd-border overflow-x-auto overflow-y-hidden pb-px scrollbar-hide">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      class="shrink-0 font-medium transition-colors duration-150 border-b-2 -mb-px whitespace-nowrap"
      :class="[
        modelValue === tab.value
          ? 'border-sd-orange text-sd-orange font-semibold'
          : 'border-transparent text-sd-text-muted hover:text-sd-text',
        tab.disabled ? 'opacity-40 pointer-events-none' : '',
        size === 'touch' ? 'px-5 py-3.5 text-base' : size === 'sm' ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm',
      ]"
      @click="!tab.disabled && emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
      <span
        v-if="tab.count !== undefined"
        class="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
        :class="modelValue === tab.value ? 'bg-sd-orange/10 text-sd-orange' : 'bg-sd-bg-alt text-sd-text-muted'"
      >
        {{ tab.count }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
