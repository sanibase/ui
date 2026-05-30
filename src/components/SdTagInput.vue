<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

export type TagInputSize = 'sm' | 'md' | 'touch';

export interface SdTagInputProps {
  modelValue?: string[];
  suggestions?: string[];
  label?: string;
  placeholder?: string;
  size?: TagInputSize;
  disabled?: boolean;
  maxTags?: number;
}

const props = withDefaults(defineProps<SdTagInputProps>(), {
  modelValue: () => [],
  suggestions: () => [],
  placeholder: 'Add tag...',
  size: 'md',
  disabled: false,
  maxTags: 20,
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const inputValue = ref('');
const inputRef = ref<HTMLInputElement | null>(null);
const showSuggestions = ref(false);
const focusedSuggestion = ref(-1);

const filteredSuggestions = computed(() => {
  if (!inputValue.value.trim()) return [];
  const q = inputValue.value.toLowerCase();
  return props.suggestions
    .filter(s => s.toLowerCase().includes(q) && !props.modelValue.includes(s))
    .slice(0, 8);
});

function addTag(tag: string) {
  const trimmed = tag.trim().toLowerCase();
  if (!trimmed) return;
  if (props.modelValue.includes(trimmed)) return;
  if (props.modelValue.length >= props.maxTags) return;

  emit('update:modelValue', [...props.modelValue, trimmed]);
  inputValue.value = '';
  showSuggestions.value = false;
  focusedSuggestion.value = -1;
}

function removeTag(index: number) {
  const updated = [...props.modelValue];
  updated.splice(index, 1);
  emit('update:modelValue', updated);
}

function removeLastTag() {
  if (inputValue.value || props.modelValue.length === 0) return;
  removeTag(props.modelValue.length - 1);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    if (focusedSuggestion.value >= 0 && filteredSuggestions.value[focusedSuggestion.value]) {
      addTag(filteredSuggestions.value[focusedSuggestion.value]);
    } else {
      addTag(inputValue.value);
    }
  } else if (e.key === 'Backspace') {
    removeLastTag();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (filteredSuggestions.value.length > 0) {
      focusedSuggestion.value = Math.min(focusedSuggestion.value + 1, filteredSuggestions.value.length - 1);
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    focusedSuggestion.value = Math.max(focusedSuggestion.value - 1, -1);
  } else if (e.key === 'Escape') {
    showSuggestions.value = false;
    focusedSuggestion.value = -1;
  }
}

function onInput() {
  showSuggestions.value = inputValue.value.trim().length > 0;
  focusedSuggestion.value = -1;
}

function onBlur() {
  // Delay to allow click on suggestion
  setTimeout(() => {
    showSuggestions.value = false;
    focusedSuggestion.value = -1;
  }, 150);
}

function focusInput() {
  inputRef.value?.focus();
}

const sizeClasses: Record<TagInputSize, { wrapper: string; pill: string; input: string; text: string }> = {
  sm: { wrapper: 'min-h-[32px] px-2 py-1 gap-1', pill: 'px-1.5 py-0.5 text-xs', input: 'text-xs', text: 'text-xs' },
  md: { wrapper: 'min-h-[38px] px-2.5 py-1.5 gap-1.5', pill: 'px-2 py-0.5 text-[13px]', input: 'text-sm', text: 'text-[13px]' },
  touch: { wrapper: 'min-h-[48px] px-3 py-2 gap-2', pill: 'px-2.5 py-1 text-sm', input: 'text-base', text: 'text-sm' },
};

const sc = computed(() => sizeClasses[props.size]);
</script>

<template>
  <div :class="disabled ? 'opacity-50 pointer-events-none' : ''">
    <div
      v-if="label"
      class="font-medium text-sd-text-muted mb-1.5"
      :class="sc.text"
    >
      {{ label }}
    </div>

    <div class="relative">
      <!-- Input area with pills -->
      <div
        class="flex flex-wrap items-center border border-sd-border rounded-sd-sm bg-white
               cursor-text transition-colors focus-within:border-sd-orange focus-within:ring-1 focus-within:ring-sd-orange/30"
        :class="sc.wrapper"
        @click="focusInput"
      >
        <!-- Tag pills -->
        <span
          v-for="(tag, i) in modelValue"
          :key="tag"
          class="inline-flex items-center gap-1 rounded-full bg-sd-purple-subtle text-sd-purple font-medium"
          :class="sc.pill"
        >
          {{ tag }}
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full hover:bg-sd-purple/20 transition-colors"
            :class="size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'"
            @click.stop="removeTag(i)"
          >
            <svg
              class="w-2.5 h-2.5"
              viewBox="0 0 10 10"
              fill="none"
            >
              <path
                d="M2 2l6 6M8 2l-6 6"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </span>

        <!-- Text input -->
        <input
          ref="inputRef"
          v-model="inputValue"
          type="text"
          :placeholder="modelValue.length === 0 ? placeholder : ''"
          class="flex-1 min-w-[80px] outline-none bg-transparent text-sd-text placeholder-sd-text-muted"
          :class="sc.input"
          :disabled="disabled"
          @input="onInput"
          @keydown="onKeydown"
          @focus="onInput"
          @blur="onBlur"
        >
      </div>

      <!-- Suggestions dropdown -->
      <div
        v-if="showSuggestions && filteredSuggestions.length > 0"
        class="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-sd-border rounded-sd-sm shadow-lg overflow-hidden"
      >
        <button
          v-for="(suggestion, i) in filteredSuggestions"
          :key="suggestion"
          type="button"
          class="w-full text-left px-3 py-2 text-sm text-sd-text transition-colors"
          :class="i === focusedSuggestion ? 'bg-sd-purple-subtle text-sd-purple' : 'hover:bg-sd-bg-muted'"
          @mousedown.prevent="addTag(suggestion)"
        >
          {{ suggestion }}
        </button>
      </div>
    </div>
  </div>
</template>
