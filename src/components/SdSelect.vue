<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

export type SelectSize = 'sm' | 'md' | 'lg' | 'touch';
export type SelectWidth = 'full' | 'fit' | 'auto';
export type SelectPlacement = 'auto' | 'top' | 'bottom';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  group?: string;
}

export interface SdSelectProps {
  modelValue?: string | number | null | (string | number)[];
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  size?: SelectSize;
  width?: SelectWidth;
  placement?: SelectPlacement;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  multiple?: boolean;
  autoSearchThreshold?: number;
  /** Render the dropdown panel in document.body with fixed positioning so it
   *  isn't clipped by ancestor overflow (e.g. modal bodies). */
  teleport?: boolean;
}

const props = withDefaults(defineProps<SdSelectProps>(), {
  modelValue: null,
  placeholder: 'Select...',
  size: 'md',
  width: 'full',
  placement: 'auto',
  disabled: false,
  required: false,
  searchable: false,
  multiple: false,
  autoSearchThreshold: 8,
  // Teleport the dropdown panel to document.body by default so it can't get
  // clipped by ancestor overflow / stacking-context issues (the canonical
  // bug: SdSelect inside a modal renders below the modal's footer buttons).
  // Panel positioning is fixed-coords from the trigger element's bounding
  // rect (see updatePanelPos), so visual placement is identical to the
  // non-teleported variant.
  teleport: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null | (string | number)[]];
}>();

const open = ref(false);
const openAbove = ref(false);
const search = ref('');
const wrapperRef = ref<HTMLElement>();
const panelRef = ref<HTMLElement>();
const listRef = ref<HTMLElement>();
const searchRef = ref<HTMLInputElement>();
const highlightIndex = ref(-1);
const panelStyle = ref<Record<string, string>>({});

const isSearchable = computed(() => props.searchable || props.options.length > props.autoSearchThreshold);

const selectedValues = computed<(string | number)[]>(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) ? props.modelValue : [];
  }
  return props.modelValue != null ? [props.modelValue as string | number] : [];
});

const selectedOptions = computed(() =>
  props.options.filter((o) => selectedValues.value.includes(o.value)),
);

const displayText = computed(() => {
  if (props.multiple) {
    return selectedOptions.value.length > 0 ? null : props.placeholder;
  }
  return selectedOptions.value[0]?.label ?? props.placeholder;
});

const filteredOptions = computed(() => {
  let opts = props.options;
  if (isSearchable.value && search.value) {
    const q = search.value.toLowerCase();
    opts = opts.filter((o) => o.label.toLowerCase().includes(q));
  }
  return opts;
});

const groups = computed(() => {
  const hasGroups = props.options.some((o) => o.group);
  if (!hasGroups) return null;

  const map = new Map<string, SelectOption[]>();
  for (const opt of filteredOptions.value) {
    const g = opt.group ?? '';
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(opt);
  }
  return map;
});

const flatFiltered = computed(() => {
  if (!groups.value) return filteredOptions.value;
  const result: (SelectOption | { _groupHeader: string })[] = [];
  for (const [group, opts] of groups.value) {
    if (group) result.push({ _groupHeader: group });
    result.push(...opts);
  }
  return result;
});

const selectableItems = computed(() =>
  flatFiltered.value.filter((item): item is SelectOption => !('_groupHeader' in item) && !item.disabled),
);

function detectPlacement() {
  if (props.placement === 'top') { openAbove.value = true; return; }
  if (props.placement === 'bottom') { openAbove.value = false; return; }
  // auto: check available space
  const el = wrapperRef.value;
  if (!el) { openAbove.value = false; return; }
  const rect = el.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  openAbove.value = spaceBelow < 240 && rect.top > spaceBelow;
}

function updatePanelPos() {
  if (!props.teleport) return;
  const el = wrapperRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const style: Record<string, string> = {
    position: 'fixed',
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: '400',
  };
  if (openAbove.value) {
    style.bottom = `${window.innerHeight - rect.top + 4}px`;
  } else {
    style.top = `${rect.bottom + 4}px`;
  }
  panelStyle.value = style;
}

function onWindowChange() {
  if (open.value) updatePanelPos();
}

function toggle() {
  if (props.disabled) return;
  open.value = !open.value;
  if (open.value) {
    search.value = '';
    highlightIndex.value = -1;
    detectPlacement();
    updatePanelPos();
    nextTick(() => searchRef.value?.focus());
  }
}

function select(option: SelectOption) {
  if (option.disabled) return;

  if (props.multiple) {
    const current = [...selectedValues.value];
    const idx = current.indexOf(option.value);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(option.value);
    }
    emit('update:modelValue', current);
  } else {
    emit('update:modelValue', option.value);
    open.value = false;
  }
}

function removeChip(value: string | number) {
  if (props.multiple) {
    const current = selectedValues.value.filter((v) => v !== value);
    emit('update:modelValue', current);
  }
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      toggle();
    }
    return;
  }
  if (e.key === 'Escape') {
    open.value = false;
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    highlightIndex.value = Math.min(highlightIndex.value + 1, selectableItems.value.length - 1);
    scrollToHighlight();
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    highlightIndex.value = Math.max(highlightIndex.value - 1, 0);
    scrollToHighlight();
  }
  if (e.key === 'Enter' && highlightIndex.value >= 0) {
    e.preventDefault();
    const opt = selectableItems.value[highlightIndex.value];
    if (opt) select(opt);
  }
}

function scrollToHighlight() {
  const list = listRef.value;
  if (!list) return;
  const items = list.querySelectorAll('[role="option"]');
  const item = items[highlightIndex.value] as HTMLElement | undefined;
  item?.scrollIntoView({ block: 'nearest' });
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as Node;
  const inWrapper = wrapperRef.value?.contains(target);
  const inPanel = panelRef.value?.contains(target);
  if (!inWrapper && !inPanel) {
    open.value = false;
  }
}

function isSelected(value: string | number) {
  return selectedValues.value.includes(value);
}

function getHighlightableIndex(option: SelectOption) {
  return selectableItems.value.indexOf(option);
}

onMounted(() => {
  document.addEventListener('click', onClickOutside);
  window.addEventListener('resize', onWindowChange);
  window.addEventListener('scroll', onWindowChange, true);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside);
  window.removeEventListener('resize', onWindowChange);
  window.removeEventListener('scroll', onWindowChange, true);
});

watch(open, (v) => {
  if (v) highlightIndex.value = -1;
});

const sizeClasses: Record<SelectSize, { trigger: string; label: string; option: string }> = {
  sm: { trigger: 'min-h-[32px] px-2.5 text-[13px]', label: 'text-xs mb-1', option: 'px-2.5 py-1.5 text-[13px]' },
  md: { trigger: 'min-h-[38px] px-3 text-sm', label: 'text-[13px] mb-1.5', option: 'px-3 py-2 text-sm' },
  lg: { trigger: 'min-h-[46px] px-3.5 text-[15px]', label: 'text-sm mb-1.5', option: 'px-3.5 py-2.5 text-[15px]' },
  touch: { trigger: 'min-h-[56px] px-4 text-base', label: 'text-sm mb-2', option: 'px-4 py-3 text-base' },
};

const widthTrigger: Record<SelectWidth, string> = {
  full: 'w-full',
  fit: 'w-fit',
  auto: '',
};

const triggerClasses = computed(() => [
  'flex items-center gap-2 rounded-lg border bg-white transition-all duration-150 cursor-pointer py-1',
  widthTrigger[props.width],
  sizeClasses[props.size].trigger,
  props.error
    ? 'border-sd-error focus:ring-2 focus:ring-sd-error/20'
    : open.value
      ? 'border-sd-orange ring-2 ring-sd-orange/10'
      : 'border-sd-border hover:border-sd-orange/40',
  props.disabled ? 'opacity-40 pointer-events-none bg-sd-bg-alt' : '',
]);

const wrapperWidthClass = computed(() => {
  if (props.width === 'full') return 'w-full';
  if (props.width === 'fit') return 'w-fit';
  return '';
});
</script>

<template>
  <div
    ref="wrapperRef"
    class="relative"
    :class="wrapperWidthClass"
    @keydown="onKeydown"
  >
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

    <button
      type="button"
      :class="triggerClasses"
      :disabled="disabled"
      @click="toggle"
    >
      <div class="flex-1 flex flex-wrap gap-1 items-center min-w-0">
        <!-- Multi-select chips -->
        <template v-if="multiple && selectedOptions.length > 0">
          <span
            v-for="opt in selectedOptions"
            :key="opt.value"
            class="inline-flex items-center gap-1 bg-sd-bg-surface text-sd-purple font-medium rounded-[6px] px-2 py-0.5 text-xs"
          >
            {{ opt.label }}
            <svg
              class="w-3 h-3 cursor-pointer hover:text-sd-purple-dark"
              viewBox="0 0 16 16"
              fill="none"
              @click.stop="removeChip(opt.value)"
            >
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </span>
        </template>
        <!-- Single select text or placeholder -->
        <span
          v-else
          :class="displayText === placeholder ? 'text-sd-text-muted/50' : 'text-sd-text'"
          class="truncate"
        >
          {{ displayText }}
        </span>
      </div>
      <svg
        class="w-4 h-4 text-sd-text-muted shrink-0 transition-transform duration-150"
        :class="open ? 'rotate-180' : ''"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M4 6l4 4 4-4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <Teleport
      to="body"
      :disabled="!teleport"
    >
      <Transition
        enter-active-class="transition duration-150 ease-out"
        :enter-from-class="openAbove ? 'opacity-0 translate-y-1' : 'opacity-0 -translate-y-1'"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        :leave-to-class="openAbove ? 'opacity-0 translate-y-1' : 'opacity-0 -translate-y-1'"
      >
        <div
          v-if="open"
          ref="panelRef"
          class="bg-white border border-sd-border rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden"
          :class="teleport ? '' : [
            'absolute z-50',
            width === 'full' ? 'w-full' : 'min-w-full w-max',
            openAbove ? 'bottom-full mb-1' : 'top-full mt-1',
          ]"
          :style="teleport ? panelStyle : undefined"
        >
          <div
            v-if="isSearchable"
            class="p-2 border-b border-sd-border"
          >
            <input
              ref="searchRef"
              v-model="search"
              type="text"
              placeholder="Search..."
              class="w-full px-2.5 py-1.5 text-sm bg-sd-bg-alt rounded border border-sd-border outline-none focus:border-sd-orange text-sd-text placeholder-sd-text-muted/50"
            >
          </div>

          <ul
            ref="listRef"
            class="max-h-60 overflow-y-auto py-1"
            role="listbox"
          >
            <template v-if="groups">
              <template
                v-for="[group, opts] in groups"
                :key="group"
              >
                <li
                  v-if="group"
                  class="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-sd-text-muted select-none"
                >
                  {{ group }}
                </li>
                <li
                  v-for="opt in opts"
                  :key="opt.value"
                  role="option"
                  :aria-selected="isSelected(opt.value)"
                  :class="[
                    sizeClasses[size].option,
                    'cursor-pointer transition-colors duration-75 flex items-center gap-2',
                    opt.disabled ? 'opacity-40 pointer-events-none' : '',
                    isSelected(opt.value) ? 'text-sd-purple font-semibold bg-sd-purple-subtle' : '',
                    getHighlightableIndex(opt) === highlightIndex && !isSelected(opt.value) ? 'bg-sd-bg-alt' : '',
                    !isSelected(opt.value) && getHighlightableIndex(opt) !== highlightIndex ? 'text-sd-text hover:bg-sd-bg-alt' : '',
                  ]"
                  @click="select(opt)"
                  @mouseenter="highlightIndex = getHighlightableIndex(opt)"
                >
                  <svg
                    v-if="multiple"
                    class="w-4 h-4 shrink-0"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <rect
                      x="1"
                      y="1"
                      width="14"
                      height="14"
                      rx="3"
                      :stroke="isSelected(opt.value) ? '#8B5A9F' : '#ebebf0'"
                      stroke-width="1.5"
                      :fill="isSelected(opt.value) ? '#8B5A9F' : 'white'"
                    />
                    <path
                      v-if="isSelected(opt.value)"
                      d="M4.5 8l2.5 2.5 4.5-5"
                      stroke="white"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  {{ opt.label }}
                </li>
              </template>
            </template>
            <template v-else>
              <li
                v-for="opt in filteredOptions"
                :key="opt.value"
                role="option"
                :aria-selected="isSelected(opt.value)"
                :class="[
                  sizeClasses[size].option,
                  'cursor-pointer transition-colors duration-75 flex items-center gap-2',
                  opt.disabled ? 'opacity-40 pointer-events-none' : '',
                  isSelected(opt.value) ? 'text-sd-purple font-semibold bg-sd-purple-subtle' : '',
                  getHighlightableIndex(opt) === highlightIndex && !isSelected(opt.value) ? 'bg-sd-bg-alt' : '',
                  !isSelected(opt.value) && getHighlightableIndex(opt) !== highlightIndex ? 'text-sd-text hover:bg-sd-bg-alt' : '',
                ]"
                @click="select(opt)"
                @mouseenter="highlightIndex = getHighlightableIndex(opt)"
              >
                <svg
                  v-if="multiple"
                  class="w-4 h-4 shrink-0"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <rect
                    x="1"
                    y="1"
                    width="14"
                    height="14"
                    rx="3"
                    :stroke="isSelected(opt.value) ? '#8B5A9F' : '#ebebf0'"
                    stroke-width="1.5"
                    :fill="isSelected(opt.value) ? '#8B5A9F' : 'white'"
                  />
                  <path
                    v-if="isSelected(opt.value)"
                    d="M4.5 8l2.5 2.5 4.5-5"
                    stroke="white"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                {{ opt.label }}
              </li>
            </template>
            <li
              v-if="filteredOptions.length === 0"
              class="px-3 py-2 text-sm text-sd-text-muted text-center"
            >
              No results
            </li>
          </ul>
        </div>
      </Transition>
    </Teleport>

    <p
      v-if="error"
      class="mt-1 text-xs text-sd-error font-medium"
    >
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      class="mt-1 text-xs text-sd-text-muted"
    >
      {{ hint }}
    </p>
  </div>
</template>
