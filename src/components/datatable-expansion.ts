// ---------------------------------------------------------------------------
// SdDataTable row expansion: the pure part.
//
// PrimeVue's DataTable keeps the open rows in `expandedRows`. With a `dataKey`
// that is a map from the row's key to `true`, and a row counts as open while
// its key is present at all (PrimeVue tests `!== undefined`), so collapsing a
// row must delete its key rather than store `false`. Everything here keeps to
// that shape so the map SdDataTable emits is the map PrimeVue reads.
//
// The columns: PrimeVue finds its Column children by walking the default slot's
// vnodes, flattening fragments and keeping every vnode whose component is named
// "Column" (HelperSet in @primevue/core). `bodyColumns` walks them the same
// way, so the expansion rows SdDataTable draws line up with the cells PrimeVue
// draws, column for column.
// ---------------------------------------------------------------------------

import type { VNode } from 'vue';

/** The open rows: each open row's `dataKey` value, mapped to `true`. */
export type SdExpandedRows = Record<string, boolean>;

/** A table row as SdDataTable takes it. */
export type SdTableRow = Record<string, unknown>;

/** Read a field, `a.b.c` style, the way PrimeVue resolves `dataKey` and `field`. */
export function resolveField(row: unknown, path: string | undefined): unknown {
  if (row == null || !path) return undefined;
  if (typeof row === 'object' && path in (row as Record<string, unknown>)) {
    return (row as Record<string, unknown>)[path];
  }
  let value: unknown = row;
  for (const part of path.split('.')) {
    if (value == null || typeof value !== 'object') return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

/** The key a row is kept under, or null when the row has none. */
export function rowKey(row: SdTableRow, dataKey: string | undefined): string | null {
  const key = resolveField(row, dataKey);
  return key === undefined || key === null ? null : String(key);
}

/** Whether a row is open. A row without a key is never open. */
export function isRowExpanded(
  expanded: SdExpandedRows | null | undefined,
  row: SdTableRow,
  dataKey: string | undefined,
): boolean {
  const key = rowKey(row, dataKey);
  return key !== null && !!expanded && expanded[key] !== undefined;
}

/**
 * Open a closed row or close an open one. Returns a new map (the old one is
 * never mutated, so a deep watcher and a `v-model` both see the change) and
 * whether the row is now open. A row without a key is left alone.
 */
export function toggleRowExpansion(
  expanded: SdExpandedRows | null | undefined,
  row: SdTableRow,
  dataKey: string | undefined,
): { rows: SdExpandedRows; expanded: boolean } {
  const next: SdExpandedRows = { ...(expanded ?? {}) };
  const key = rowKey(row, dataKey);
  if (key === null) return { rows: next, expanded: false };
  if (next[key] !== undefined) {
    delete next[key];
    return { rows: next, expanded: false };
  }
  next[key] = true;
  return { rows: next, expanded: true };
}

/** A vnode prop, whichever way the template spelled it (`bodyStyle` or `body-style`). */
export function vnodeProp(vnode: VNode, name: string): unknown {
  const props = (vnode.props ?? {}) as Record<string, unknown>;
  if (props[name] !== undefined) return props[name];
  const kebab = name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  return props[kebab];
}

/** The columns PrimeVue would draw, in order: hidden ones and anything else left out. */
export function bodyColumns(children: VNode[] | null | undefined): VNode[] {
  const out: VNode[] = [];
  for (const child of children ?? []) {
    if (Array.isArray(child.children)) {
      out.push(...bodyColumns(child.children as VNode[]));
      continue;
    }
    const type = child.type as { name?: string } | symbol | string | null;
    if (type && typeof type === 'object' && type.name === 'Column') {
      const hidden = vnodeProp(child, 'hidden');
      if (hidden === true || hidden === '') continue;
      out.push(child);
    }
  }
  return out;
}
