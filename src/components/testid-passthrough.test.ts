// @vitest-environment jsdom
// ---------------------------------------------------------------------------
// Test ids reach the DOM.
//
// The windows (SdModal, SdBottomSheet, SdDetailPanel, SdConfirmDialog) render a
// <Teleport to="body"> as their root, and Vue drops fallthrough attributes on a
// Teleport root, so a `data-testid` on the tag used to vanish. They now bind
// `$attrs` on the visible panel. The panel is outside the wrapper's element, so
// every window assertion queries `document.body`.
//
// SdSidebar entries and SdTabs tabs take an optional `testid` on the item and
// render it on the item's button; an item without one renders no attribute.
// ---------------------------------------------------------------------------

import { afterEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import SdModal from './SdModal.vue';
import SdBottomSheet from './SdBottomSheet.vue';
import SdDetailPanel from './SdDetailPanel.vue';
import SdConfirmDialog from './SdConfirmDialog.vue';
import SdSidebar from './SdSidebar.vue';
import SdTabs from './SdTabs.vue';

let w: ReturnType<typeof mount> | null = null;
afterEach(() => {
  w?.unmount();
  w = null;
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

function byTestid(id: string): HTMLElement | null {
  return document.body.querySelector<HTMLElement>(`[data-testid="${id}"]`);
}

describe('windows pass their attributes to the visible panel', () => {
  it('SdModal: data-testid lands on the dialog box, not the backdrop', () => {
    w = mount(SdModal, {
      props: { open: true, title: 'Titel' },
      attrs: { 'data-testid': 'x' },
      slots: { default: '<p class="body-probe">Inhalt</p>' },
    });
    const box = byTestid('x');
    expect(box).not.toBeNull();
    // The box holds the title and the slot; the backdrop is an ancestor (test
    // utils wrap each <Transition> in a stub element, so not the direct parent).
    expect(box!.querySelector('h2')!.textContent).toContain('Titel');
    expect(box!.querySelector('.body-probe')).not.toBeNull();
    expect(box!.className).toContain('bg-white');
    const backdrop = box!.parentElement!.closest<HTMLElement>('.bg-black\\/40');
    expect(backdrop).not.toBeNull();
    expect(backdrop!.hasAttribute('data-testid')).toBe(false);
  });

  it('SdModal: other attributes and a class reach the box too', () => {
    w = mount(SdModal, {
      props: { open: true, title: 'Titel', size: 'lg' },
      attrs: { 'aria-describedby': 'hint', class: 'extra-class' },
    });
    const box = document.body.querySelector<HTMLElement>('[aria-describedby="hint"]');
    expect(box).not.toBeNull();
    expect(box!.className).toContain('extra-class');
    // Its own classes are kept.
    expect(box!.className).toContain('max-w-[720px]');
  });

  it('SdModal: closed, nothing is rendered', () => {
    w = mount(SdModal, { props: { open: false }, attrs: { 'data-testid': 'x' } });
    expect(byTestid('x')).toBeNull();
  });

  it('SdModal: no attributes, no stray ones', () => {
    w = mount(SdModal, { props: { open: true, title: 'Titel' } });
    expect(document.body.querySelector('[data-testid]')).toBeNull();
  });

  it('SdBottomSheet: data-testid lands on the sheet panel', () => {
    w = mount(SdBottomSheet, {
      props: { open: true, title: 'Blatt', panelClass: 'customer-shell' },
      attrs: { 'data-testid': 'sheet' },
    });
    const panel = byTestid('sheet');
    expect(panel).not.toBeNull();
    expect(panel!.className).toContain('sd-sheet-panel');
    // panelClass is still applied next to the attributes.
    expect(panel!.className).toContain('customer-shell');
    expect(document.body.querySelectorAll('[data-testid="sheet"]')).toHaveLength(1);
  });

  it('SdDetailPanel: data-testid lands on the side panel, not the backdrop', () => {
    w = mount(SdDetailPanel, {
      props: { open: true, title: 'Detail' },
      attrs: { 'data-testid': 'panel' },
    });
    const panel = byTestid('panel');
    expect(panel).not.toBeNull();
    expect(panel!.className).toContain('right-0');
    expect(panel!.querySelector('h2')!.textContent).toContain('Detail');
    expect(document.body.querySelectorAll('[data-testid="panel"]')).toHaveLength(1);
  });

  it('SdConfirmDialog: data-testid reaches the dialog box of its SdModal', () => {
    w = mount(SdConfirmDialog, {
      props: { open: true, title: 'Löschen?', message: 'Sicher?' },
      attrs: { 'data-testid': 'confirm' },
    });
    const box = byTestid('confirm');
    expect(box).not.toBeNull();
    expect(box!.textContent).toContain('Sicher?');
    expect(box!.querySelectorAll('.sd-modal-footer button')).toHaveLength(2);
  });
});

describe('SdSidebar entry testid', () => {
  it('renders item.testid on the entry button, and nothing for an entry without one', () => {
    w = mount(SdSidebar, {
      props: {
        groups: [
          {
            key: 'g',
            items: [
              { key: 'orders', label: 'Bestellungen', testid: 'nav-orders' },
              { key: 'plain', label: 'Ohne' },
            ],
          },
        ],
      },
    });
    const entry = w.find('[data-testid="nav-orders"]');
    expect(entry.exists()).toBe(true);
    expect(entry.element.tagName).toBe('BUTTON');
    expect(entry.text()).toContain('Bestellungen');
    expect(w.findAll('[data-testid]')).toHaveLength(1);
  });

  it('still emits item-click from an entry that carries a testid', async () => {
    const item = { key: 'orders', label: 'Bestellungen', testid: 'nav-orders' };
    w = mount(SdSidebar, { props: { groups: [{ key: 'g', items: [item] }] } });
    await w.find('[data-testid="nav-orders"]').trigger('click');
    expect(w.emitted('item-click')).toEqual([[item]]);
  });
});

describe('SdTabs tab testid', () => {
  it('renders tab.testid on the tab button, and nothing for a tab without one', async () => {
    w = mount(SdTabs, {
      props: {
        modelValue: 'a',
        tabs: [
          { label: 'Karte', value: 'a' },
          { label: 'Einstellungen', value: 'b', testid: 'menu-tab-settings' },
        ],
      },
    });
    const tab = w.find('[data-testid="menu-tab-settings"]');
    expect(tab.exists()).toBe(true);
    expect(tab.element.tagName).toBe('BUTTON');
    expect(tab.text()).toContain('Einstellungen');
    expect(w.findAll('[data-testid]')).toHaveLength(1);
    await tab.trigger('click');
    expect(w.emitted('update:modelValue')).toEqual([['b']]);
  });
});
