// @vitest-environment jsdom
// ---------------------------------------------------------------------------
// The kit pieces of the admin UI rules (ADMIN-UI-RULES R0 to R10, SaniDesk
// 2026-11-13): SdIconButton, SdMenu, SdSegmented, SdChip, SdBackLink, SdFab,
// and the close X's name on SdModal / SdDetailPanel / SdBottomSheet.
//
// jsdom applies no stylesheet, so the phone sizes are asserted against the
// component source, as SdModal.test.ts does for its hit area. A mount proves
// the names, the roles and the behaviour.
// ---------------------------------------------------------------------------

import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { defineComponent, h, markRaw } from 'vue';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import SdIconButton from './SdIconButton.vue';
import SdMenu, { type SdMenuItem } from './SdMenu.vue';
import SdSegmented from './SdSegmented.vue';
import SdChip from './SdChip.vue';
import SdBackLink from './SdBackLink.vue';
import SdFab from './SdFab.vue';
import SdModal from './SdModal.vue';
import SdDetailPanel from './SdDetailPanel.vue';
import SdBottomSheet from './SdBottomSheet.vue';

const src = (name: string): string => readFileSync(resolve(process.cwd(), `src/components/${name}`), 'utf8');

let mounted: VueWrapper[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each spec mounts a different component
function track<T extends VueWrapper<any>>(w: T): T {
  mounted.push(w);
  return w;
}
afterEach(() => {
  for (const w of mounted) w.unmount();
  mounted = [];
  document.body.innerHTML = '';
});

const Icon = markRaw(defineComponent({ render: () => h('svg', { 'data-icon': '' }) }));

/** The phone block of a component's stylesheet. */
function phoneBlock(source: string): string {
  const at = source.indexOf('@media (max-width: 639.98px)');
  expect(at, 'phone media block missing').toBeGreaterThan(-1);
  return source.slice(at);
}

describe('SdIconButton (R0)', () => {
  it('carries its label as aria-label and as the hover hint', () => {
    const w = track(mount(SdIconButton, { props: { label: 'Klein entfernen' }, slots: { default: () => h(Icon) } }));
    const b = w.get('button');
    expect(b.attributes('aria-label')).toBe('Klein entfernen');
    expect(b.attributes('title')).toBe('Klein entfernen');
    expect(b.classes()).toContain('sd-icon-btn');
  });

  it('takes a separate hint and draws the danger outline when asked', () => {
    const w = track(mount(SdIconButton, {
      props: { label: 'Klein entfernen', hint: 'Grösse Klein entfernen', variant: 'danger-outline' },
      slots: { default: () => h(Icon) },
    }));
    expect(w.get('button').attributes('title')).toBe('Grösse Klein entfernen');
    expect(w.get('button').classes()).toContain('text-sd-error');
  });

  it('is 32px on a wide screen and 44px on a phone, as real CSS', () => {
    const s = src('SdIconButton.vue');
    expect(s).toMatch(/\.sd-btn\.sd-icon-btn \{\s*width: 32px;\s*height: 32px;/);
    const phone = phoneBlock(s);
    expect(phone).toMatch(/width: 44px;\s*height: 44px;/);
    expect(phone).toMatch(/width: 20px;\s*height: 20px;/);
  });
});

describe('SdMenu (R7)', () => {
  const items: SdMenuItem[] = [
    { key: 'delete', label: 'Löschen', icon: Icon, danger: true },
    { key: 'edit', label: 'Bearbeiten', icon: Icon },
    { key: 'move', label: 'In andere Kategorie', icon: Icon, children: [{ key: 'cat-1', label: 'Pizza' }] },
    { key: 'hide', label: 'Auf der Kasse verstecken', toggle: true, checked: true },
  ];

  const open = async (w: VueWrapper) => {
    await w.get('button').trigger('click');
    await w.vm.$nextTick();
  };
  const menu = () => document.body.querySelector<HTMLElement>('[role="menu"]');
  const labels = () => Array.from(menu()!.querySelectorAll('[data-sd-menu-item]')).map((b) => b.textContent!.trim());

  it('names its trigger and opens on click', async () => {
    const w = track(mount(SdMenu, { props: { items, label: 'Aktionen für Margherita' }, attachTo: document.body }));
    const trig = w.get('button');
    expect(trig.attributes('aria-label')).toBe('Aktionen für Margherita');
    expect(trig.attributes('aria-haspopup')).toBe('menu');
    expect(menu()).toBeNull();
    await open(w);
    expect(menu()).not.toBeNull();
    expect(trig.attributes('aria-expanded')).toBe('true');
  });

  it('puts a danger item last, red, after a divider, whatever the order given', async () => {
    const w = track(mount(SdMenu, { props: { items, label: 'Aktionen' }, attachTo: document.body }));
    await open(w);
    expect(labels()).toEqual(['Bearbeiten', 'In andere Kategorie', 'Auf der Kasse verstecken', 'Löschen']);
    const last = Array.from(menu()!.querySelectorAll<HTMLElement>('[data-sd-menu-item]')).pop()!;
    expect(last.className).toContain('text-sd-error');
    expect(last.previousElementSibling?.tagName).toBe('HR');
  });

  it('emits select with the key and closes', async () => {
    const w = track(mount(SdMenu, { props: { items, label: 'Aktionen' }, attachTo: document.body }));
    await open(w);
    (menu()!.querySelector('[data-sd-menu-item]') as HTMLElement).click();
    await w.vm.$nextTick();
    expect(w.emitted('select')![0]![0]).toBe('edit');
    expect(menu()).toBeNull();
  });

  it('keeps a toggle item open and reports it as a checkbox', async () => {
    const w = track(mount(SdMenu, { props: { items, label: 'Aktionen' }, attachTo: document.body }));
    await open(w);
    const toggle = Array.from(menu()!.querySelectorAll<HTMLElement>('[data-sd-menu-item]'))[2]!;
    expect(toggle.getAttribute('role')).toBe('menuitemcheckbox');
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    toggle.click();
    await w.vm.$nextTick();
    expect(w.emitted('select')![0]![0]).toBe('hide');
    expect(menu()).not.toBeNull();
  });

  it('opens a second page for an item with children and comes back', async () => {
    const w = track(mount(SdMenu, { props: { items, label: 'Aktionen' }, attachTo: document.body }));
    await open(w);
    Array.from(menu()!.querySelectorAll<HTMLElement>('[data-sd-menu-item]'))[1]!.click();
    await w.vm.$nextTick();
    expect(labels()).toEqual(['In andere Kategorie', 'Pizza']);
    Array.from(menu()!.querySelectorAll<HTMLElement>('[data-sd-menu-item]'))[1]!.click();
    await w.vm.$nextTick();
    expect(w.emitted('select')![0]![0]).toBe('cat-1');
  });

  it('closes on Escape and on a press outside', async () => {
    const w = track(mount(SdMenu, { props: { items, label: 'Aktionen' }, attachTo: document.body }));
    await open(w);
    menu()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await w.vm.$nextTick();
    expect(menu()).toBeNull();
    await open(w);
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await w.vm.$nextTick();
    expect(menu()).toBeNull();
  });

  it('does not let the trigger click reach the row behind it', async () => {
    let rowClicks = 0;
    const Row = defineComponent({
      render: () => h('div', { onClick: () => { rowClicks++; } }, [h(SdMenu, { items, label: 'Aktionen' })]),
    });
    const w = track(mount(Row, { attachTo: document.body }));
    await w.get('button').trigger('click');
    expect(rowClicks).toBe(0);
  });

  it('draws its items 44px high on a phone', () => {
    expect(phoneBlock(src('SdMenu.vue'))).toContain('min-height: 44px');
  });
});

describe('SdSegmented (R10.1)', () => {
  const options = [
    { value: 'off', label: 'Aus' },
    { value: 'takeaway', label: 'Takeaway' },
    { value: 'here', label: 'Vor Ort', disabled: true },
  ];

  it('is a named radio group; the chosen one is purple, never orange', () => {
    const w = track(mount(SdSegmented, { props: { modelValue: 'takeaway', options, label: 'Bestellen' } }));
    expect(w.get('[role="radiogroup"]').attributes('aria-label')).toBe('Bestellen');
    const radios = w.findAll('[role="radio"]');
    expect(radios[1]!.attributes('aria-checked')).toBe('true');
    expect(radios[1]!.classes()).toContain('bg-sd-purple');
    expect(w.html()).not.toContain('sd-orange');
  });

  it('emits the value picked, not a disabled one', async () => {
    const w = track(mount(SdSegmented, { props: { modelValue: 'takeaway', options, label: 'Bestellen' } }));
    const radios = w.findAll('[role="radio"]');
    await radios[0]!.trigger('click');
    await radios[2]!.trigger('click');
    expect(w.emitted('update:modelValue')).toEqual([['off']]);
  });

  it('is 36px on a wide screen and 44px on a phone', () => {
    const s = src('SdSegmented.vue');
    expect(s).toMatch(/\.sd-segment \{\s*height: 34px;/); // + 2px of the group's border
    expect(phoneBlock(s)).toContain('height: 42px');
  });
});

describe('SdChip (R10.2)', () => {
  it('selected = purple with a tick; not selected = grey outline', () => {
    const on = track(mount(SdChip, { props: { selected: true, label: 'Gluten' } }));
    expect(on.get('button').classes()).toContain('bg-sd-purple');
    expect(on.get('button').attributes('aria-pressed')).toBe('true');
    expect(on.find('svg').exists()).toBe(true);
    const off = track(mount(SdChip, { props: { selected: false, label: 'Gluten' } }));
    expect(off.get('button').classes()).toContain('border-sd-gray');
    expect(off.find('svg').exists()).toBe(false);
    expect(on.html() + off.html()).not.toContain('sd-orange');
  });

  it('flips through v-model:selected', async () => {
    const w = track(mount(SdChip, { props: { selected: false, label: 'Gluten' } }));
    await w.get('button').trigger('click');
    expect(w.emitted('update:selected')).toEqual([[true]]);
  });

  it('is 36px on a wide screen and 44px on a phone', () => {
    const s = src('SdChip.vue');
    expect(s).toMatch(/\.sd-chip \{\s*height: 36px;/);
    expect(phoneBlock(s)).toContain('height: 44px');
  });
});

describe('SdBackLink (R6.1)', () => {
  it('shows the parent name, is named in full, and wears the grey outline', () => {
    const w = track(mount(SdBackLink, { props: { label: 'Katalog', hint: 'Zurück zu Katalog' }, attrs: { href: '/katalog' } }));
    const a = w.get('a');
    expect(a.attributes('href')).toBe('/katalog');
    expect(a.attributes('aria-label')).toBe('Zurück zu Katalog');
    expect(a.attributes('title')).toBe('Zurück zu Katalog');
    expect(a.text()).toBe('Katalog');
    expect(a.classes()).toContain('sd-btn-neutral-outline');
  });

  it('is a button without a link, and renders a router link when given one', async () => {
    const b = track(mount(SdBackLink, { props: { label: 'Liste', hint: 'Zurück zur Liste' } }));
    expect(b.get('button').attributes('type')).toBe('button');
    const Fake = defineComponent({ props: { to: { type: String, required: true } }, setup: (p, { slots }) => () => h('a', { href: p.to, 'data-router': '' }, slots.default?.()) });
    const r = track(mount(SdBackLink, { props: { label: 'Katalog', hint: 'Zurück zu Katalog', as: markRaw(Fake) }, attrs: { to: '/katalog' } }));
    expect(r.get('a[data-router]').attributes('href')).toBe('/katalog');
  });

  it('drops the words on a phone and grows to 44px', () => {
    const phone = phoneBlock(src('SdBackLink.vue'));
    expect(phone).toMatch(/width: 44px;\s*height: 44px;/);
    expect(phone).toMatch(/\.sd-back-link-label \{\s*display: none;/);
  });
});

describe('SdFab (R2.1)', () => {
  it('is named, and draws only on a phone', () => {
    const w = track(mount(SdFab, { props: { label: 'Gericht erfassen' } }));
    expect(w.get('button').attributes('aria-label')).toBe('Gericht erfassen');
    const s = src('SdFab.vue');
    expect(s).toMatch(/\.sd-fab \{\s*display: none;/);
    expect(phoneBlock(s)).toMatch(/width: 56px;\s*height: 56px;/);
  });
});

describe('the kit close X is named (R5.1)', () => {
  it('SdModal: "Close" by default, the host\'s word when given', () => {
    track(mount(SdModal, { props: { open: true, title: 'T' }, attachTo: document.body }));
    expect(document.querySelector('.sd-modal-close')!.getAttribute('aria-label')).toBe('Close');
    document.body.innerHTML = '';
    track(mount(SdModal, { props: { open: true, title: 'T', closeLabel: 'Schliessen' }, attachTo: document.body }));
    const x = document.querySelector('.sd-modal-close')!;
    expect(x.getAttribute('aria-label')).toBe('Schliessen');
    expect(x.getAttribute('title')).toBe('Schliessen');
  });

  it('SdDetailPanel and SdBottomSheet take closeLabel too', () => {
    track(mount(SdDetailPanel, { props: { open: true, title: 'T', closeLabel: 'Schliessen' }, attachTo: document.body }));
    expect(document.querySelector('button[aria-label="Schliessen"]')).not.toBeNull();
    document.body.innerHTML = '';
    track(mount(SdBottomSheet, { props: { open: true, title: 'T', closeLabel: 'Schliessen' }, attachTo: document.body }));
    expect(document.querySelector('button[aria-label="Schliessen"]')).not.toBeNull();
  });
});
