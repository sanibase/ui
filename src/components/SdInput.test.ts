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
    const { root, el } = input({}, { 'data-test': 'email', class: 'mb-2', maxlength: '4' });
    expect(root.getAttribute('data-test')).toBe('email');
    expect(root.classList.contains('mb-2')).toBe(true);
    expect(root.getAttribute('maxlength')).toBe('4');
    expect(el.hasAttribute('data-test')).toBe(false);
  });
});
