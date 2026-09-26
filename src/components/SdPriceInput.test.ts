// @vitest-environment jsdom
// ---------------------------------------------------------------------------
// SdPriceInput reads a separator as francs.
//
// Two halves, and the first is the one that must not move:
//
//   - Digits only are Rappen and right-fill exactly as before: 1, 9, 0, 0
//     walks 0.01 -> 0.19 -> 1.90 -> 19.00. Every till in the field is typed
//     this way.
//   - A `.` or `,` (or a thousands `'`) switches to francs, and from then on
//     the field shows what was typed, not a reformat of it. The francs are the
//     digits the user typed (`19`), never the right-filled figure (`0.19`).
//
// jsdom does not edit an <input> on a key press, so the browser's part is
// played here: `beforeinput`, then the value and caret the browser would
// produce, then `input`. The on-screen keyboard's part (a bare `input` with
// no `beforeinput`) is exercised by mounting the real SdVirtualKeyboard.
// ---------------------------------------------------------------------------

import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import SdPriceInput from './SdPriceInput.vue';
import SdVirtualKeyboard from './SdVirtualKeyboard.vue';
import { formatCents, parseMoneyToCents } from '../utils/money';

class StillResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= StillResizeObserver;
Element.prototype.scrollIntoView ??= () => {};

let mounted: VueWrapper[] = [];
afterEach(() => {
  for (const w of mounted) w.unmount();
  mounted = [];
  document.body.innerHTML = '';
});

/** The field under a host that binds v-model, the way every consumer does. */
function field(initial = 0, props: Record<string, unknown> = {}) {
  const model = ref(initial);
  const emitted: number[] = [];
  const Host = defineComponent({
    setup: () => () =>
      h(SdPriceInput, {
        ...props,
        modelValue: model.value,
        'onUpdate:modelValue': (v: number) => {
          model.value = v;
          emitted.push(v);
        },
      }),
  });
  const wrapper = mount(Host, { attachTo: document.body });
  mounted.push(wrapper);
  const input = wrapper.find('input').element as HTMLInputElement;
  return { wrapper, input, model, emitted };
}

function caret(input: HTMLInputElement): [number, number] {
  return [input.selectionStart ?? input.value.length, input.selectionEnd ?? input.value.length];
}

/** One browser edit: the selection is replaced by `text`. */
async function edit(input: HTMLInputElement, text: string, inputType: string) {
  const [start, end] = caret(input);
  input.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType, data: text }));
  input.value = input.value.slice(0, start) + text + input.value.slice(end);
  input.setSelectionRange(start + text.length, start + text.length);
  input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType, data: text }));
  // The host re-renders between keystrokes in a browser; so here.
  await nextTick();
}

/** Types `text` one key at a time and returns what the field showed after each. */
async function type(input: HTMLInputElement, text: string): Promise<string[]> {
  const seen: string[] = [];
  for (const ch of text) {
    await edit(input, ch, 'insertText');
    seen.push(input.value);
  }
  return seen;
}

async function paste(input: HTMLInputElement, text: string) {
  await edit(input, text, 'insertFromPaste');
}

async function backspace(input: HTMLInputElement) {
  const [start, end] = caret(input);
  if (start === end && start === 0) return;
  input.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'deleteContentBackward' }));
  const from = start === end ? start - 1 : start;
  input.value = input.value.slice(0, from) + input.value.slice(end);
  input.setSelectionRange(from, from);
  input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }));
  await nextTick();
}

/** Focus selects the whole figure, as the field has always done. */
async function focus(input: HTMLInputElement) {
  input.focus();
  await nextTick();
  expect(caret(input), 'focus selects the figure').toEqual([0, input.value.length]);
}

/** Focus, then put the caret at the end instead (a click past the text). */
async function focusAtEnd(input: HTMLInputElement) {
  await focus(input);
  input.setSelectionRange(input.value.length, input.value.length);
}

async function blur(input: HTMLInputElement) {
  input.blur();
  await nextTick();
}

// input, display after each key, display after blur, stored cents
const TYPED: Array<[string, string[], string, number]> = [
  ['1900', ['0.01', '0.19', '1.90', '19.00'], '19.00', 1900],
  ['19', ['0.01', '0.19'], '0.19', 19],
  ['19.5', ['0.01', '0.19', '19.', '19.5'], '19.50', 1950],
  ['19,5', ['0.01', '0.19', '19,', '19,5'], '19.50', 1950],
  ['19.50', ['0.01', '0.19', '19.', '19.5', '19.50'], '19.50', 1950],
  ['19,50', ['0.01', '0.19', '19,', '19,5', '19,50'], '19.50', 1950],
  ['19.05', ['0.01', '0.19', '19.', '19.0', '19.05'], '19.05', 1905],
  ['19.00', ['0.01', '0.19', '19.', '19.0', '19.00'], '19.00', 1900],
  ['19,00', ['0.01', '0.19', '19,', '19,0', '19,00'], '19.00', 1900],
  ['.5', ['.', '.5'], '0.50', 50],
  [',50', [',', ',5', ',50'], '0.50', 50],
  ['0.5', ['0.00', '0.', '0.5'], '0.50', 50],
  ['19.-', ['0.01', '0.19', '19.', '19.-'], '19.00', 1900],
  ['19.–', ['0.01', '0.19', '19.', '19.–'], '19.00', 1900],
  ['19,-', ['0.01', '0.19', '19,', '19,-'], '19.00', 1900],
  ["1'900", ['0.01', "1'", "1'9", "1'90", "1'900"], '1900.00', 190000],
  ["1'900.50", ['0.01', "1'", "1'9", "1'90", "1'900", "1'900.", "1'900.5", "1'900.50"], '1900.50', 190050],
  ['1 900.50', ['0.01', '1 ', '1 9', '1 90', '1 900', '1 900.', '1 900.5', '1 900.50'], '1900.50', 190050],
];

describe('SdPriceInput, typed into an empty field', () => {
  it.each(TYPED)('%j shows %j while typing, %j after blur, and stores %i', async (text, whileTyping, afterBlur, cents) => {
    const { input, model } = field(0);
    await focus(input);
    expect(await type(input, text)).toEqual(whileTyping);
    expect(model.value, 'stored before blur, for a form that saves without leaving the field').toBe(cents);
    await blur(input);
    expect(input.value).toBe(afterBlur);
    expect(model.value).toBe(cents);
  });

  it('stores what parseMoneyToCents reads, for every typed example', async () => {
    for (const [text, , , cents] of TYPED) {
      expect(parseMoneyToCents(text), text).toBe(cents);
    }
  });

  it('emits on every change, not only on blur', async () => {
    const { input, emitted } = field(0);
    await focus(input);
    await type(input, '19.5');
    expect(emitted).toEqual([1, 19, 1900, 1950]);
  });

  it('shows the display it would save the moment Enter is pressed', async () => {
    const { input, model } = field(0);
    await focus(input);
    await type(input, '19,5');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await nextTick();
    expect(input.value).toBe('19.50');
    expect(model.value).toBe(1950);
  });

  it('refuses the keystroke that makes a third decimal and keeps the last valid value', async () => {
    const { input, model } = field(0);
    await focus(input);
    expect(await type(input, '19.555')).toEqual(['0.01', '0.19', '19.', '19.5', '19.55', '19.55']);
    expect(model.value).toBe(1955);
    expect(input.getAttribute('aria-invalid'), 'a refused keystroke is not an error').toBeNull();
  });

  it('drops letters and a dash with no francs, as it always dropped non-digits', async () => {
    const { input, model } = field(0);
    await focus(input);
    expect(await type(input, '1a9-')).toEqual(['0.01', '0.01', '0.19', '0.19']);
    expect(model.value).toBe(19);
  });
});

describe('SdPriceInput, over an existing value', () => {
  it('types 25 over a selected 19.00 as Rappen, right-filled as before', async () => {
    const { input, model } = field(1900);
    expect(input.value).toBe('19.00');
    await focus(input);
    expect(await type(input, '25')).toEqual(['0.02', '0.25']);
    expect(model.value).toBe(25);
  });

  it('types francs over a selected value', async () => {
    const { input, model } = field(1900);
    await focus(input);
    expect(await type(input, '24.5')).toEqual(['0.02', '0.24', '24.', '24.5']);
    expect(model.value).toBe(2450);
    await blur(input);
    expect(input.value).toBe('24.50');
  });

  it('appends a digit at the end of 19.00 into the cents, as it always did', async () => {
    const { input, model } = field(1900);
    await focusAtEnd(input);
    expect(await type(input, '5')).toEqual(['190.05']);
    expect(model.value).toBe(19005);
  });

  it('refuses a separator after an untouched 19.00, rather than reading CHF 1900', async () => {
    const { input, model } = field(1900);
    await focusAtEnd(input);
    expect(await type(input, '.')).toEqual(['19.00']);
    expect(model.value).toBe(1900);
  });

  it('takes the typed digits as francs after backspacing into the figure', async () => {
    // 19.00, caret at the end, two backspaces: the right-fill leaves 0.19,
    // whose digits the user now owns. A `.` makes them francs.
    const { input, model } = field(1900);
    await focusAtEnd(input);
    await backspace(input);
    expect(input.value).toBe('1.90');
    await backspace(input);
    expect(input.value).toBe('0.19');
    expect(await type(input, '.5')).toEqual(['19.', '19.5']);
    expect(model.value).toBe(1950);
  });

  it('replaces a selected part of the figure as written', async () => {
    const { input, model } = field(1900);
    await focus(input);
    input.setSelectionRange(2, 5); // `.00`
    expect(await type(input, ',5')).toEqual(['19,', '19,5']);
    expect(model.value).toBe(1950);
  });

  it('clears to zero with backspace over the selection, as before', async () => {
    const { input, model } = field(1900);
    await focus(input);
    await backspace(input);
    expect(input.value).toBe('0.00');
    expect(model.value).toBe(0);
  });
});

describe('SdPriceInput, backspace', () => {
  it('walks back through francs into right-filled Rappen', async () => {
    const { input, model } = field(0);
    await focus(input);
    await type(input, '19.5');
    const seen: Array<[string, number]> = [];
    for (let i = 0; i < 4; i++) {
      await backspace(input);
      seen.push([input.value, model.value]);
    }
    // Once the separator is gone the digits are Rappen again, and the field
    // says so rather than showing a bare 19 that reads as francs.
    expect(seen).toEqual([
      ['19.', 1900],
      ['0.19', 19],
      ['0.01', 1],
      ['0.00', 0],
    ]);
  });

  it('keeps the caret where it is when editing inside typed francs', async () => {
    const { input, model } = field(0);
    await focus(input);
    await type(input, '19.50');
    input.setSelectionRange(2, 2); // after 19
    await backspace(input);
    expect(input.value).toBe('1.50');
    expect(caret(input)).toEqual([1, 1]);
    expect(model.value).toBe(150);
  });
});

describe('SdPriceInput, paste', () => {
  it('reads a pasted CHF 19.00 over the selection', async () => {
    const { input, model } = field(500);
    await focus(input);
    await paste(input, 'CHF 19.00');
    expect(input.value).toBe('19.00');
    expect(model.value).toBe(1900);
  });

  it.each([
    ["1'900.50", 190050],
    ['19,5', 1950],
    ['  19.50  ', 1950],
    ['1900', 1900],
    ['Fr. 19.-', 1900],
  ])('reads a pasted %j as %i', async (text, cents) => {
    const { input, model } = field(0);
    await focus(input);
    await paste(input, text);
    expect(model.value).toBe(cents);
    expect(parseMoneyToCents(text), 'the field and the helper agree').toBe(cents);
    await blur(input);
    expect(input.value).toBe(formatCents(cents));
  });

  it.each(['19.555', '1.900', 'abc', '12 50', '.', "1'"])('keeps the previous value and shows the error state for %j', async (text) => {
    const { wrapper, input, model, emitted } = field(1200);
    await focus(input);
    await paste(input, text);
    expect(input.value).toBe('12.00');
    expect(model.value).toBe(1200);
    expect(emitted).toEqual([]);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(wrapper.find('.border-sd-error').exists()).toBe(true);
    // The next accepted edit clears it.
    await type(input, '5');
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(wrapper.find('.border-sd-error').exists()).toBe(false);
  });

  it('refuses a paste that would make a malformed amount out of typed francs', async () => {
    const { input, model } = field(0);
    await focus(input);
    await type(input, '19.');
    await paste(input, '555');
    expect(input.value).toBe('19.');
    expect(model.value).toBe(1900);
  });
});

describe('SdPriceInput, min and max as before', () => {
  it('refuses the digit that goes past max and keeps the figure', async () => {
    const { input, model } = field(0, { max: 10000 });
    await focus(input);
    expect(await type(input, '100000')).toEqual(['0.01', '0.10', '1.00', '10.00', '100.00', '100.00']);
    expect(model.value).toBe(10000);
  });

  it('refuses the separator that makes typed digits francs past max', async () => {
    const { input, model } = field(0, { max: 10000 });
    await focus(input);
    expect(await type(input, '1000.')).toEqual(['0.01', '0.10', '1.00', '10.00', '10.00']);
    expect(model.value).toBe(1000);
    expect(await type(input, '0')).toEqual(['100.00']);
  });

  it('clamps right-filled digits up to min', async () => {
    const { input, model } = field(0, { min: 100 });
    await focus(input);
    expect(await type(input, '5')).toEqual(['1.00']);
    expect(model.value).toBe(100);
  });

  it('clamps francs below min on the value, and shows it on blur', async () => {
    const { input, model } = field(0, { min: 100 });
    await focus(input);
    expect(await type(input, '.5')).toEqual(['.', '.5']);
    expect(model.value).toBe(100);
    await blur(input);
    expect(input.value).toBe('1.00');
  });
});

describe('SdPriceInput, the host sets the value', () => {
  it('follows a new value from the host', async () => {
    const { input, model } = field(0);
    model.value = 1250;
    await nextTick();
    expect(input.value).toBe('12.50');
  });

  it('leaves typed francs alone when the host echoes the emitted value', async () => {
    const { input } = field(0);
    await focus(input);
    await type(input, '19.5');
    await nextTick();
    expect(input.value).toBe('19.5');
  });

  it('keeps the numeric-looking keypad that offers a separator', () => {
    const { input } = field(0);
    expect(input.getAttribute('inputmode')).toBe('decimal');
  });
});

describe('SdPriceInput, on the on-screen numpad', () => {
  // The kiosk pad writes .value and fires a bare `input`, with no
  // `beforeinput` and no inputType. Its first key after focus clears the
  // field for a fresh entry.
  async function withPad(initial: number) {
    const f = field(initial);
    const pad = mount(SdVirtualKeyboard, { attachTo: document.body });
    mounted.push(pad);
    f.input.focus();
    await nextTick();
    const key = async (label: string) => {
      const button = Array.from(document.querySelectorAll('.vkbd-numpad-only button')).find(
        (b) => b.textContent?.trim() === label,
      );
      expect(button, `the ${label} key is on the pad`).toBeDefined();
      (button as HTMLElement).dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      (button as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await nextTick();
      return f.input.value;
    };
    return { ...f, key };
  }

  it('right-fills digits exactly as before', async () => {
    const { key, model } = await withPad(1900);
    const seen = [await key('1'), await key('9'), await key('0'), await key('0')];
    expect(seen).toEqual(['0.01', '0.19', '1.90', '19.00']);
    expect(model.value).toBe(1900);
  });

  it('reads the pad . as francs', async () => {
    const { key, model } = await withPad(1900);
    const seen = [await key('1'), await key('9'), await key('.'), await key('5')];
    expect(seen).toEqual(['0.01', '0.19', '19.', '19.5']);
    expect(model.value).toBe(1950);
  });

  it('refuses a 00 that would make a third decimal', async () => {
    const { key, model } = await withPad(0);
    const seen = [await key('4'), await key('.'), await key('5'), await key('00')];
    expect(seen).toEqual(['0.04', '4.', '4.5', '4.5']);
    expect(model.value).toBe(450);
  });
});
