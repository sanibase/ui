<script setup lang="ts">
import DataTable from 'primevue/datatable';

export interface SdDataTableProps {
  value: Record<string, unknown>[];
  loading?: boolean;
  paginator?: boolean;
  rows?: number;
  sortField?: string;
  sortOrder?: 1 | -1;
  stripedRows?: boolean;
  scrollable?: boolean;
  scrollHeight?: string;
  emptyMessage?: string;
}

withDefaults(defineProps<SdDataTableProps>(), {
  loading: false,
  paginator: false,
  rows: 20,
  stripedRows: false,
  scrollable: false,
  scrollHeight: '400px',
  emptyMessage: 'No data here.',
});

defineEmits<{
  'row-click': [event: { data: Record<string, unknown> }];
}>();
</script>

<template>
  <div class="sd-datatable">
    <DataTable
      :value="value"
      :loading="loading"
      :paginator="paginator"
      :rows="rows"
      :always-show-paginator="false"
      :sort-field="sortField"
      :sort-order="sortOrder"
      :striped-rows="stripedRows"
      :scrollable="scrollable"
      :scroll-height="scrollHeight"
      removable-sort
      @row-click="$emit('row-click', $event)"
    >
      <slot />
      <template #empty>
        <div
          v-if="!loading"
          class="text-center py-10 text-sd-text-muted text-sm"
        >
          {{ emptyMessage }}
        </div>
      </template>
      <template #loading>
        <div class="text-center py-10 text-sd-orange text-sm flex items-center justify-center gap-2">
          <svg
            class="animate-spin w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="3"
              class="opacity-20"
            />
            <path
              d="M12 2a10 10 0 019.95 9"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
            />
          </svg>
          Loading...
        </div>
      </template>
    </DataTable>
  </div>
</template>

<style>
.sd-datatable .p-datatable {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  border: 1px solid var(--sd-border);
  border-radius: 8px;
  overflow: hidden;
}
.sd-datatable .p-datatable-header-cell {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem 1rem;
  color: var(--sd-text-muted);
  background: var(--sd-bg-alt);
  border-bottom: 1px solid var(--sd-border);
}
/* Body cells — PrimeVue sets border-bottom on td via .p-datatable-tbody > tr > td
   so we override on td (not tr) using the .sd-datatable ancestor for specificity. */
.sd-datatable .p-datatable-tbody > tr > td {
  font-size: 14px;
  padding: 0.75rem 1rem;
  color: var(--sd-text);
  vertical-align: middle;
  border-bottom-color: var(--sd-border);
}
.sd-datatable .p-datatable-tbody > tr:last-child > td {
  border-bottom-width: 0;
}
.sd-datatable .p-datatable-row-toggle-button {
  color: var(--sd-purple);
}
.sd-datatable .p-datatable-tbody > tr:hover {
  background: var(--sd-purple-subtle) !important;
}
.sd-datatable .p-datatable-sort-icon {
  color: var(--sd-purple);
}
/* Paginator — specificity uses .sd-datatable .p-paginator prefix to beat
   PrimeVue's compound selectors (e.g. :not(.p-disabled):not(.p-paginator-page-selected):hover)
   without needing !important. CSS layers (cssLayer in nuxt.config) provide
   a second layer of protection. */
.sd-datatable .p-datatable-paginator-bottom {
  outline: none;
  border: none;
}
.sd-datatable .p-paginator {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 0.75rem 1rem;
  gap: 0.25rem;
  border-top: 1px solid var(--sd-border);
  background: transparent;
  border-radius: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
.sd-datatable .p-paginator .p-paginator-content {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.sd-datatable .p-paginator .p-paginator-first,
.sd-datatable .p-paginator .p-paginator-prev,
.sd-datatable .p-paginator .p-paginator-next,
.sd-datatable .p-paginator .p-paginator-last {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--sd-text-muted);
  cursor: pointer;
  padding: 0;
  margin: 0;
  font-family: inherit;
  transition: background 0.15s, color 0.15s;
}
.sd-datatable .p-paginator .p-paginator-first:hover,
.sd-datatable .p-paginator .p-paginator-prev:hover,
.sd-datatable .p-paginator .p-paginator-next:hover,
.sd-datatable .p-paginator .p-paginator-last:hover {
  background: var(--sd-purple-subtle);
  color: var(--sd-purple);
}
.sd-datatable .p-paginator .p-paginator-first:focus-visible,
.sd-datatable .p-paginator .p-paginator-prev:focus-visible,
.sd-datatable .p-paginator .p-paginator-next:focus-visible,
.sd-datatable .p-paginator .p-paginator-last:focus-visible {
  outline: 2px solid var(--sd-purple);
  outline-offset: 2px;
  box-shadow: none;
}
.sd-datatable .p-paginator .p-paginator-first.p-disabled,
.sd-datatable .p-paginator .p-paginator-prev.p-disabled,
.sd-datatable .p-paginator .p-paginator-next.p-disabled,
.sd-datatable .p-paginator .p-paginator-last.p-disabled {
  opacity: 0.35;
  cursor: default;
  pointer-events: none;
  background: transparent;
  color: var(--sd-text-muted);
}
.sd-datatable .p-paginator .p-paginator-pages {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.sd-datatable .p-paginator .p-paginator-page {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.25rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--sd-text-secondary);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.sd-datatable .p-paginator .p-paginator-page:hover {
  background: var(--sd-purple-subtle);
  color: var(--sd-purple);
}
.sd-datatable .p-paginator .p-paginator-page:focus-visible {
  outline: 2px solid var(--sd-purple);
  outline-offset: 2px;
  box-shadow: none;
}
.sd-datatable .p-paginator .p-paginator-page.p-paginator-page-selected {
  background: var(--sd-purple);
  color: var(--sd-bg);
}
.sd-datatable .p-paginator .p-paginator-page.p-paginator-page-selected:hover {
  background: var(--sd-purple-dark);
  color: var(--sd-bg);
}
/* Loading */
.sd-datatable .p-datatable-loading-icon {
  width: 2rem;
  height: 2rem;
  color: var(--sd-purple);
}
.sd-datatable .p-datatable-mask {
  background: rgba(255, 255, 255, 0.7);
  top: auto !important;
}
.sd-datatable .p-datatable-thead {
  position: relative;
  z-index: 2;
}
.sd-datatable .p-datatable-loading .p-datatable-header-cell {
  opacity: 1 !important;
}
/* Empty message */
.sd-datatable .p-datatable-empty-message td {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--sd-text-muted);
  font-size: 14px;
}
</style>
