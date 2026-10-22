// @vitest-environment jsdom
// ---------------------------------------------------------------------------
// SdSelect's two consumer hooks:
//
//   - the `#option` slot renders each option row's content (a brand logo in
//     front of the label, say) with `{ option, selected, highlighted }`, and
//     clicking or keyboard-picking a slotted row still selects it. Without the
//     slot a row is its label, exactly as before;
//   - the `#value` slot renders the trigger of a single select with a value;
//     the placeholder is never slotted;
//   - `searchPlaceholder` sets the search box placeholder, `Search...` by
//     default;
//   - `emptyMessage` is the line an empty list shows (a search that matches
//     nothing, or no options), `No results` by default.
//
// The panel is mounted in place (`teleport: false`) so it can be found under
// the wrapper.
// ---------------------------------------------------------------------------

import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { h } from 'vue';
import SdSelect, { type SelectOption, type SelectOptionSlotProps } from './SdSelect.vue';

Element.prototype.scrollIntoView ??= () => {};

const options: SelectOption[] = [
  { label: 'Instagram', value: 'instagram' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'TikTok', value: 'tiktok', disabled: true },
  { label: 'YouTube', value: 'youtube' },
];

let mounted: VueWrapper[] = [];
afterEach(() => {
  for (const w of mounted) w.unmount();
  mounted = [];
});

function mountSelect(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
  const wrapper = mount(SdSelect, {
    props: { options, teleport: false, ...props },
    slots,
    attachTo: document.body,
  });
  mounted.push(wrapper);
  return wrapper;
}

const optionSlot = (p: SelectOptionSlotProps) =>
  h('span', {
    class: 'custom',
    'data-value': String(p.option.value),
    'data-selected': String(p.selected),
    'data-highlighted': String(p.highlighted),
  }, [h('i', { class: 'logo' }), p.option.label]);

describe('SdSelect #option slot', () => {
  it('renders the label alone when no slot is given', async () => {
    const wrapper = mountSelect();
    await wrapper.find('button').trigger('click');
    const rows = wrapper.findAll('[role="option"]');
    expect(rows.map((r) => r.text())).toEqual(['Instagram', 'Facebook', 'TikTok', 'YouTube']);
    expect(rows[0].element.children.length).toBe(0);
  });

  it('renders the slot per option with option, selected and highlighted', async () => {
    const wrapper = mountSelect({ modelValue: 'facebook' }, { option: optionSlot });
    await wrapper.find('button').trigger('click');
    const custom = wrapper.findAll('[role="option"] .custom');
    expect(custom.map((c) => c.attributes('data-value'))).toEqual([
      'instagram',
      'facebook',
      'tiktok',
      'youtube',
    ]);
    expect(custom.every((c) => c.find('.logo').exists())).toBe(true);
    expect(custom.map((c) => c.attributes('data-selected'))).toEqual(['false', 'true', 'false', 'false']);
    expect(custom.map((c) => c.attributes('data-highlighted'))).toEqual(['false', 'false', 'false', 'false']);

    await wrapper.trigger('keydown', { key: 'ArrowDown' });
    await wrapper.trigger('keydown', { key: 'ArrowDown' });
    const after = wrapper.findAll('[role="option"] .custom');
    expect(after.map((c) => c.attributes('data-highlighted'))).toEqual(['false', 'true', 'false', 'false']);
  });

  it('still selects a slotted row by click', async () => {
    const wrapper = mountSelect({}, { option: optionSlot });
    await wrapper.find('button').trigger('click');
    await wrapper.findAll('[role="option"] .custom')[3].trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['youtube']]);
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
  });

  it('still selects a slotted row by keyboard, skipping the disabled one', async () => {
    const wrapper = mountSelect({}, { option: optionSlot });
    await wrapper.trigger('keydown', { key: 'ArrowDown' });
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true);
    for (let i = 0; i < 3; i++) await wrapper.trigger('keydown', { key: 'ArrowDown' });
    await wrapper.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('update:modelValue')).toEqual([['youtube']]);
  });

  it('keeps the multi-select checkbox in front of the slotted content', async () => {
    const wrapper = mountSelect({ multiple: true, modelValue: ['instagram'] }, { option: optionSlot });
    await wrapper.find('button').trigger('click');
    const row = wrapper.findAll('[role="option"]')[0];
    expect(row.element.firstElementChild?.tagName.toLowerCase()).toBe('svg');
    expect(row.find('.custom').attributes('data-selected')).toBe('true');
    await row.find('.custom').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[[]]]);
  });

  it('renders the slot in grouped lists too', async () => {
    const grouped = options.map((o, i) => ({ ...o, group: i < 2 ? 'Social' : 'Video' }));
    const wrapper = mountSelect({ options: grouped }, { option: optionSlot });
    await wrapper.find('button').trigger('click');
    expect(wrapper.findAll('[role="option"] .custom')).toHaveLength(4);
  });
});

describe('SdSelect #value slot', () => {
  const valueSlot = (p: { option: SelectOption }) => h('b', { class: 'picked' }, `* ${p.option.label}`);

  it('renders the selected option in the trigger', () => {
    const wrapper = mountSelect({ modelValue: 'facebook' }, { value: valueSlot });
    expect(wrapper.find('button .picked').text()).toBe('* Facebook');
  });

  it('shows the plain placeholder when nothing is selected', () => {
    const wrapper = mountSelect({ placeholder: 'Pick one' }, { value: valueSlot });
    expect(wrapper.find('button .picked').exists()).toBe(false);
    expect(wrapper.find('button').text()).toBe('Pick one');
  });

  it('shows the label when no slot is given', () => {
    const wrapper = mountSelect({ modelValue: 'youtube' });
    expect(wrapper.find('button').text()).toBe('YouTube');
  });
});

describe('SdSelect searchPlaceholder', () => {
  it('defaults to "Search..."', async () => {
    const wrapper = mountSelect({ searchable: true });
    await wrapper.find('button').trigger('click');
    expect(wrapper.find('input[type="text"]').attributes('placeholder')).toBe('Search...');
  });

  it('takes a custom placeholder', async () => {
    const wrapper = mountSelect({ searchable: true, searchPlaceholder: 'Plattform suchen' });
    await wrapper.find('button').trigger('click');
    expect(wrapper.find('input[type="text"]').attributes('placeholder')).toBe('Plattform suchen');
  });
});

describe('SdSelect emptyMessage', () => {
  const emptyRow = (wrapper: VueWrapper) =>
    wrapper.findAll('[role="listbox"] > li').filter((li) => li.attributes('role') !== 'option');

  it('says "No results" by default when a search matches nothing', async () => {
    const wrapper = mountSelect({ searchable: true });
    await wrapper.find('button').trigger('click');
    await wrapper.find('input[type="text"]').setValue('zzz');
    expect(wrapper.findAll('[role="option"]')).toHaveLength(0);
    expect(emptyRow(wrapper).map((li) => li.text())).toEqual(['No results']);
  });

  it('renders the host\'s text instead', async () => {
    const wrapper = mountSelect({ searchable: true, emptyMessage: 'Keine Treffer' });
    await wrapper.find('button').trigger('click');
    await wrapper.find('input[type="text"]').setValue('zzz');
    expect(emptyRow(wrapper).map((li) => li.text())).toEqual(['Keine Treffer']);
    expect(wrapper.text()).not.toContain('No results');
  });

  it('is the same line for a list with no options at all', async () => {
    const wrapper = mountSelect({ options: [], emptyMessage: 'Keine Treffer' });
    await wrapper.find('button').trigger('click');
    expect(emptyRow(wrapper).map((li) => li.text())).toEqual(['Keine Treffer']);
  });

  it('is not shown while a search still matches', async () => {
    const wrapper = mountSelect({ searchable: true, emptyMessage: 'Keine Treffer' });
    await wrapper.find('button').trigger('click');
    await wrapper.find('input[type="text"]').setValue('insta');
    expect(wrapper.findAll('[role="option"]')).toHaveLength(1);
    expect(emptyRow(wrapper)).toHaveLength(0);
  });
});
