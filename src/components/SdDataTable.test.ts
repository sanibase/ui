// @vitest-environment jsdom
// ---------------------------------------------------------------------------
// SdDataTable row expansion, mounted. What is asserted here only exists at
// render time: which rows carry an expander, what the expansion draws and in
// which cells, and the open-rows map the table hands back. jsdom has no layout
// engine, so the rule that makes child rows share the table's columns
// (`display: contents` on PrimeVue's carrier row) is asserted at the source.
// ---------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick, type PropType, ref } from 'vue';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import PrimeVue from 'primevue/config';
import Column from 'primevue/column';
import SdDataTable from './SdDataTable.vue';
import type { SdExpandedRows, SdTableRow } from './datatable-expansion';

const source = readFileSync(resolve(process.cwd(), 'src/components/SdDataTable.vue'), 'utf8');

const DAYS: SdTableRow[] = [
  { key: 'd1', kind: 'day', date: 'Fr 05.09.', gross: '3619.50', sessions: [{ key: 's1', n: 1, gross: '973.50' }, { key: 's2', n: 2, gross: '2646.00' }] },
  { key: 'd2', kind: 'day', date: 'Sa 06.09.', gross: '1300.50', sessions: [{ key: 's3', n: 1, gross: '1300.50' }] },
];

const columns = (): ReturnType<typeof h>[] => [
  h(Column, { header: 'Datum' }, {
    body: ({ data }: { data: SdTableRow }) =>
      h('span', { class: 'cell-date' }, data['kind'] === 'session' ? `Sitzung ${String(data['n'])}` : String(data['date'])),
  }),
  h(Column, { field: 'gross', header: 'Brutto', 'body-style': 'text-align: right' }),
];

const sessionsOf = (row: SdTableRow): SdTableRow[] =>
  (row['sessions'] as SdTableRow[]).map((s) => ({ ...s, kind: 'session' }));
const severalSessions = (row: SdTableRow): boolean => (row['sessions'] as unknown[]).length > 1;

/** A host holding the open rows the way a page does, with v-model. */
const Host = defineComponent({
  props: {
    rowsMode: { type: Boolean, default: true },
    onRowClick: { type: Boolean, default: false },
    expander: { type: String as PropType<'start' | 'end' | 'none'>, default: 'start' },
  },
  setup(props) {
    const open = ref<SdExpandedRows>({});
    const seen: SdExpandedRows[] = [];
    return { open, seen, render: () => h(SdDataTable, {
      value: DAYS,
      dataKey: 'key',
      expandedRows: open.value,
      'onUpdate:expandedRows': (next: SdExpandedRows) => {
        seen.push(next);
        open.value = next;
      },
      expansionRows: props.rowsMode ? sessionsOf : undefined,
      rowExpandable: severalSessions,
      expandOnRowClick: props.onRowClick,
      expander: props.expander,
      expandLabel: 'Sitzungen zeigen',
      collapseLabel: 'Sitzungen ausblenden',
    }, props.rowsMode
      ? { default: columns }
      : {
          default: columns,
          expansion: ({ data }: { data: SdTableRow }) => h('p', { class: 'block-body' }, `Inhalt ${String(data['date'])}`),
        }) };
  },
  render() {
    return this.render();
  },
});

const mountHost = (props: Record<string, unknown> = {}) =>
  mount(Host, { props, global: { plugins: [PrimeVue] }, attachTo: document.body });

describe('SdDataTable row expansion', () => {
  it('draws an expander only on a row that can open, closed, named by the host', () => {
    const w = mountHost();
    const buttons = w.findAll('button.sd-datatable-expander');
    expect(buttons).toHaveLength(1);
    const b = buttons[0]!;
    expect(b.attributes('type')).toBe('button');
    expect(b.attributes('aria-expanded')).toBe('false');
    expect(b.attributes('aria-label')).toBe('Sitzungen zeigen');
    expect(w.findAll('thead th')).toHaveLength(3);
    expect(w.findAll('.sd-datatable-subrow')).toHaveLength(0);
    w.unmount();
  });

  it('opens a row into child rows in the table\'s own columns, through the same body templates', async () => {
    const w = mountHost();
    await w.get('button.sd-datatable-expander').trigger('click');
    await nextTick();
    expect((w.vm as unknown as { seen: SdExpandedRows[] }).seen).toEqual([{ d1: true }]);
    const subrows = w.findAll('tr.sd-datatable-subrow');
    expect(subrows).toHaveLength(2);
    for (const r of subrows) expect(r.findAll('td')).toHaveLength(3);
    expect(subrows.map((r) => r.get('.cell-date').text())).toEqual(['Sitzung 1', 'Sitzung 2']);
    const gross = subrows[0]!.findAll('td')[2]!;
    expect(gross.text()).toBe('973.50');
    expect(gross.attributes('style')).toContain('text-align: right');
    // The carrier PrimeVue draws is presentational, so the child rows are the rows.
    const carrier = w.get('tr.p-datatable-row-expansion');
    expect(carrier.attributes('role')).toBe('presentation');
    expect(carrier.get('td').attributes('role')).toBe('presentation');
    expect(w.get('.sd-datatable').classes()).toContain('sd-datatable--expansion-rows');
    const button = w.get('button.sd-datatable-expander');
    expect(button.attributes('aria-expanded')).toBe('true');
    expect(button.attributes('aria-label')).toBe('Sitzungen ausblenden');
    expect(w.findAll('tr.sd-datatable-row-expanded')).toHaveLength(1);
    w.unmount();
  });

  it('closes again from the same button, and the map loses the key', async () => {
    const w = mountHost();
    await w.get('button.sd-datatable-expander').trigger('click');
    await w.get('button.sd-datatable-expander').trigger('click');
    await nextTick();
    expect((w.vm as unknown as { seen: SdExpandedRows[] }).seen.at(-1)).toEqual({});
    expect(w.findAll('.sd-datatable-subrow')).toHaveLength(0);
    w.unmount();
  });

  it('is reachable from the keyboard: the expander is a native button in the tab order', () => {
    const w = mountHost();
    const el = w.get('button.sd-datatable-expander').element as HTMLButtonElement;
    expect(el.tagName).toBe('BUTTON');
    expect(el.getAttribute('tabindex')).toBeNull();
    el.focus();
    expect(document.activeElement).toBe(el);
    w.unmount();
  });

  it('opens on a click anywhere on the row when asked, and only a row that can open', async () => {
    const w = mountHost({ onRowClick: true });
    const rows = w.findAll('tbody > tr');
    expect(rows[0]!.classes()).toContain('sd-datatable-row-clickable');
    expect(rows[1]!.classes()).not.toContain('sd-datatable-row-clickable');
    await rows[1]!.findAll('td')[1]!.trigger('click');
    expect((w.vm as unknown as { seen: SdExpandedRows[] }).seen).toEqual([]);
    await rows[0]!.findAll('td')[1]!.trigger('click');
    await nextTick();
    expect((w.vm as unknown as { seen: SdExpandedRows[] }).seen).toEqual([{ d1: true }]);
    expect(w.findAll('.sd-datatable-subrow')).toHaveLength(2);
    w.unmount();
  });

  it('a click on the expander itself toggles once, not twice', async () => {
    const w = mountHost({ onRowClick: true });
    await w.get('button.sd-datatable-expander').trigger('click');
    await nextTick();
    expect((w.vm as unknown as { seen: SdExpandedRows[] }).seen).toEqual([{ d1: true }]);
    w.unmount();
  });

  it('puts the expander last, or leaves it to the host', () => {
    const end = mountHost({ expander: 'end' });
    const cells = end.findAll('tbody > tr')[0]!.findAll('td');
    expect(cells.at(-1)!.find('button.sd-datatable-expander').exists()).toBe(true);
    end.unmount();
    const none = mountHost({ expander: 'none' });
    expect(none.findAll('button.sd-datatable-expander')).toHaveLength(0);
    expect(none.findAll('thead th')).toHaveLength(2);
    none.unmount();
  });

  it('without expansionRows, the #expansion slot draws one cell across the table', async () => {
    const w = mountHost({ rowsMode: false });
    await w.get('button.sd-datatable-expander').trigger('click');
    await nextTick();
    const carrier = w.get('tr.p-datatable-row-expansion');
    expect(carrier.attributes('role')).toBe('row');
    const td = carrier.get('td');
    expect(td.attributes('colspan')).toBe('3');
    expect(td.get('.block-body').text()).toBe('Inhalt Fr 05.09.');
    expect(w.get('.sd-datatable').classes()).not.toContain('sd-datatable--expansion-rows');
    w.unmount();
  });

  it('keeps its own open rows when the host does not bind them', async () => {
    const w = mount(SdDataTable, {
      props: { value: DAYS, dataKey: 'key', expansionRows: sessionsOf },
      slots: { default: columns },
      global: { plugins: [PrimeVue] },
    });
    expect(w.findAll('button.sd-datatable-expander')).toHaveLength(2);
    await w.findAll('button.sd-datatable-expander')[1]!.trigger('click');
    await nextTick();
    expect(w.findAll('.sd-datatable-subrow')).toHaveLength(1);
    expect(w.emitted('update:expandedRows')).toEqual([[{ d2: true }]]);
    expect(w.emitted('row-expand')?.[0]?.[0]).toEqual({ data: DAYS[1] });
    w.unmount();
  });

  it('opens a row the host opens itself, also by setting a key on the map it bound', async () => {
    const open = ref<SdExpandedRows>({});
    const w = mount(
      () => h(SdDataTable, { value: DAYS, dataKey: 'key', expandedRows: open.value, expansionRows: sessionsOf }, { default: columns }),
      { global: { plugins: [PrimeVue] } },
    );
    open.value['d2'] = true;
    await nextTick();
    await nextTick();
    expect(w.findAll('.sd-datatable-subrow')).toHaveLength(1);
    open.value = {};
    await nextTick();
    await nextTick();
    expect(w.findAll('.sd-datatable-subrow')).toHaveLength(0);
    w.unmount();
  });

  it('a table without expansion is drawn as before: no expander column', () => {
    const w = mount(SdDataTable, {
      props: { value: DAYS, dataKey: 'key' },
      slots: { default: columns },
      global: { plugins: [PrimeVue] },
    });
    expect(w.findAll('thead th')).toHaveLength(2);
    expect(w.findAll('button.sd-datatable-expander')).toHaveLength(0);
    expect(w.findAll('tbody > tr')[0]!.classes()).not.toContain('sd-datatable-row-expandable');
    w.unmount();
  });
});

describe('SdDataTable row expansion stylesheet', () => {
  function block(selector: string): string {
    const at = source.indexOf(selector);
    expect(at, `${selector} is missing from the stylesheet`).toBeGreaterThan(-1);
    return source.slice(at, source.indexOf('}', at));
  }

  it('takes the carrier row and cell out of the layout in rows mode', () => {
    expect(block('.sd-datatable--expansion-rows .p-datatable-tbody > tr.p-datatable-row-expansion > td')).toContain('display: contents');
  });

  it('draws with the sanibase tokens, and shows keyboard focus', () => {
    expect(block('.sd-datatable .sd-datatable-expander:focus-visible')).toContain('outline: 2px solid var(--sd-purple)');
    expect(block('.sd-datatable .sd-datatable-subrow > td')).toContain('var(--sd-purple-subtle)');
    expect(block('.sd-datatable .sd-datatable-expander {')).toContain('color: var(--sd-purple)');
  });
});

describe('SdDataTable height', () => {
  // PrimeVue writes scrollHeight as the container's max-height whether or not
  // the table is `scrollable`, next to its own inline `overflow: auto`. That
  // pair is the 400px box every table sits in unless its host says otherwise.
  const MANY: SdTableRow[] = Array.from({ length: 50 }, (_, i) => ({ key: `r${i}`, gross: `${i}.00` }));
  const container = (props: Record<string, unknown> = {}) => {
    const w = mount(SdDataTable, {
      props: { value: MANY, ...props },
      slots: { default: () => [h(Column, { field: 'gross', header: 'Brutto' })] },
      global: { plugins: [PrimeVue] },
    });
    const el = w.get('.p-datatable-table-container').element as HTMLElement;
    return { w, style: el.style };
  };

  it('caps a table at 400px and scrolls inside by default, as it always has', () => {
    const { w, style } = container();
    expect(style.maxHeight).toBe('400px');
    expect(style.overflow).toBe('auto');
    w.unmount();
  });

  it('caps it at any CSS length the host passes', () => {
    const { w, style } = container({ scrollHeight: '60vh' });
    expect(style.maxHeight).toBe('60vh');
    w.unmount();
  });

  it('grows with its rows under scroll-height="none", so the page scrolls instead', () => {
    const { w, style } = container({ scrollHeight: 'none' });
    expect(style.maxHeight).toBe('none');
    expect(w.findAll('tbody > tr')).toHaveLength(50);
    w.unmount();
  });
});
