<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

export type TextareaSize = 'sm' | 'md' | 'lg' | 'touch';

export interface SdTextareaProps {
  modelValue?: string;
  label?: string;
  placeholder?: string;
  size?: TextareaSize;
  rows?: number;
  maxlength?: number;
  error?: string;
  hint?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  autoResize?: boolean;
}

const props = withDefaults(defineProps<SdTextareaProps>(), {
  modelValue: '',
  size: 'md',
  rows: 3,
  disabled: false,
  readonly: false,
  required: false,
  autoResize: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const textareaRef = ref<HTMLTextAreaElement>();

const sizeClasses: Record<TextareaSize, { textarea: string; label: string }> = {
  sm: { textarea: 'text-[13px] px-2.5 py-2', label: 'text-xs mb-1' },
  md: { textarea: 'text-sm px-3 py-2.5', label: 'text-[13px] mb-1.5' },
  lg: { textarea: 'text-[15px] px-3.5 py-3', label: 'text-sm mb-1.5' },
  touch: { textarea: 'text-base px-4 py-3.5', label: 'text-sm mb-2' },
};

const charCount = computed(() => props.maxlength ? `${(props.modelValue ?? '').length}/${props.maxlength}` : null);

// Border + focus colors are driven by CSS variables so the component
// stays theme-agnostic. Admin pages get the orange/sd-border defaults
// baked into the var fallbacks; `.customer-shell` (apps/web main.css)
// overrides --sd-textarea-accent → --customer-price for the PWA look.
const classes = computed(() => [
  'sd-textarea',
  'w-full rounded-lg border bg-white transition-all duration-150 outline-none resize-none',
  'text-sd-text placeholder-sd-text-muted/50',
  sizeClasses[props.size].textarea,
  props.error ? 'sd-textarea--error' : '',
  props.disabled ? 'opacity-40 pointer-events-none bg-sd-bg-alt' : '',
]);

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
  if (props.autoResize) resize();
}

function resize() {
  nextTick(() => {
    const el = textareaRef.value;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  });
}

watch(() => props.modelValue, () => {
  if (props.autoResize) resize();
});
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      class="block font-medium text-sd-text-muted"
      :class="sizeClasses[size].label"
    >
      {{ label }}
      <span
        v-if="required"
        class="text-sd-error"
      >*</span>
    </label>

    <textarea
      ref="textareaRef"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :maxlength="maxlength"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :class="classes"
      @input="onInput"
    />

    <div
      v-if="error || hint || charCount"
      class="flex justify-between mt-1"
    >
      <p
        v-if="error"
        class="text-xs text-sd-error font-medium"
      >
        {{ error }}
      </p>
      <p
        v-else-if="hint"
        class="text-xs text-sd-text-muted"
      >
        {{ hint }}
      </p>
      <span v-else />
      <span
        v-if="charCount"
        class="text-xs text-sd-text-muted"
      >{{ charCount }}</span>
    </div>
  </div>
</template>

<style>
/* Theme tokens with admin-default fallbacks. A surrounding
   `.customer-shell` (apps/web/assets/css/main.css) overrides
   --sd-textarea-accent → --customer-price so the same component
   blends into the public PWA without prop plumbing. */
.sd-textarea {
  /* field-sizing: content lets the browser grow the textarea natively
     based on its content. Supported in Chromium 123+ / Safari 18.4+ /
     Firefox 138+. The JS autoResize watcher above handles older
     browsers and programmatic value changes (e.g. localStorage hydration).
     overflow:hidden suppresses the always-visible scrollbar gutter Safari
     reserves on touch devices — with autoResize the textarea never
     actually needs to scroll. */
  field-sizing: content;
  overflow: hidden;
  border-color: var(--sd-textarea-border, #ebebf0);
}
.sd-textarea:focus {
  border-color: var(--sd-textarea-accent, #FF8C42);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--sd-textarea-accent, #FF8C42) 10%, transparent);
}
.sd-textarea--error {
  border-color: #ef4444;
}
.sd-textarea--error:focus {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}
</style>
