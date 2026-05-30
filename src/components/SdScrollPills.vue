<script setup lang="ts">
export type ScrollPillSize = 'sm' | 'md' | 'touch';

export interface PillOption {
  label: string;
  value: string | number;
  count?: number;
}

export interface SdScrollPillsProps {
  modelValue?: string | number | null;
  options: PillOption[];
  size?: ScrollPillSize;
  allLabel?: string;
}

const props = withDefaults(defineProps<SdScrollPillsProps>(), {
  modelValue: null,
  size: 'md',
  allLabel: 'All',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null];
}>();

function select(value: string | number | null) {
  emit('update:modelValue', value);
}
</script>

<template>
  <div class="overflow-x-auto -mx-1 px-1 scrollbar-hide">
    <div class="flex gap-2 w-max">
      <!-- "All" pill -->
      <button
        type="button"
        class="shrink-0 font-semibold rounded-full border transition-all duration-150 whitespace-nowrap"
        :class="[
          modelValue === null
            ? 'bg-sd-orange text-white border-sd-orange'
            : 'bg-white text-sd-text-secondary border-sd-border hover:border-sd-orange/40',
          size === 'touch' ? 'px-5 py-2.5 text-base' : size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm',
          size === 'touch' ? 'active:scale-[0.96]' : '',
        ]"
        @click="select(null)"
      >
        {{ allLabel }}
      </button>

      <!-- Option pills -->
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="shrink-0 font-semibold rounded-full border transition-all duration-150 whitespace-nowrap"
        :class="[
          modelValue === opt.value
            ? 'bg-sd-orange text-white border-sd-orange'
            : 'bg-white text-sd-text-secondary border-sd-border hover:border-sd-orange/40',
          size === 'touch' ? 'px-5 py-2.5 text-base' : size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm',
          size === 'touch' ? 'active:scale-[0.96]' : '',
        ]"
        @click="select(opt.value)"
      >
        {{ opt.label }}
        <span
          v-if="opt.count !== undefined"
          class="ml-1 opacity-60"
        >
          {{ opt.count }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
