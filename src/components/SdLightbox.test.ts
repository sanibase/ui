// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file -- two small test harnesses, not shipped components */
// ---------------------------------------------------------------------------
// SdLightbox: the picture, "1 / 2", previous / next (wrapping), the three
// ways to close, and that Escape closes ONLY the lightbox when it was opened
// from an SdModal (the dialog stays open behind it). The layer is teleported
// to <body>, so the document is queried, not the wrapper.
// ---------------------------------------------------------------------------

import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import SdLightbox from './SdLightbox.vue';
import SdModal from './SdModal.vue';

const IMAGES = [
  { src: 'data:image/png;base64,AAAA', alt: 'Bild 1' },
  { src: 'data:image/png;base64,BBBB', alt: 'Bild 2' },
];

const q = <T extends Element = HTMLElement>(sel: string): T | null => document.querySelector<T>(sel);

let wrappers: VueWrapper[] = [];
afterEach(() => {
  for (const w of wrappers) w.unmount();
  wrappers = [];
  document.body.innerHTML = '';
  document.body.style.overflow = '';
});

/** A lightbox driven like a consumer would: v-model:open and v-model:index. */
function harness(initial = { open: true, index: 0, images: IMAGES }) {
  const open = ref(initial.open);
  const index = ref(initial.index);
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(SdLightbox, {
          open: open.value,
          index: index.value,
          images: initial.images,
          closeLabel: 'Schliessen',
          previousLabel: 'Zurück',
          nextLabel: 'Weiter',
          'onUpdate:open': (v: boolean) => { open.value = v; },
          'onUpdate:index': (v: number) => { index.value = v; },
        }),
    }),
    { attachTo: document.body },
  );
  wrappers.push(w);
  return { w, open, index };
}

function key(k: string, target: EventTarget = document): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
}

describe('SdLightbox', () => {
  it('shows the picture with "1 / 2" and both arrows', async () => {
    harness();
    await new Promise((r) => setTimeout(r));
    expect(q<HTMLImageElement>('[data-testid="sd-lightbox-image"]')?.getAttribute('src')).toBe(IMAGES[0]!.src);
    expect(q('[data-testid="sd-lightbox-count"]')?.textContent?.trim()).toBe('1 / 2');
    expect(q('[data-testid="sd-lightbox-prev"]')?.getAttribute('aria-label')).toBe('Zurück');
    expect(q('[data-testid="sd-lightbox-next"]')?.getAttribute('aria-label')).toBe('Weiter');
    expect(q('[data-testid="sd-lightbox-close"]')?.getAttribute('aria-label')).toBe('Schliessen');
    expect(q('[data-testid="sd-lightbox"]')?.getAttribute('aria-modal')).toBe('true');
  });

  it('next and previous step and wrap around', async () => {
    const { w, index } = harness();
    q('[data-testid="sd-lightbox-next"]')!.click();
    await w.vm.$nextTick();
    expect(index.value).toBe(1);
    expect(q('[data-testid="sd-lightbox-count"]')?.textContent?.trim()).toBe('2 / 2');
    expect(q<HTMLImageElement>('[data-testid="sd-lightbox-image"]')?.getAttribute('src')).toBe(IMAGES[1]!.src);
    q('[data-testid="sd-lightbox-next"]')!.click();
    await w.vm.$nextTick();
    expect(index.value).toBe(0);
    q('[data-testid="sd-lightbox-prev"]')!.click();
    await w.vm.$nextTick();
    expect(index.value).toBe(1);
  });

  it('the arrow keys step too', async () => {
    const { w, index } = harness();
    key('ArrowRight');
    await w.vm.$nextTick();
    expect(index.value).toBe(1);
    key('ArrowLeft');
    await w.vm.$nextTick();
    expect(index.value).toBe(0);
  });

  it('one picture: no arrows, no count', () => {
    harness({ open: true, index: 0, images: [IMAGES[0]!] });
    expect(q('[data-testid="sd-lightbox-image"]')).not.toBeNull();
    expect(q('[data-testid="sd-lightbox-prev"]')).toBeNull();
    expect(q('[data-testid="sd-lightbox-next"]')).toBeNull();
    expect(q('[data-testid="sd-lightbox-count"]')).toBeNull();
  });

  it('closes with the button, beside the picture, and Escape', async () => {
    const a = harness();
    q('[data-testid="sd-lightbox-close"]')!.click();
    await a.w.vm.$nextTick();
    expect(a.open.value).toBe(false);
    expect(q('[data-testid="sd-lightbox"]')).toBeNull();

    a.open.value = true;
    await a.w.vm.$nextTick();
    q('[data-testid="sd-lightbox"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await a.w.vm.$nextTick();
    expect(a.open.value).toBe(false);

    a.open.value = true;
    await a.w.vm.$nextTick();
    q<HTMLImageElement>('[data-testid="sd-lightbox-image"]')!.click();
    await a.w.vm.$nextTick();
    expect(a.open.value, 'a click on the picture itself does not close').toBe(true);
    key('Escape');
    await a.w.vm.$nextTick();
    expect(a.open.value).toBe(false);
  });

  it('Escape over an open SdModal closes only the lightbox', async () => {
    const modalOpen = ref(true);
    const boxOpen = ref(false);
    const w = mount(
      defineComponent({
        setup: () => () => [
          h(
            SdModal,
            { open: modalOpen.value, title: 'Dialog', 'onUpdate:open': (v: boolean) => { modalOpen.value = v; } },
            () => h('button', { 'data-testid': 'thumb', onClick: () => { boxOpen.value = true; } }, 'Bild'),
          ),
          h(SdLightbox, {
            open: boxOpen.value,
            images: IMAGES,
            'onUpdate:open': (v: boolean) => { boxOpen.value = v; },
          }),
        ],
      }),
      { attachTo: document.body },
    );
    wrappers.push(w);
    await w.vm.$nextTick();
    const thumb = q('[data-testid="thumb"]')!;
    thumb.focus();
    thumb.click();
    await w.vm.$nextTick();
    await w.vm.$nextTick();
    expect(q('[data-testid="sd-lightbox"]')).not.toBeNull();
    expect(document.activeElement).toBe(q('[data-testid="sd-lightbox-close"]'));

    key('Escape');
    await w.vm.$nextTick();
    expect(boxOpen.value).toBe(false);
    expect(modalOpen.value, 'the dialog behind stays open').toBe(true);
    expect(document.activeElement, 'focus goes back to the thumbnail').toBe(thumb);

    key('Escape');
    await w.vm.$nextTick();
    expect(modalOpen.value, 'the next Escape is the dialog\'s again').toBe(false);
  });

  it('gives the body its overflow back as it was', async () => {
    document.body.style.overflow = 'hidden';
    const { w, open } = harness();
    open.value = false;
    await w.vm.$nextTick();
    expect(document.body.style.overflow).toBe('hidden');
    document.body.style.overflow = '';
    open.value = true;
    await w.vm.$nextTick();
    expect(document.body.style.overflow).toBe('hidden');
    open.value = false;
    await w.vm.$nextTick();
    expect(document.body.style.overflow).toBe('');
  });

  it('ships its layout as real CSS above SdModal', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const src = readFileSync(resolve(process.cwd(), 'src/components/SdLightbox.vue'), 'utf8');
    expect(src).toMatch(/\.sd-lightbox \{[^}]*z-index: 400/);
    expect(src).toMatch(/\.sd-lightbox \{[^}]*position: fixed/);
  });
});
