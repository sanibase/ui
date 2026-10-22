// @vitest-environment jsdom
// ---------------------------------------------------------------------------
// SdInput's native attributes. The component keeps Vue's attribute fallthrough
// onto its wrapper <div> (a host's class, data-test and style land there), so
// an attribute that only means something on the <input> has to be a prop.
// ---------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import SdInput from './SdInput.vue';

const input = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) => {
  const w = mount(SdInput, { props, attrs });
  return { w, root: w.element as HTMLElement, el: w.get('input').element as HTMLInputElement };
};

describe('SdInput native attributes', () => {
  it('hands autocomplete, name and inputmode to the <input>, not the wrapper', () => {
    const { root, el } = input({ autocomplete: 'current-password', name: 'password', type: 'password', inputmode: 'text' });
    expect(el.getAttribute('autocomplete')).toBe('current-password');
    expect(el.getAttribute('name')).toBe('password');
    expect(el.getAttribute('inputmode')).toBe('text');
    expect(root.hasAttribute('autocomplete')).toBe(false);
    expect(root.hasAttribute('name')).toBe(false);
    expect(root.hasAttribute('inputmode')).toBe(false);
  });

  it.each(['username', 'new-password', 'one-time-code', 'off'])('passes autocomplete="%s" through as given', (hint) => {
    expect(input({ autocomplete: hint }).el.getAttribute('autocomplete')).toBe(hint);
  });

  it('keeps the hint when the eye shows the password as text', async () => {
    const { w, el } = input({ type: 'password', autocomplete: 'new-password' });
    await w.get('button').trigger('click');
    expect(el.getAttribute('type')).toBe('text');
    expect(el.getAttribute('autocomplete')).toBe('new-password');
  });

  it('renders none of them when not given, as before', () => {
    const { el } = input();
    expect(el.hasAttribute('autocomplete')).toBe(false);
    expect(el.hasAttribute('name')).toBe(false);
    expect(el.hasAttribute('inputmode')).toBe(false);
  });

  it('still derives inputmode from the type, and an explicit one wins', () => {
    expect(input({ type: 'numeric' }).el.getAttribute('inputmode')).toBe('numeric');
    expect(input({ type: 'tel' }).el.getAttribute('inputmode')).toBe('tel');
    expect(input({ type: 'swiss-number' }).el.getAttribute('inputmode')).toBe('decimal');
    expect(input({ type: 'number', inputmode: 'decimal' }).el.getAttribute('inputmode')).toBe('decimal');
    expect(input({ type: 'tel', inputmode: 'numeric' }).el.getAttribute('inputmode')).toBe('numeric');
  });

  it('leaves every other attribute on the wrapper, where hosts already target it', () => {
    const { root, el } = input({}, { 'data-test': 'email', class: 'mb-2', pattern: '[0-9]*' });
    expect(root.getAttribute('data-test')).toBe('email');
    expect(root.classList.contains('mb-2')).toBe(true);
    expect(root.getAttribute('pattern')).toBe('[0-9]*');
    expect(el.hasAttribute('data-test')).toBe(false);
    expect(el.hasAttribute('pattern')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// maxlength / minlength (1.21.0). They are the native attributes, so the
// browser does the limiting; jsdom does not enforce maxlength on typing, so
// what is pinned here is where the attribute lands on every type, and that
// the kit adds no limiting of its own. The typing behaviour per type is in
// the README, measured in Chromium on the gallery's /input route.
// ---------------------------------------------------------------------------

describe('SdInput maxlength and minlength', () => {
  it('hands maxlength and minlength to the <input>, not the wrapper', () => {
    const { root, el } = input({ maxlength: 4, minlength: 4 });
    expect(el.getAttribute('maxlength')).toBe('4');
    expect(el.getAttribute('minlength')).toBe('4');
    expect(el.maxLength).toBe(4);
    expect(el.minLength).toBe(4);
    expect(root.hasAttribute('maxlength')).toBe(false);
    expect(root.hasAttribute('minlength')).toBe(false);
  });

  it('renders neither when not given, so the input is the 1.20.0 input', () => {
    const { el } = input({ type: 'numeric' });
    expect(el.hasAttribute('maxlength')).toBe(false);
    expect(el.hasAttribute('minlength')).toBe(false);
    const names = el.getAttributeNames().filter((n) => !n.startsWith('data-v-'));
    expect(names.sort()).toEqual(['class', 'inputmode', 'type', 'value']);
  });

  it.each(['text', 'password', 'numeric', 'tel', 'swiss-number', 'email', 'search'])(
    'puts maxlength on the <input> for type="%s"',
    (type) => {
      expect(input({ type, maxlength: 7 }).el.getAttribute('maxlength')).toBe('7');
    },
  );

  it('keeps maxlength next to the type it renders: numeric and swiss-number stay type="text"', () => {
    // A native type="number" ignores maxlength; the formatted types render
    // type="text", which is why the limit applies to them at all.
    expect(input({ type: 'numeric', maxlength: 4 }).el.getAttribute('type')).toBe('text');
    expect(input({ type: 'swiss-number', maxlength: 9 }).el.getAttribute('type')).toBe('text');
  });

  it('keeps the limit when the eye shows a password PIN as text', async () => {
    const { w, el } = input({ type: 'password', maxlength: 4 });
    await w.get('button').trigger('click');
    expect(el.getAttribute('type')).toBe('text');
    expect(el.getAttribute('maxlength')).toBe('4');
  });

  it('adds no limiting of its own: a value the host sets is shown and emitted in full', async () => {
    // The browser applies maxlength to what the user types or pastes, never
    // to a value set by script; the kit does the same rather than clamping.
    const { w, el } = input({ type: 'numeric', maxlength: 4, modelValue: '1234567' });
    expect(el.value).toBe('1234567');
    el.value = '123456';
    await w.get('input').trigger('input');
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['123456']);
  });

  it('counts what swiss-number shows: the apostrophes it inserts are characters too', async () => {
    const { w, el } = input({ type: 'swiss-number', maxlength: 4, modelValue: '1234' });
    expect(el.value).toBe("1'234");
    expect(el.value.length).toBeGreaterThan(el.maxLength);
    el.value = '12345';
    await w.get('input').trigger('input');
    expect(el.value).toBe("12'345");
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['12345']);
  });

  it('leaves the tel mask as it was: a refused character is dropped, not counted', async () => {
    const { w, el } = input({ type: 'tel', maxlength: 16 });
    el.value = '+41 79 abc 123';
    await w.get('input').trigger('input');
    expect(el.value).toBe('+41 79  123');
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['+41 79  123']);
  });
});
