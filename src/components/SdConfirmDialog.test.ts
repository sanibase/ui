// @vitest-environment jsdom
// ---------------------------------------------------------------------------
// The footer pair is the subject here: Cancel is a neutral outline (white,
// grey label, grey edge), the confirm button is orange or red as before.
// SdModal teleports to <body>, so the buttons are queried on the document.
// ---------------------------------------------------------------------------

import { afterEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import SdConfirmDialog from './SdConfirmDialog.vue';

function footerButtons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('.border-t.border-sd-border button'));
}

describe('SdConfirmDialog footer', () => {
  let w: ReturnType<typeof mount> | null = null;
  afterEach(() => {
    w?.unmount();
    w = null;
  });

  it('draws Cancel as a neutral outline, not a ghost', () => {
    w = mount(SdConfirmDialog, { props: { open: true, title: 'Löschen?', cancelLabel: 'Abbrechen' } });
    const [cancel] = footerButtons();
    expect(cancel!.textContent).toContain('Abbrechen');
    expect(cancel!.className).toContain('sd-btn-neutral-outline');
    expect(cancel!.className).not.toContain('bg-transparent');
  });

  it('leaves the confirm button orange by default and red for danger', () => {
    w = mount(SdConfirmDialog, { props: { open: true, title: 'Speichern?' } });
    expect(footerButtons()[1]!.className).toContain('bg-sd-orange');
    w.unmount();
    w = mount(SdConfirmDialog, { props: { open: true, title: 'Löschen?', variant: 'danger' } });
    expect(footerButtons()[1]!.className).toContain('bg-sd-error');
  });

  it('keeps Cancel an outline of the same weight while loading', () => {
    w = mount(SdConfirmDialog, { props: { open: true, title: 'Löschen?', loading: true } });
    const [cancel] = footerButtons();
    expect(cancel!.disabled).toBe(true);
    expect(cancel!.className).toContain('sd-btn-disabled-outline-strong');
  });

  it('emits cancel and closes when Cancel is pressed', async () => {
    w = mount(SdConfirmDialog, { props: { open: true, title: 'Löschen?' } });
    footerButtons()[0]!.click();
    await w.vm.$nextTick();
    expect(w.emitted('cancel')).toHaveLength(1);
    expect(w.emitted('update:open')).toEqual([[false]]);
  });
});
