<script setup lang="ts" generic="V extends string | number">
import type { Component } from 'vue';

/**
 * One of a few (ADMIN-UI-RULES R10.1): "Aus / Takeaway / Vor Ort",
 * "Geschlossen / Wie immer / Andere Zeit", a period, a sort order.
 *
 * Joined choices inside one grey outline; the chosen one is purple with white
 * words, the others white. Never orange: orange means "do it", a choice is not
 * an action. 36px high on a wide screen, 44px on a phone (real CSS below).
 */
export interface SdSegmentedOption<T extends string | number = string> {
  value: T;
  label: string;
  icon?: Component;
  disabled?: boolean;
  /** Hover hint, e.g. why a choice is disabled. */
  title?: string;
}

export interface SdSegmentedProps<T extends string | number = string> {
  modelValue: T | null;
  options: SdSegmentedOption<T>[];
  /** The group's name for a screen reader ("Bon geht an"). Required. */
  label: string;
  /** Stretch to the full width, each choice an equal share. */
  block?: boolean;
  /** Tight padding and no icons, so three German words fit a phone. */
  compact?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<SdSegmentedProps<V>>(), {
  block: false,
  compact: false,
  disabled: false,
});

const emit = defineEmits<{ 'update:modelValue': [value: V] }>();

function pick(o: SdSegmentedOption<V>): void {
  if (props.disabled || o.disabled) return;
  if (o.value !== props.modelValue) emit('update:modelValue', o.value);
}

function onKey(e: KeyboardEvent, idx: number): void {
  if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
  e.preventDefault();
  const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
  const n = props.options.length;
  for (let k = 1; k <= n; k++) {
    const o = props.options[(idx + step * k + n * k) % n];
    if (o && !o.disabled) {
      pick(o);
      const group = (e.currentTarget as HTMLElement).parentElement;
      (group?.children[props.options.indexOf(o)] as HTMLElement | undefined)?.focus();
      return;
    }
  }
}
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    :aria-disabled="disabled ? 'true' : undefined"
    class="sd-segmented overflow-hidden rounded-lg border border-sd-gray bg-white"
    :class="block ? 'grid' : 'inline-flex max-w-full'"
    :style="block ? { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` } : undefined"
  >
    <button
      v-for="(o, idx) in options"
      :key="String(o.value)"
      type="button"
      role="radio"
      :aria-checked="modelValue === o.value ? 'true' : 'false'"
      :tabindex="modelValue === o.value || (modelValue === null && idx === 0) ? 0 : -1"
      :disabled="disabled || o.disabled"
      :title="o.title"
      class="sd-segment inline-flex min-w-0 items-center justify-center gap-2 border-r border-sd-gray transition-colors last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sd-purple/40"
      :class="[
        compact ? 'px-1.5 text-[13px]' : 'px-4 text-sm',
        modelValue === o.value
          ? 'bg-sd-purple font-semibold text-white'
          : (disabled || o.disabled)
            ? 'cursor-not-allowed font-medium text-sd-text-muted'
            : 'font-medium text-sd-text-secondary hover:bg-sd-purple-subtle',
      ]"
      @click="pick(o)"
      @keydown="onKey($event, idx)"
    >
      <component
        :is="o.icon"
        v-if="o.icon && !compact"
        class="h-4 w-4 shrink-0"
      />
      <span class="truncate">{{ o.label }}</span>
    </button>
  </div>
</template>

<style>
/* ADMIN-UI-RULES R10.3: 36px on a wide screen, 44px on a phone. */
.sd-segment {
  height: 34px;
}
@media (max-width: 639.98px) {
  .sd-segment {
    height: 42px;
  }
}
</style>
