// @vitest-environment jsdom
// ---------------------------------------------------------------------------
// The tap that lands outside the pad. Two kinds, and they must not be the
// same: a press on a real control reaches that control on the first tap (the
// pad closing is a side effect of the press), while a tap on empty space
// closes the pad and nothing else, so two stray taps cannot also close the
// modal underneath. SaniDesk POS v2 asked for both halves on 2026-09-04.
// ---------------------------------------------------------------------------

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import SdVirtualKeyboard from './SdVirtualKeyboard.vue';

// jsdom has no layout, so it has no ResizeObserver; the pad measures itself
// with one on mount. A stub that never fires is all a behavioural test needs.
class StillResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= StillResizeObserver;
Element.prototype.scrollIntoView ??= () => {};

const ROOT = '[data-sd-vkbd-root]';
const tick = () => new Promise((r) => setTimeout(r, 0));

function fire(el: Element, type: string) {
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
}

/** A page with the pad mounted, one text field, one button and one bare div. */
async function page() {
  const wrapper = mount(SdVirtualKeyboard, { attachTo: document.body });
  const input = document.createElement('input');
  input.type = 'text';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Abbrechen';
  const space = document.createElement('div');
  space.style.height = '100px';
  document.body.append(input, button, space);
  const onButton = vi.fn();
  const onSpace = vi.fn();
  button.addEventListener('click', onButton);
  space.addEventListener('click', onSpace);
  // Focusing the field is what pops the pad; jsdom raises focusin for us.
  input.focus();
  await nextTick();
  expect(document.querySelector(ROOT), 'the pad is up after focusing a field').not.toBeNull();
  return { wrapper, input, button, space, onButton, onSpace };
}

describe('SdVirtualKeyboard, the tap outside the pad', () => {
  let wrapper: VueWrapper | null = null;
  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    document.body.innerHTML = '';
  });

  it('a press on a real control reaches it on the FIRST tap, and the pad closes with it', async () => {
    const p = await page();
    wrapper = p.wrapper;
    fire(p.button, 'pointerdown');
    fire(p.button, 'click');
    expect(p.onButton, 'the click landed on the button, not in the swallow').toHaveBeenCalledTimes(1);
    await tick();
    await nextTick();
    expect(document.querySelector(ROOT), 'the pad closed as a side effect of the press').toBeNull();
  });

  it('a press on the label INSIDE a control counts as the control', async () => {
    const p = await page();
    wrapper = p.wrapper;
    const label = document.createElement('span');
    label.textContent = 'Weiter';
    p.button.textContent = '';
    p.button.append(label);
    fire(label, 'pointerdown');
    fire(label, 'click');
    expect(p.onButton).toHaveBeenCalledTimes(1);
  });

  it('a tap on empty space closes the pad and reaches nothing underneath', async () => {
    const p = await page();
    wrapper = p.wrapper;
    fire(p.space, 'pointerdown');
    fire(p.space, 'click');
    expect(p.onSpace, 'the stray tap was swallowed').not.toHaveBeenCalled();
    await tick();
    await nextTick();
    expect(document.querySelector(ROOT), 'the pad still closed').toBeNull();
  });

  it('the swallow is one-shot: the next tap on empty space goes through', async () => {
    const p = await page();
    wrapper = p.wrapper;
    fire(p.space, 'pointerdown');
    fire(p.space, 'click');
    fire(p.space, 'click');
    expect(p.onSpace).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Where the keys are. SD-318: on the bench kit backspace sat on the bottom row
// beside `vbnm`, where a hand that has used a keyboard never looks for it. The
// pad has no number row — digits live on the side numpad — so the top letter
// row is the topmost row and its right end is backspace's place. The ?123 page
// always had it there; the letter page did not.
// ---------------------------------------------------------------------------

/** The pad, open on a plain text field, so the alpha page is what is drawn. */
async function alphaPage(locale: 'de' | 'en') {
  const wrapper = mount(SdVirtualKeyboard, { props: { locale }, attachTo: document.body });
  const input = document.createElement('input');
  input.type = 'text';
  document.body.append(input);
  input.focus();
  await nextTick();
  const rows = Array.from(document.querySelectorAll('.vkbd-letters .vkbd-row'));
  expect(rows.length, 'four rows: top, home, bottom, space').toBe(4);
  return { wrapper, rows };
}

/** Letter keys of a row, in order — the function keys filtered out. */
const letters = (row: Element): (string | undefined)[] =>
  Array.from(row.querySelectorAll('button'))
    .filter((b) => !b.classList.contains('vkbd-fn'))
    .map((b) => b.textContent?.trim());

describe('SdVirtualKeyboard, the letter layout', () => {
  let wrapper: VueWrapper | null = null;
  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    document.body.innerHTML = '';
  });

  it('puts backspace at the top right, not on the vbnm row', async () => {
    const p = await alphaPage('de');
    wrapper = p.wrapper;
    const top = p.rows[0] as Element;
    const bottom = p.rows[2] as Element;

    const topKeys = Array.from(top.querySelectorAll('button'));
    const last = topKeys[topKeys.length - 1];
    expect(last?.classList.contains('vkbd-fn'), 'the top row ends in a function key').toBe(true);
    expect(last?.querySelector('svg'), 'and it is an icon key, i.e. backspace').not.toBeNull();

    // The bottom row keeps shift and the letters, and nothing else.
    const bottomFns = Array.from(bottom.querySelectorAll('button')).filter((b) =>
      b.classList.contains('vkbd-fn'),
    );
    expect(bottomFns.length, 'shift is the only function key left on the bottom row').toBe(1);
    expect(
      bottom.querySelector('button')?.classList.contains('vkbd-fn'),
      'and it is the first key, not the last',
    ).toBe(true);
  });

  it('draws QWERTZ with umlauts for de — the Swiss German pad', async () => {
    const p = await alphaPage('de');
    wrapper = p.wrapper;
    expect(letters(p.rows[0] as Element)).toEqual(['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'ü']);
    expect(letters(p.rows[1] as Element)).toEqual(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ö', 'ä']);
    expect(letters(p.rows[2] as Element)).toEqual(['y', 'x', 'c', 'v', 'b', 'n', 'm', 'ß']);
  });

  it('draws QWERTY for en', async () => {
    const p = await alphaPage('en');
    wrapper = p.wrapper;
    expect(letters(p.rows[0] as Element)).toEqual(['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']);
  });
});
