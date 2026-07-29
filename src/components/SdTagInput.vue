<script setup lang="ts">
import { computed, ref } from 'vue';

export type TagInputSize = 'sm' | 'md' | 'touch';

/**
 * Per-tag visual state.
 *
 * `invalid` is the one that earns its keep: a malformed recipient must show
 * as a red chip **without blocking send** (UX §6, Compose), which a boolean
 * "valid" flag on the whole field cannot express.
 */
export type TagState = 'default' | 'invalid' | 'warning' | 'pending';

/**
 * A suggestion with more than a value. Recipient autocomplete has to show a
 * name over an address; a bare `string[]` can only show one of the two.
 */
export interface TagSuggestion {
  /** The value committed as the tag. */
  value: string;
  /** Primary line. Falls back to `value`. */
  label?: string;
  /** Secondary line, e.g. the address under the display name. */
  description?: string;
  /** Two or three initials for the leading avatar circle. */
  initials?: string;
  /** Rendered but not selectable. */
  disabled?: boolean;
}

export interface SdTagInputProps {
  modelValue?: string[];
  /** Plain strings or rich rows; both are accepted. */
  suggestions?: (string | TagSuggestion)[];
  label?: string;
  placeholder?: string;
  size?: TagInputSize;
  disabled?: boolean;
  maxTags?: number;
  /**
   * Per-tag state, keyed by tag value. Anything absent is `default`.
   * Cheaper for the host than a callback because it is usually derived from
   * one validation pass.
   */
  tagStates?: Record<string, TagState>;
  /**
   * Convenience validator applied to any tag with no explicit `tagStates`
   * entry. Returning false renders the chip in the invalid state; it never
   * refuses the tag.
   */
  validate?: (tag: string) => boolean;
  /**
   * Lowercase tags on entry. **Defaults to true**, which is what this
   * component has always done. Email addresses and display names must not be
   * mangled, so recipient inputs pass `false`.
   */
  lowercase?: boolean;
  /**
   * Extra characters that commit the current input, besides Enter.
   * Defaults to comma, as before; recipient inputs usually add `;` and ` `.
   */
  separators?: string[];
  /** Allow the same value twice. Off, as before. */
  allowDuplicates?: boolean;
  /** Accessible description of the remove button, `{tag}` is substituted. */
  removeLabel?: string;
}

const props = withDefaults(defineProps<SdTagInputProps>(), {
  modelValue: () => [],
  suggestions: () => [],
  label: undefined,
  placeholder: 'Add tag...',
  size: 'md',
  disabled: false,
  maxTags: 20,
  tagStates: () => ({}),
  validate: undefined,
  lowercase: true,
  separators: () => [','],
  allowDuplicates: false,
  removeLabel: 'Entfernen: {tag}',
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
  /** A tag was rejected. `reason` lets the host explain itself. */
  reject: [payload: { value: string; reason: 'duplicate' | 'max-tags' | 'empty' }];
}>();

const inputValue = ref('');
const inputRef = ref<HTMLInputElement | null>(null);
const showSuggestions = ref(false);
const focusedSuggestion = ref(-1);
const listboxId = `sd-taginput-${Math.random().toString(36).slice(2, 9)}`;

/** Normalise the two accepted suggestion shapes into one. */
const normalizedSuggestions = computed<TagSuggestion[]>(() =>
  props.suggestions.map((s) => (typeof s === 'string' ? { value: s } : s)),
);

const filteredSuggestions = computed<TagSuggestion[]>(() => {
  if (!inputValue.value.trim()) return [];
  const q = inputValue.value.toLowerCase();
  return normalizedSuggestions.value
    .filter((s) => {
      if (props.modelValue.includes(s.value)) return false;
      const haystack = `${s.value} ${s.label ?? ''} ${s.description ?? ''}`.toLowerCase();
      return haystack.includes(q);
    })
    .slice(0, 8);
});

function normalize(tag: string): string {
  const trimmed = tag.trim();
  return props.lowercase ? trimmed.toLowerCase() : trimmed;
}

function addTag(tag: string) {
  const value = normalize(tag);
  if (!value) {
    emit('reject', { value: tag, reason: 'empty' });
    return;
  }
  if (!props.allowDuplicates && props.modelValue.includes(value)) {
    emit('reject', { value, reason: 'duplicate' });
    return;
  }
  if (props.modelValue.length >= props.maxTags) {
    emit('reject', { value, reason: 'max-tags' });
    return;
  }

  emit('update:modelValue', [...props.modelValue, value]);
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

function commitCurrent() {
  const focused = filteredSuggestions.value[focusedSuggestion.value];
  if (focusedSuggestion.value >= 0 && focused) {
    if (!focused.disabled) addTag(focused.value);
  } else {
    addTag(inputValue.value);
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || props.separators.includes(e.key)) {
    e.preventDefault();
    commitCurrent();
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

/** Pasting "a@b.ch, c@d.ch" should produce two chips, not one broken one. */
function onPaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text');
  if (!text) return;
  const pattern = new RegExp(`[\n${props.separators.map((c) => `\\${c}`).join('')}]`);
  if (!pattern.test(text)) return;
  e.preventDefault();
  for (const part of text.split(pattern)) {
    if (part.trim()) addTag(part);
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

// ── Per-tag state ──────────────────────────────────────────────────────────

function stateFor(tag: string): TagState {
  const explicit = props.tagStates[tag];
  if (explicit) return explicit;
  if (props.validate && !props.validate(tag)) return 'invalid';
  return 'default';
}

const stateClasses: Record<TagState, { pill: string; close: string }> = {
  default: {
    pill: 'bg-sd-purple-subtle text-sd-purple border border-transparent',
    close: 'hover:bg-sd-purple/20',
  },
  invalid: {
    pill: 'bg-sd-error-light text-sd-error-text border border-sd-error/40',
    close: 'hover:bg-sd-error/20',
  },
  warning: {
    pill: 'bg-sd-warning-light text-sd-warning-text border border-sd-warning/40',
    close: 'hover:bg-sd-warning/20',
  },
  pending: {
    pill: 'bg-sd-bg-alt text-sd-text-secondary border border-sd-border animate-pulse',
    close: 'hover:bg-sd-gray/30',
  },
};

function removeAria(tag: string): string {
  return props.removeLabel.replace('{tag}', tag);
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
          class="inline-flex items-center gap-1 rounded-full font-medium"
          :class="[sc.pill, stateClasses[stateFor(tag)].pill]"
        >
          <slot
            name="tag"
            :tag="tag"
            :index="i"
            :state="stateFor(tag)"
          >{{ tag }}</slot>
          <button
            type="button"
            class="sd-focus-ring inline-flex items-center justify-center rounded-full transition-colors"
            :class="[size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4', stateClasses[stateFor(tag)].close]"
            :aria-label="removeAria(tag)"
            @click.stop="removeTag(i)"
          >
            <svg
              class="w-2.5 h-2.5"
              viewBox="0 0 10 10"
              fill="none"
              aria-hidden="true"
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
          role="combobox"
          aria-autocomplete="list"
          :aria-expanded="showSuggestions && filteredSuggestions.length > 0"
          :aria-controls="listboxId"
          :aria-activedescendant="focusedSuggestion >= 0 ? `${listboxId}-${focusedSuggestion}` : undefined"
          :placeholder="modelValue.length === 0 ? placeholder : ''"
          class="flex-1 min-w-[80px] outline-none bg-transparent text-sd-text placeholder-sd-text-muted"
          :class="sc.input"
          :disabled="disabled"
          @input="onInput"
          @keydown="onKeydown"
          @paste="onPaste"
          @focus="onInput"
          @blur="onBlur"
        >
      </div>

      <!-- Suggestions dropdown -->
      <div
        v-if="showSuggestions && filteredSuggestions.length > 0"
        :id="listboxId"
        role="listbox"
        class="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-sd-border rounded-sd-sm shadow-lg overflow-hidden"
      >
        <button
          v-for="(suggestion, i) in filteredSuggestions"
          :id="`${listboxId}-${i}`"
          :key="suggestion.value"
          type="button"
          role="option"
          :aria-selected="i === focusedSuggestion"
          :aria-disabled="suggestion.disabled"
          class="w-full text-left px-3 py-2 text-sm text-sd-text transition-colors flex items-center gap-2.5"
          :class="[
            i === focusedSuggestion ? 'bg-sd-purple-subtle text-sd-purple' : 'hover:bg-sd-bg-alt',
            suggestion.disabled ? 'opacity-50 cursor-not-allowed' : '',
          ]"
          @mousedown.prevent="!suggestion.disabled && addTag(suggestion.value)"
        >
          <slot
            name="suggestion"
            :suggestion="suggestion"
            :active="i === focusedSuggestion"
          >
            <span
              v-if="suggestion.initials"
              class="shrink-0 w-7 h-7 rounded-full bg-sd-purple-light text-sd-purple-dark text-[11px] font-semibold flex items-center justify-center"
              aria-hidden="true"
            >{{ suggestion.initials }}</span>
            <span class="min-w-0 flex-1">
              <span class="block truncate">{{ suggestion.label ?? suggestion.value }}</span>
              <!-- Two-line row: name over address. This is the whole point of
                   accepting rich suggestions. -->
              <span
                v-if="suggestion.description"
                class="block truncate text-[12px] text-sd-text-secondary"
              >{{ suggestion.description }}</span>
            </span>
          </slot>
        </button>
      </div>
    </div>
  </div>
</template>
