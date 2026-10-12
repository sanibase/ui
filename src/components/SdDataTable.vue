<script setup lang="ts">
import { type Component, computed, ref, type StyleValue, type TdHTMLAttributes, useSlots, type VNode, watch } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { PhCaretRight } from '@phosphor-icons/vue';
import {
  bodyColumns,
  isRowExpanded,
  resolveField,
  rowKey,
  type SdExpandedRows,
  type SdTableRow,
  toggleRowExpansion,
  vnodeProp,
} from './datatable-expansion';

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
  /**
   * The field that identifies a row. Row expansion needs it: the open rows are
   * kept as a map from this field's value to `true`.
   */
  dataKey?: string;
  /**
   * The open rows (`v-model:expanded-rows`), keyed by `dataKey`. Leave it
   * unbound and the table keeps its own.
   */
  expandedRows?: SdExpandedRows;
  /**
   * Draws an expanded row's children as rows of their own in the table's
   * columns: each child goes through the same column `#body` templates as a
   * row of `value`. Without it, the `#expansion` slot draws one full-width cell.
   */
  expansionRows?: (row: SdTableRow) => SdTableRow[];
  /** Which rows can open. Every row, when not given. */
  rowExpandable?: (row: SdTableRow) => boolean;
  /** Where the expander column sits; `none` leaves the toggle to the host. */
  expander?: 'start' | 'end' | 'none';
  /** A click anywhere on an expandable row opens or closes it too. */
  expandOnRowClick?: boolean;
  /** The expander button's accessible name while the row is closed. */
  expandLabel?: string;
  /** The expander button's accessible name while the row is open. */
  collapseLabel?: string;
}

const props = withDefaults(defineProps<SdDataTableProps>(), {
  loading: false,
  paginator: false,
  rows: 20,
  stripedRows: false,
  scrollable: false,
  scrollHeight: '400px',
  emptyMessage: 'No data here.',
  dataKey: undefined,
  expandedRows: undefined,
  expansionRows: undefined,
  rowExpandable: undefined,
  expander: 'start',
  expandOnRowClick: false,
  expandLabel: 'Expand row',
  collapseLabel: 'Collapse row',
});

const emit = defineEmits<{
  'row-click': [event: { data: Record<string, unknown> }];
  'update:expandedRows': [rows: SdExpandedRows];
  'row-expand': [event: { data: Record<string, unknown> }];
  'row-collapse': [event: { data: Record<string, unknown> }];
}>();

defineSlots<{
  default?: () => VNode[];
  /** An open row's content, in one cell across the whole table. */
  expansion?: (props: { data: SdTableRow; index: number }) => VNode[];
}>();

const slots = useSlots();

/** Bound or not: the table mirrors the host's map and keeps its own when unbound. */
const open = ref<SdExpandedRows>({ ...(props.expandedRows ?? {}) });
watch(
  () => props.expandedRows,
  (next) => {
    open.value = { ...(next ?? {}) };
  },
  // Deep, so a host that sets a key on the map it bound, rather than handing
  // over a new map, still opens the row.
  { deep: true },
);

const rowsMode = computed(() => typeof props.expansionRows === 'function');
const hasExpansion = computed(() => rowsMode.value || !!slots.expansion);
const expanderAt = computed(() => (hasExpansion.value ? props.expander : 'none'));

/** The order of the table's columns: the host's, with the expander before or after them. */
const parts = computed<('expander' | 'columns')[]>(() => {
  if (expanderAt.value === 'start') return ['expander', 'columns'];
  if (expanderAt.value === 'end') return ['columns', 'expander'];
  return ['columns'];
});

function canExpand(row: SdTableRow): boolean {
  if (!hasExpansion.value || rowKey(row, props.dataKey) === null) return false;
  return props.rowExpandable ? props.rowExpandable(row) : true;
}

function isOpen(row: SdTableRow): boolean {
  return canExpand(row) && isRowExpanded(open.value, row, props.dataKey);
}

function toggle(row: SdTableRow): void {
  if (!canExpand(row)) return;
  const { rows, expanded } = toggleRowExpansion(open.value, row, props.dataKey);
  open.value = rows;
  emit('update:expandedRows', rows);
  if (expanded) emit('row-expand', { data: row });
  else emit('row-collapse', { data: row });
}

function onRowClick(event: { data: Record<string, unknown> }): void {
  emit('row-click', event);
  if (props.expandOnRowClick) toggle(event.data);
}

function rowClass(row: SdTableRow): Record<string, boolean> {
  if (!hasExpansion.value) return {};
  const expandable = canExpand(row);
  return {
    'sd-datatable-row-expandable': expandable,
    'sd-datatable-row-clickable': expandable && props.expandOnRowClick,
    'sd-datatable-row-expanded': expandable && isOpen(row),
  };
}

/**
 * PrimeVue draws an open row as one `<tr>` holding one full-width `<td>`. In
 * rows mode that pair is only a carrier: it is taken out of the layout
 * (`display: contents`, in the stylesheet) and out of the accessibility tree,
 * so the child rows inside it sit in the table's own columns.
 */
const passThrough = computed(() =>
  rowsMode.value
    ? { rowExpansion: { role: 'presentation' }, rowExpansionCell: { role: 'presentation' } }
    : undefined,
);

/** What an expansion row draws, cell by cell: the expander's empty cell, then each column. */
type SubCell = { kind: 'expander' } | { kind: 'column'; column: VNode };

function subCells(): SubCell[] {
  const columns: SubCell[] = bodyColumns(slots.default?.()).map((column) => ({ kind: 'column', column }));
  if (expanderAt.value === 'start') return [{ kind: 'expander' }, ...columns];
  if (expanderAt.value === 'end') return [...columns, { kind: 'expander' }];
  return columns;
}

function childRows(row: SdTableRow): SdTableRow[] {
  return props.expansionRows ? props.expansionRows(row) : [];
}

function childKey(child: SdTableRow, index: number): string {
  return rowKey(child, props.dataKey) ?? String(index);
}

/** The column's `#body` template. A slot is a function, which `<component :is>` renders. */
function bodyOf(column: VNode): Component | undefined {
  const children = column.children as Record<string, unknown> | null;
  const body = children && typeof children === 'object' && !Array.isArray(children) ? children['body'] : undefined;
  return typeof body === 'function' ? (body as Component) : undefined;
}

function cellText(child: SdTableRow, column: VNode): string {
  const value = resolveField(child, vnodeProp(column, 'field') as string | undefined);
  return value === undefined || value === null ? '' : String(value);
}

function cellStyle(column: VNode): StyleValue {
  return [vnodeProp(column, 'bodyStyle'), vnodeProp(column, 'style')] as StyleValue;
}

function cellClass(column: VNode): TdHTMLAttributes['class'] {
  return [vnodeProp(column, 'bodyClass'), vnodeProp(column, 'class')] as TdHTMLAttributes['class'];
}
</script>

<template>
  <div
    class="sd-datatable"
    :class="{ 'sd-datatable--expansion-rows': rowsMode }"
  >
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
      :data-key="dataKey"
      :expanded-rows="hasExpansion ? open : undefined"
      :row-class="rowClass"
      :pt="passThrough"
      removable-sort
      @row-click="onRowClick"
    >
      <template
        v-for="part in parts"
        :key="part"
      >
        <slot v-if="part === 'columns'" />
        <Column
          v-else
          header-class="sd-datatable-expander-cell"
          body-class="sd-datatable-expander-cell"
        >
          <template #body="{ data: row }">
            <button
              v-if="canExpand(row)"
              type="button"
              class="sd-datatable-expander"
              :aria-expanded="isOpen(row)"
              :aria-label="isOpen(row) ? collapseLabel : expandLabel"
              @click.stop="toggle(row)"
            >
              <PhCaretRight
                :size="16"
                weight="bold"
                class="sd-datatable-expander-icon"
              />
            </button>
          </template>
        </Column>
      </template>
      <template
        v-if="hasExpansion"
        #expansion="{ data: parent, index }"
      >
        <template v-if="rowsMode">
          <tr
            v-for="(child, i) in childRows(parent)"
            :key="childKey(child, i)"
            class="sd-datatable-subrow"
          >
            <template
              v-for="(cell, c) in subCells()"
              :key="c"
            >
              <td
                v-if="cell.kind === 'expander'"
                class="sd-datatable-expander-cell"
              />
              <td
                v-else
                :class="cellClass(cell.column)"
                :style="cellStyle(cell.column)"
              >
                <component
                  :is="bodyOf(cell.column)"
                  v-if="bodyOf(cell.column)"
                  :data="child"
                  :column="cell.column"
                  :field="vnodeProp(cell.column, 'field')"
                  :index="i"
                />
                <template v-else>
                  {{ cellText(child, cell.column) }}
                </template>
              </td>
            </template>
          </tr>
        </template>
        <slot
          v-else
          name="expansion"
          :data="parent"
          :index="index"
        />
      </template>
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
/* Row expansion. The expander is a real <button>, so Tab reaches it and Enter
   or Space opens the row; the caret turns a quarter when the row is open. */
.sd-datatable .p-datatable-header-cell.sd-datatable-expander-cell,
.sd-datatable .p-datatable-tbody td.sd-datatable-expander-cell {
  width: 2.75rem;
  padding-right: 0;
}
.sd-datatable .sd-datatable-expander {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  margin: -0.25rem 0;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--sd-purple);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.sd-datatable .sd-datatable-expander:hover {
  background: var(--sd-purple-light);
  color: var(--sd-purple-dark);
}
.sd-datatable .sd-datatable-expander:focus-visible {
  outline: 2px solid var(--sd-purple);
  outline-offset: 2px;
}
.sd-datatable .sd-datatable-expander-icon {
  transition: transform 0.15s;
}
.sd-datatable .sd-datatable-expander[aria-expanded='true'] .sd-datatable-expander-icon {
  transform: rotate(90deg);
}
@media (prefers-reduced-motion: reduce) {
  .sd-datatable .sd-datatable-expander-icon {
    transition: none;
  }
}
.sd-datatable .p-datatable-tbody > tr.sd-datatable-row-clickable {
  cursor: pointer;
}
/* An open row and what it opened share the purple wash, so they read as one. */
.sd-datatable .p-datatable-tbody > tr.sd-datatable-row-expanded > td,
.sd-datatable .p-datatable-tbody > tr.p-datatable-row-expansion > td {
  background: var(--sd-purple-subtle);
}
/* Rows mode: PrimeVue's expansion <tr> and its one full-width <td> are only a
   carrier. display: contents takes both out of the layout, so the child rows
   inside become rows of the table body and share its column widths. */
.sd-datatable--expansion-rows .p-datatable-tbody > tr.p-datatable-row-expansion,
.sd-datatable--expansion-rows .p-datatable-tbody > tr.p-datatable-row-expansion > td {
  display: contents;
}
.sd-datatable .sd-datatable-subrow > td {
  font-size: 13px;
  padding: 0.45rem 1rem;
  color: var(--sd-text);
  vertical-align: middle;
  text-align: start;
  background: var(--sd-purple-subtle);
  border-style: solid;
  border-width: 0 0 1px 0;
  border-color: var(--sd-border);
}
.sd-datatable .p-datatable-tbody > tr.p-datatable-row-expansion:last-child .sd-datatable-subrow:last-child > td {
  border-bottom-width: 0;
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
