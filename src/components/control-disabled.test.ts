// @vitest-environment jsdom
// ---------------------------------------------------------------------------
// One rule, three components: SdCheckbox, SdRadio and SdToggle carry their
// state in a fill, and while disabled that fill is a solid neutral. "On" is the
// dark neutral, "off" is white or the light neutral, and nothing is a brand
// colour or translucent.
//
// The bug this pins shut is worse here than the equivalent on SdButton. All
// three used to set `opacity-40` on the outer <label> *and* again on the
// control inside it. Nested opacity multiplies, so the orange fill landed at an
// effective 0.16 alpha, rgb(255,237,225) over white: a disabled *checked* box
// was very nearly indistinguishable from a disabled unchecked one. The state
// was not dimmed, it was gone. So the assertion that matters most is not which
// colour is used but that no opacity survives anywhere in the tree.
//
// jsdom applies no stylesheet, so the colours themselves are asserted against
// tokens.css at the source, the way SdModal.test.ts and css-variables.test.ts
// do. What a mount proves is which classes are chosen.
// ---------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import SdCheckbox from './SdCheckbox.vue';
import SdRadio from './SdRadio.vue';
import SdToggle from './SdToggle.vue';

const tokens = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');

function block(selector: string): string {
  const at = tokens.indexOf(`${selector} {`);
  expect(at, `${selector} is missing from tokens.css`).toBeGreaterThan(-1);
  return tokens.slice(at, tokens.indexOf('}', at));
}

/** Every class on the component and on every element inside it. */
function allClasses(html: string): string {
  return [...html.matchAll(/class="([^"]*)"/g)].map((m) => m[1]).join(' ');
}

const OPTIONS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
];

const cases = [
  {
    name: 'SdCheckbox, checked',
    html: () => mount(SdCheckbox, { props: { modelValue: true, label: 'Aktiv', disabled: true } }).html(),
    on: true,
  },
  {
    name: 'SdCheckbox, indeterminate',
    html: () => mount(SdCheckbox, { props: { indeterminate: true, label: 'Alle', disabled: true } }).html(),
    on: true,
  },
  {
    name: 'SdCheckbox, unchecked',
    html: () => mount(SdCheckbox, { props: { modelValue: false, label: 'Aktiv', disabled: true } }).html(),
    on: false,
  },
  {
    name: 'SdRadio, an option selected',
    html: () => mount(SdRadio, { props: { modelValue: 'card', options: OPTIONS, disabled: true } }).html(),
    on: true,
  },
  {
    name: 'SdRadio, nothing selected',
    html: () => mount(SdRadio, { props: { modelValue: null, options: OPTIONS, disabled: true } }).html(),
    on: false,
  },
  {
    name: 'SdToggle, on',
    html: () => mount(SdToggle, { props: { modelValue: true, label: 'PIN', disabled: true } }).html(),
    on: true,
  },
  {
    name: 'SdToggle, off',
    html: () => mount(SdToggle, { props: { modelValue: false, label: 'PIN', disabled: true } }).html(),
    on: false,
  },
];

describe('a disabled form control keeps its state and loses its colour', () => {
  it.each(cases)('$name carries no opacity anywhere', ({ html }) => {
    // The whole defect in one assertion. Nested opacity is what destroyed the
    // state, so it is not enough for the root to be opaque.
    expect(allClasses(html())).not.toMatch(/\bopacity-\d+\b/);
  });

  it.each(cases)('$name carries no brand colour', ({ html }) => {
    expect(allClasses(html())).not.toMatch(/\b(bg|border|text)-sd-orange\b/);
  });

  it.each(cases.filter((c) => c.on))('$name states its value with the solid neutral', ({ html }) => {
    expect(allClasses(html())).toContain('sd-control-disabled-on');
  });

  it.each(cases.filter((c) => !c.on))('$name reads as off without inventing a fill', ({ html }) => {
    expect(allClasses(html())).not.toContain('sd-control-disabled-on');
  });

  it('mutes the label rather than fading it', () => {
    // `text-sd-text` at 40% opacity was 2.6:1 against white. The muted token is
    // 6.19:1 and, unlike opacity, does not drag the control down with it.
    const w = mount(SdToggle, { props: { modelValue: true, label: 'PIN', disabled: true } });
    expect(w.html()).toContain('sd-control-disabled-text');
    expect(w.html()).not.toContain('text-sd-text"');
  });

  it('keeps the pointer gate, because a <label> has no native disabled state', () => {
    // The click handler sits on the label and fires however the control is
    // painted, so this one cannot be dropped the way SdButton dropped it.
    for (const c of cases) expect(allClasses(c.html()), c.name).toContain('pointer-events-none');
  });

  it('leaves an enabled control exactly as it was', () => {
    expect(mount(SdCheckbox, { props: { modelValue: true } }).html()).toContain('bg-sd-orange');
    expect(mount(SdToggle, { props: { modelValue: true } }).html()).toContain('bg-sd-orange');
    expect(mount(SdToggle, { props: { modelValue: false } }).html()).toContain('bg-sd-gray');
    expect(mount(SdRadio, { props: { modelValue: 'card', options: OPTIONS } }).html()).toContain('bg-sd-orange');
  });
});

describe('the shared control-disabled rules ship as real CSS', () => {
  it('lives in tokens.css, so it lands without the consumer scanning this package', () => {
    expect(block('.sd-control-disabled-on')).toContain('var(--sd-disabled-text, #5f5f78)');
    expect(block('.sd-control-disabled-off')).toContain('var(--sd-disabled-border, #c9c9d6)');
    expect(block('.sd-control-disabled-track')).toContain('var(--sd-disabled-surface, #e4e4ec)');
    expect(block('.sd-control-disabled-text')).toContain('var(--sd-disabled-text, #5f5f78)');
  });

  it('sets a fill on "on" and an edge on "off", so the two can never collapse together', () => {
    // If both resolved to the same paint, a disabled checked box and a disabled
    // unchecked one would look identical, which is the bug in a new costume.
    expect(block('.sd-control-disabled-on')).toContain('background');
    expect(block('.sd-control-disabled-off')).toContain('background: var(--sd-bg, #ffffff)');
  });
});
