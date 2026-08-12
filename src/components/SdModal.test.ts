// @vitest-environment jsdom
// ---------------------------------------------------------------------------
// The close control is the subject here. jsdom has no layout engine, so the
// 44px hit area cannot be measured; it is asserted at the source, the way
// css-variables.test.ts asserts the token stylesheet. What a mount *can* prove
// is that the control carries the class those rules hang off, and that the
// close paths still behave.
// ---------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import SdModal from './SdModal.vue';

// Resolved from the project root rather than import.meta.url: under the jsdom
// environment import.meta.url is an http: URL and fileURLToPath rejects it.
const source = readFileSync(resolve(process.cwd(), 'src/components/SdModal.vue'), 'utf8');

const LONG_TITLE =
  'Nachricht an buchhaltung.debitoren.rechnungswesen@sehr-lange-firmendomain.example.com weiterleiten';

/**
 * The dialog is teleported to <body>, so it is outside the wrapper's own
 * element and `wrapper.find()` never sees it, so a `find(...).exists()` check
 * against this component passes vacuously. Query the document instead.
 */
function closeButton(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.sd-modal-close');
}

function block(selector: string): string {
  const at = source.indexOf(`${selector} {`);
  expect(at, `${selector} is missing from the stylesheet`).toBeGreaterThan(-1);
  return source.slice(at, source.indexOf('}', at));
}

describe('SdModal close control', () => {
  it('ships its sizing as real CSS, not as utility classes', () => {
    // The dialog teleports to <body>, so it carries no consuming component's
    // scope id and a consumer cannot reach it. These rules have to be in
    // dist/ui.css, and they have to be here to get there.
    const base = block('.sd-modal-close');
    expect(base).toContain('flex-shrink: 0');
    expect(base).toContain('width: 32px');
    expect(base).toContain('height: 32px');
    expect(base).toContain('position: relative');

    const hit = block('.sd-modal-close::after');
    expect(hit).toContain('width: 44px');
    expect(hit).toContain('height: 44px');
    expect(hit).toContain("content: ''");
  });

  it('does not size the button with flex-shrinkable utility classes', () => {
    const w = mount(SdModal, { props: { open: true, title: 'Titel' } });
    const btn = closeButton();
    expect(btn).not.toBeNull();
    // w-8/h-8 sit in the same cascade layer as any flex-shrink a consumer's
    // build happens to emit. The class list must not carry them.
    expect(btn!.className).not.toMatch(/\bw-8\b|\bh-8\b/);
    w.unmount();
  });

  it('keeps the control mounted and unsqueezed under a title with no spaces', () => {
    const w = mount(SdModal, { props: { open: true, title: LONG_TITLE } });
    expect(closeButton()).not.toBeNull();
    const heading = document.querySelector('h2')!;
    // The title yields instead: it may wrap and it may break a long token.
    expect(heading.className).toContain('min-w-0');
    expect(heading.className).toContain('break-words');
    w.unmount();
  });

  it('emits update:open when the control is clicked', async () => {
    const w = mount(SdModal, { props: { open: true, title: 'Titel' } });
    closeButton()!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await w.vm.$nextTick();
    expect(w.emitted('update:open')).toEqual([[false]]);
    w.unmount();
  });

  it('omits the control when closable is false, and ignores Escape', async () => {
    const w = mount(SdModal, { props: { open: true, title: 'Titel', closable: false } });
    expect(closeButton()).toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await w.vm.$nextTick();
    expect(w.emitted('update:open')).toBeUndefined();
    w.unmount();
  });

  it('closes on Escape, and not on the backdrop when persistent', async () => {
    const w = mount(SdModal, { props: { open: true, title: 'Titel' } });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await w.vm.$nextTick();
    expect(w.emitted('update:open')).toEqual([[false]]);
    w.unmount();

    const p = mount(SdModal, { props: { open: true, title: 'Titel', persistent: true } });
    document
      .querySelector<HTMLElement>('.fixed.inset-0')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await p.vm.$nextTick();
    expect(p.emitted('update:open')).toBeUndefined();
    p.unmount();
  });

  it('still renders a header when there is no title, so the control has a place', () => {
    const w = mount(SdModal, { props: { open: true } });
    expect(closeButton()).not.toBeNull();
    expect(document.querySelector('h2')).toBeNull();
    w.unmount();
  });
});
