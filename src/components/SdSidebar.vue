<script setup lang="ts">
import { PhCaretDown } from '@phosphor-icons/vue';
import { ref, watch } from 'vue';
import type { Component } from 'vue';

export interface SidebarItem {
  key: string;
  label: string;
  icon?: Component;
  badge?: string | number;
  active?: boolean;
  disabled?: boolean;
}

export interface SidebarGroup {
  key: string;
  label?: string;
  collapsible?: boolean;
  items: SidebarItem[];
}

export interface SdSidebarProps {
  groups: SidebarGroup[];
  /** Currently active item key */
  activeKey?: string;
  /** Whether the sidebar is in collapsed (icon-only) mode */
  collapsed?: boolean;
}

const props = withDefaults(defineProps<SdSidebarProps>(), {
  activeKey: '',
  collapsed: false,
});

const emit = defineEmits<{
  'item-click': [item: SidebarItem];
}>();

// Track which collapsible groups are open
const openGroups = ref<Set<string>>(new Set(
  props.groups.filter(g => !g.collapsible || g.items.some(i => i.key === props.activeKey)).map(g => g.key)
));

watch(() => props.activeKey, (key) => {
  // Auto-open group containing active item
  for (const g of props.groups) {
    if (g.items.some(i => i.key === key)) {
      openGroups.value.add(g.key);
    }
  }
});

function toggleGroup(key: string) {
  const next = new Set(openGroups.value);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  openGroups.value = next;
}

function isGroupOpen(key: string): boolean {
  return openGroups.value.has(key);
}
</script>

<template>
  <nav class="flex flex-col py-2">
    <div
      v-for="group in groups"
      :key="group.key"
      class="mb-1"
    >
      <!-- Group header (if labeled and collapsible) -->
      <button
        v-if="group.label && group.collapsible && !collapsed"
        type="button"
        class="w-full flex items-center justify-between px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-sd-text-muted hover:text-sd-text transition-colors"
        @click="toggleGroup(group.key)"
      >
        {{ group.label }}
        <PhCaretDown
          :size="12"
          weight="bold"
          class="transition-transform duration-200"
          :class="isGroupOpen(group.key) ? 'rotate-180' : ''"
        />
      </button>

      <!-- Group label (non-collapsible) -->
      <div
        v-else-if="group.label && !collapsed"
        class="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-sd-text-muted"
      >
        {{ group.label }}
      </div>

      <!-- Items -->
      <div
        v-if="!group.collapsible || isGroupOpen(group.key)"
        class="space-y-0.5 px-2"
      >
        <button
          v-for="item in group.items"
          :key="item.key"
          type="button"
          class="w-full flex items-center gap-2.5 rounded-sd-sm transition-colors text-left"
          :class="[
            collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
            item.key === activeKey
              ? 'bg-sd-purple-light text-sd-purple font-semibold'
              : item.disabled
                ? 'text-sd-text-muted opacity-50 cursor-not-allowed'
                : 'text-sd-text-secondary hover:bg-sd-purple-subtle hover:text-sd-text',
          ]"
          :disabled="item.disabled"
          :title="collapsed ? item.label : undefined"
          @click="!item.disabled && emit('item-click', item)"
        >
          <component
            :is="item.icon"
            v-if="item.icon"
            :size="collapsed ? 22 : 18"
            :weight="item.key === activeKey ? 'fill' : 'regular'"
            class="shrink-0"
          />
          <span
            v-if="!collapsed"
            class="text-sm truncate flex-1"
          >
            {{ item.label }}
          </span>
          <span
            v-if="item.badge != null && !collapsed"
            class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold shrink-0"
            :class="item.key === activeKey ? 'bg-sd-purple text-white' : 'bg-sd-bg-alt text-sd-text-muted'"
          >
            {{ item.badge }}
          </span>
        </button>
      </div>
    </div>
  </nav>
</template>
