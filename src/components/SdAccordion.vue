<script setup lang="ts">
import { ref, watch } from 'vue';
import { PhCaretDown } from '@phosphor-icons/vue';

export type AccordionSize = 'sm' | 'md' | 'touch';

export interface AccordionItem {
  key: string;
  label: string;
  badge?: string | number;
  disabled?: boolean;
}

export interface SdAccordionProps {
  items: AccordionItem[];
  /** Which keys are open (v-model) */
  modelValue?: string[];
  /** Allow only one section open at a time */
  single?: boolean;
  size?: AccordionSize;
  /** Show border between sections */
  bordered?: boolean;
}

const props = withDefaults(defineProps<SdAccordionProps>(), {
  modelValue: () => [],
  single: false,
  size: 'md',
  bordered: true,
});

const emit = defineEmits<{
  'update:modelValue': [keys: string[]];
}>();

const openKeys = ref<Set<string>>(new Set(props.modelValue));

watch(() => props.modelValue, (val) => {
  openKeys.value = new Set(val);
});

function toggle(key: string) {
  const next = new Set(openKeys.value);
  if (next.has(key)) {
    next.delete(key);
  } else {
    if (props.single) next.clear();
    next.add(key);
  }
  openKeys.value = next;
  emit('update:modelValue', [...next]);
}

function isOpen(key: string): boolean {
  return openKeys.value.has(key);
}

// Height-based animation hooks
function onEnter(el: Element) {
  const htmlEl = el as HTMLElement;
  htmlEl.style.height = '0';
  htmlEl.style.overflow = 'hidden';
  // Force reflow then set target height
  void htmlEl.offsetHeight;
  htmlEl.style.transition = 'height 200ms ease-out';
  htmlEl.style.height = `${htmlEl.scrollHeight}px`;
}

function onAfterEnter(el: Element) {
  const htmlEl = el as HTMLElement;
  htmlEl.style.height = '';
  htmlEl.style.overflow = '';
  htmlEl.style.transition = '';
}

function onLeave(el: Element) {
  const htmlEl = el as HTMLElement;
  htmlEl.style.height = `${htmlEl.scrollHeight}px`;
  htmlEl.style.overflow = 'hidden';
  void htmlEl.offsetHeight;
  htmlEl.style.transition = 'height 150ms ease-in';
  htmlEl.style.height = '0';
}

function onAfterLeave(el: Element) {
  const htmlEl = el as HTMLElement;
  htmlEl.style.height = '';
  htmlEl.style.overflow = '';
  htmlEl.style.transition = '';
}

const headerMargin: Record<AccordionSize, string> = {
  sm: 'm-1',
  md: 'm-1.5',
  touch: 'm-2',
};

const headerPadding: Record<AccordionSize, string> = {
  sm: 'px-2 py-1.5',
  md: 'px-2.5 py-2',
  touch: 'px-3 py-2.5',
};

const bodyPadding: Record<AccordionSize, string> = {
  sm: 'px-3 pb-3 pt-1',
  md: 'px-4 pb-4 pt-1',
  touch: 'px-5 pb-5 pt-1',
};

const titleSize: Record<AccordionSize, string> = {
  sm: 'text-[13px]',
  md: 'text-sm',
  touch: 'text-base',
};

const iconSize: Record<AccordionSize, number> = {
  sm: 14,
  md: 16,
  touch: 20,
};
</script>

<template>
  <div
    class="rounded-sd-md overflow-hidden"
    :class="bordered ? 'border border-sd-border bg-white divide-y divide-sd-border' : ''"
  >
    <div
      v-for="item in items"
      :key="item.key"
    >
      <!-- Header wrapper — margin creates inset for hover pill -->
      <div :class="headerMargin[size]">
        <div
          class="w-full flex items-center gap-2 rounded-sd-sm transition-colors"
          :class="[
            headerPadding[size],
            item.disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-sd-purple-subtle',
          ]"
        >
          <button
            type="button"
            class="flex-1 min-w-0 flex items-center gap-2 text-left"
            :class="!item.disabled ? 'cursor-pointer' : 'cursor-not-allowed'"
            :disabled="item.disabled"
            @click="toggle(item.key)"
          >
            <span
              class="font-medium text-sd-text flex items-center gap-2"
              :class="titleSize[size]"
            >
              {{ item.label }}
              <span
                v-if="item.badge != null"
                class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-sd-bg-alt text-sd-text-muted text-[11px] font-semibold"
              >
                {{ item.badge }}
              </span>
            </span>
          </button>
          <slot
            :name="`${item.key}-header-actions`"
            :item="item"
          />
          <button
            type="button"
            class="shrink-0 p-0.5 rounded-sm"
            :class="!item.disabled ? 'cursor-pointer' : 'cursor-not-allowed'"
            :disabled="item.disabled"
            @click="toggle(item.key)"
          >
            <PhCaretDown
              :size="iconSize[size]"
              weight="bold"
              class="text-sd-text-muted shrink-0 transition-transform duration-200"
              :class="isOpen(item.key) ? 'rotate-180' : ''"
            />
          </button>
        </div>
      </div>

      <!-- Body with height animation -->
      <Transition
        @enter="onEnter"
        @after-enter="onAfterEnter"
        @leave="onLeave"
        @after-leave="onAfterLeave"
      >
        <div v-if="isOpen(item.key)">
          <div :class="bodyPadding[size]">
            <slot
              :name="item.key"
              :item="item"
            />
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
