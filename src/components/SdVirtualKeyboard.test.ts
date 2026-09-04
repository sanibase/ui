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
