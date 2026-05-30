<script setup lang="ts">
import { ref } from 'vue';

export type DraggableListSize = 'sm' | 'md' | 'touch';

export interface SdDraggableListProps {
  modelValue: string[];
  size?: DraggableListSize;
  disabled?: boolean;
}

const props = withDefaults(defineProps<SdDraggableListProps>(), {
  size: 'md',
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const dragIndex = ref<number | null>(null);
/** Index where the item would be inserted */
const insertAt = ref<number | null>(null);
let dragGhost: HTMLElement | null = null;

function onDragStart(index: number, e: DragEvent) {
  if (props.disabled) return;
  dragIndex.value = index;

  // Build ghost clone -- must be visible briefly so browser can paint it for
  // setDragImage. The drag now starts from the handle, so walk up to the full
  // row element to clone the whole row (not just the handle) for the ghost.
  const handle = e.currentTarget as HTMLElement;
  const row = (handle.closest('[data-drag-row]') as HTMLElement | null) ?? handle;
  dragGhost = row.cloneNode(true) as HTMLElement;
  Object.assign(dragGhost.style, {
    position: 'absolute',
    top: '0px',
    left: '-9999px',
    width: `${row.offsetWidth}px`,
    opacity: '0.9',
    background: 'var(--sd-bg)',
    borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(255,140,66,0.2)',
    border: '1.5px solid var(--sd-orange)',
    pointerEvents: 'none',
    zIndex: '-1',
  });
  document.body.appendChild(dragGhost);
  // Force browser to paint the ghost before setDragImage captures it
  dragGhost.getBoundingClientRect();

  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(dragGhost, e.offsetX, e.offsetY);
    e.dataTransfer.setData('text/plain', String(index));
  }
}

function onDragOver(index: number, e: DragEvent) {
  if (props.disabled || dragIndex.value === null) return;
  e.preventDefault();

  // Determine if cursor is in top or bottom half of the row
  const row = e.currentTarget as HTMLElement;
  const rect = row.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  const above = e.clientY < midY;

  // insertAt = the index the item would be placed at
  if (above) {
    insertAt.value = index;
  } else {
    insertAt.value = index + 1;
  }
}

function onDragLeave(e: DragEvent) {
  // Only clear if leaving the list entirely (not moving between children)
  const related = e.relatedTarget as HTMLElement | null;
  const list = listEl.value;
  if (list && related && list.contains(related)) return;
  insertAt.value = null;
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  if (props.disabled || dragIndex.value === null || insertAt.value === null) {
    resetDrag();
    return;
  }

  let targetIndex = insertAt.value;
  // Adjust target if dragging downward (source removal shifts indices)
  if (targetIndex > dragIndex.value) {
    targetIndex--;
  }
  if (targetIndex === dragIndex.value) {
    resetDrag();
    return;
  }

  const items = [...props.modelValue];
  const [moved] = items.splice(dragIndex.value, 1);
  items.splice(targetIndex, 0, moved);
  emit('update:modelValue', items);
  resetDrag();
}

function onDragEnd() {
  resetDrag();
}

function resetDrag() {
  dragIndex.value = null;
  insertAt.value = null;
  if (dragGhost) {
    dragGhost.remove();
    dragGhost = null;
  }
}

// Touch drag support
const touchDragIndex = ref<number | null>(null);
const listEl = ref<HTMLElement | null>(null);

function onTouchStart(index: number) {
  if (props.disabled) return;
  touchDragIndex.value = index;
  dragIndex.value = index;
}

function onTouchMove(e: TouchEvent) {
  if (touchDragIndex.value === null || !listEl.value) return;
  e.preventDefault();
  const y = e.touches[0].clientY;

  const children = listEl.value.children;
  for (let i = 0; i < children.length; i++) {
    const rect = children[i].getBoundingClientRect();
    if (y >= rect.top && y <= rect.bottom) {
      const midY = rect.top + rect.height / 2;
      insertAt.value = y < midY ? i : i + 1;
      break;
    }
  }
}

function onTouchEnd() {
  if (touchDragIndex.value !== null && insertAt.value !== null) {
    let targetIndex = insertAt.value;
    if (targetIndex > touchDragIndex.value) targetIndex--;
    if (targetIndex !== touchDragIndex.value) {
      const items = [...props.modelValue];
      const [moved] = items.splice(touchDragIndex.value, 1);
      items.splice(targetIndex, 0, moved);
      emit('update:modelValue', items);
    }
  }
  touchDragIndex.value = null;
  dragIndex.value = null;
  insertAt.value = null;
}

/** Check if the purple insert line should show above this row */
function showLineAbove(index: number): boolean {
  if (insertAt.value === null || dragIndex.value === null) return false;
  // Don't show line adjacent to the dragged item's original position
  if (insertAt.value === dragIndex.value || insertAt.value === dragIndex.value + 1) return false;
  return insertAt.value === index;
}

/** Check if the purple insert line should show below the last row */
function showLineAfterLast(): boolean {
  if (insertAt.value === null || dragIndex.value === null) return false;
  if (insertAt.value === dragIndex.value || insertAt.value === dragIndex.value + 1) return false;
  return insertAt.value === props.modelValue.length;
}

const rowClasses: Record<DraggableListSize, string> = {
  sm: 'py-2 px-3 text-[13px]',
  md: 'py-2.5 px-4 text-sm',
  touch: 'py-3.5 px-5 text-base',
};

const handleClasses: Record<DraggableListSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-[18px] h-[18px]',
  touch: 'w-5 h-5',
};
</script>

<template>
  <div
    ref="listEl"
    class="relative"
    :class="disabled ? 'opacity-50' : ''"
    @touchmove.passive="false"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @drop="onDrop"
  >
    <template
      v-for="(item, index) in modelValue"
      :key="item"
    >
      <!-- Insert line above -->
      <div
        v-if="showLineAbove(index)"
        class="sd-insert-line"
      />

      <!-- Divider (except first) -->
      <div
        v-if="index > 0 && !showLineAbove(index)"
        class="h-px bg-sd-border"
      />

      <div
        data-drag-row
        class="flex items-center gap-3 bg-white transition-opacity duration-100"
        :class="[
          rowClasses[size],
          disabled ? 'cursor-not-allowed' : '',
          dragIndex === index ? 'opacity-25' : '',
        ]"
        @dragover="onDragOver(index, $event)"
        @dragleave="onDragLeave"
      >
        <!-- Drag handle — the only grabbable region, so interactive content in
             the row slot (inputs, selects, buttons) stays fully usable. -->
        <div
          :draggable="!disabled"
          class="shrink-0 select-none touch-none flex"
          :class="!disabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'"
          @dragstart="onDragStart(index, $event)"
          @dragend="onDragEnd"
          @touchstart="onTouchStart(index)"
        >
          <svg
            :class="handleClasses[size]"
            class="text-sd-text-muted block"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <circle
              cx="5"
              cy="3"
              r="1.25"
            />
            <circle
              cx="11"
              cy="3"
              r="1.25"
            />
            <circle
              cx="5"
              cy="8"
              r="1.25"
            />
            <circle
              cx="11"
              cy="8"
              r="1.25"
            />
            <circle
              cx="5"
              cy="13"
              r="1.25"
            />
            <circle
              cx="11"
              cy="13"
              r="1.25"
            />
          </svg>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <slot
            :item="item"
            :index="index"
          >
            <span class="text-sd-text font-medium">{{ item }}</span>
          </slot>
        </div>
      </div>
    </template>

    <!-- Insert line after last -->
    <div
      v-if="showLineAfterLast()"
      class="sd-insert-line"
    />
  </div>
</template>

<style scoped>
.sd-insert-line {
  height: 2px;
  background: var(--sd-orange);
  border-radius: 1px;
  position: relative;
  z-index: 1;
  box-shadow: 0 0 6px rgba(255, 140, 66, 0.4);
}
</style>
