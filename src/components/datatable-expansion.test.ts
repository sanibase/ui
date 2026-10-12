import { describe, expect, it } from 'vitest';
import { createCommentVNode, Fragment, h } from 'vue';
import Column from 'primevue/column';
import {
  bodyColumns,
  isRowExpanded,
  resolveField,
  rowKey,
  toggleRowExpansion,
  vnodeProp,
} from './datatable-expansion';

describe('the open rows map', () => {
  const row = { id: 7, name: 'Fr 05.09.' };

  it('opens a closed row and closes an open one, deleting its key rather than storing false', () => {
    const opened = toggleRowExpansion({}, row, 'id');
    expect(opened).toEqual({ rows: { '7': true }, expanded: true });
    const closed = toggleRowExpansion(opened.rows, row, 'id');
    expect(closed).toEqual({ rows: {}, expanded: false });
    expect('7' in closed.rows).toBe(false);
  });

  it('never mutates the map it was given', () => {
    const before = { '3': true } as Record<string, boolean>;
    toggleRowExpansion(before, row, 'id');
    expect(before).toEqual({ '3': true });
  });

  it('reads a row as open by the presence of its key, as PrimeVue does', () => {
    expect(isRowExpanded({ '7': true }, row, 'id')).toBe(true);
    expect(isRowExpanded({}, row, 'id')).toBe(false);
    expect(isRowExpanded(undefined, row, 'id')).toBe(false);
  });

  it('leaves a row without a key alone, and never calls it open', () => {
    expect(toggleRowExpansion({}, { name: 'x' }, 'id')).toEqual({ rows: {}, expanded: false });
    expect(toggleRowExpansion({}, row, undefined)).toEqual({ rows: {}, expanded: false });
    expect(isRowExpanded({ undefined: true }, { name: 'x' }, 'id')).toBe(false);
  });

  it('resolves a dotted key and a key that contains a dot', () => {
    expect(rowKey({ day: { date: '2026-09-05' } }, 'day.date')).toBe('2026-09-05');
    expect(rowKey({ 'day.date': 'flat' }, 'day.date')).toBe('flat');
    expect(resolveField({ a: null }, 'a.b')).toBeUndefined();
    expect(rowKey({ id: 0 }, 'id')).toBe('0');
  });
});

describe('the columns an expansion row lines up with', () => {
  it('walks fragments and keeps every Column in order, as PrimeVue finds them', () => {
    const a = h(Column, { field: 'a' });
    const b = h(Column, { field: 'b', 'body-style': 'text-align: right' });
    const c = h(Column, { field: 'c' });
    const tree = [a, createCommentVNode('v-if'), h(Fragment, [b, h('span'), h(Fragment, [c])])];
    expect(bodyColumns(tree)).toEqual([a, b, c]);
    expect(vnodeProp(b, 'bodyStyle')).toBe('text-align: right');
  });

  it('leaves a hidden column out, as PrimeVue does', () => {
    const shown = h(Column, { field: 'a' });
    const hidden = h(Column, { field: 'b', hidden: true });
    const bare = h(Column, { field: 'c', hidden: '' });
    expect(bodyColumns([shown, hidden, bare])).toEqual([shown]);
  });

  it('has nothing to walk when there is no slot', () => {
    expect(bodyColumns(undefined)).toEqual([]);
  });
});
