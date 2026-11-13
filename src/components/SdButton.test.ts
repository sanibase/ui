// @vitest-environment jsdom
// ---------------------------------------------------------------------------
// The disabled state is the subject here.
//
// The rule being pinned is that a disabled button is a **solid neutral** and
// never a brand colour at reduced opacity. Two halves have to hold for that,
// and they fail in different places:
//
//   - The class list must not carry the variant's brand utilities at all.
//     Layering a neutral over `bg-sd-orange` does not win: equal specificity
//     means the generated stylesheet's order decides, and that order belongs
//     to the consumer's build. A mount can prove the utility is absent.
//   - The colours must be real CSS in the component's own <style> block, so
//     they ship in dist/ui.css and land regardless of what a consumer's
//     Tailwind scans. jsdom applies no stylesheet, so that half is asserted
//     against the source the way SdModal.test.ts and css-variables.test.ts do.
// ---------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import SdButton from './SdButton.vue';
import type { ButtonVariant } from './SdButton.vue';

// Resolved from the project root rather than import.meta.url: under the jsdom
// environment import.meta.url is an http: URL and fileURLToPath rejects it.
const source = readFileSync(resolve(process.cwd(), 'src/components/SdButton.vue'), 'utf8');

function block(selector: string): string {
  const at = source.indexOf(`${selector} {`);
  expect(at, `${selector} is missing from the stylesheet`).toBeGreaterThan(-1);
  return source.slice(at, source.indexOf('}', at));
}

const SOLID: ButtonVariant[] = [
  'primary',
  'secondary',
  'success',
  'warning',
  'info',
  'danger',
];
const OUTLINE: ButtonVariant[] = [
  'primary-outline',
  'secondary-outline',
  'success-outline',
  'warning-outline',
  'info-outline',
  'danger-outline',
];
const HERO: ButtonVariant[] = ['hero-primary', 'hero-secondary'];
const ALL: ButtonVariant[] = [...SOLID, ...OUTLINE, 'neutral-outline', ...HERO, 'ghost'];

function classesOf(variant: ButtonVariant, props: Record<string, unknown> = {}): string {
  return mount(SdButton, { props: { label: 'Weiter', variant, ...props } }).classes().join(' ');
}

const Icon = defineComponent({ render: () => h('svg', { class: 'icon' }) });

/** A ghost with nothing but an icon: the toolbar button, the modal close. */
function iconGhost(props: Record<string, unknown> = {}): string {
  return mount(SdButton, { props: { variant: 'ghost', icon: true, ...props }, slots: { 'icon-left': () => h(Icon) } })
    .classes()
    .join(' ');
}

describe('a disabled SdButton is a solid neutral, not a faded brand colour', () => {
  it('drops every brand utility from every variant', () => {
    // The defect this replaces: `opacity-40` over `bg-sd-orange` composited to
    // rgb(249,201,175) on the login page's Sign in button and on every POS
    // "Weiter" before a figure was typed. Neither the fade nor the brand fill
    // may survive, on any of the sixteen variants.
    for (const variant of ALL) {
      const cls = classesOf(variant, { disabled: true });
      expect(cls, variant).not.toMatch(/\bopacity-\d+\b/);
      expect(cls, variant).not.toMatch(/\b(bg|text|border)-sd-(orange|purple|success|warning|info|error)\b/);
      expect(cls, variant).not.toContain('sd-btn-hero-');
      expect(cls, variant).toContain('sd-btn-disabled');
    }
  });

  it('keeps the shape it disables — filled stays filled, outline keeps its outline, ghost stays chrome-free', () => {
    // Collapsing all sixteen to one grey block would be simpler and wrong: a
    // disabled ghost icon button would become a grey blob, louder disabled
    // than enabled.
    for (const v of SOLID) expect(classesOf(v, { disabled: true }), v).toContain('sd-btn-disabled-solid');
    for (const v of OUTLINE) expect(classesOf(v, { disabled: true }), v).toContain('sd-btn-disabled-outline');
    // The neutral outline is an outline too, one that keeps its 1.5px edge.
    expect(classesOf('neutral-outline', { disabled: true })).toContain('sd-btn-disabled-outline');
    expect(classesOf('neutral-outline', { disabled: true })).toContain('sd-btn-disabled-outline-strong');
    for (const v of OUTLINE) {
      expect(classesOf(v, { disabled: true }), v).not.toContain('sd-btn-disabled-outline-strong');
    }
    // Only an icon-only ghost is still a ghost; one with words is a neutral outline.
    expect(iconGhost({ disabled: true })).toContain('sd-btn-disabled-ghost');
    // A hero is a filled pill, and stays a pill: dropping the gradient must
    // not also drop `rounded-full` and change the button's geometry.
    for (const v of HERO) {
      expect(classesOf(v, { disabled: true }), v).toContain('sd-btn-disabled-solid');
      expect(classesOf(v, { disabled: true }), v).toContain('sd-btn-disabled-hero');
    }
  });

  it('treats loading exactly as disabled, because it is', () => {
    // `isDisabled` is `disabled || loading`. A loading button was faded brand
    // for the same reason and is fixed by the same swap.
    expect(classesOf('primary', { loading: true })).toContain('sd-btn-disabled-solid');
    expect(classesOf('primary', { loading: true })).not.toMatch(/\bopacity-\d+\b/);
  });

  it('leaves an enabled button exactly as it was', () => {
    // The brand colours are the whole product. Nothing about this change may
    // reach the state people actually press.
    const cls = classesOf('primary');
    expect(cls).toContain('bg-sd-orange');
    expect(cls).toContain('cursor-pointer');
    expect(cls).not.toContain('sd-btn-disabled');
    expect(classesOf('hero-primary')).toContain('sd-btn-hero-primary');
  });

  it('ships the neutral as real CSS, not as sd-disabled-* utilities', () => {
    // A consumer still carrying a hardcoded `sd` palette has no
    // `sd-disabled-*` scale to compile, so the utility form would emit
    // nothing at all and the button would render unstyled. These rules have
    // to be in dist/ui.css, and they have to be here to get there.
    expect(block('.sd-btn-disabled')).toContain('var(--sd-disabled-text, #5f5f78)');
    expect(block('.sd-btn-disabled')).toContain('cursor: not-allowed');
    expect(block('.sd-btn-disabled')).toContain('box-shadow: none');
    expect(block('.sd-btn-disabled-solid')).toContain('var(--sd-disabled-surface, #e4e4ec)');
    expect(block('.sd-btn-disabled-outline')).toContain('var(--sd-disabled-border, #c9c9d6)');
    expect(block('.sd-btn-disabled-ghost')).toContain('background: transparent');
    // Every reference carries the literal as a var() fallback, so a consumer
    // that never loads tokens.css still gets the neutral rather than nothing.
    expect(block('.sd-btn.sd-btn-disabled-hero')).toContain('9999px');
  });

  it('does not change the box when the button becomes enabled', () => {
    // A weight or border change between the two states makes the label jump
    // the moment a form validates. The outline shape keeps a 1px border and
    // the weights match their enabled counterparts.
    expect(block('.sd-btn-disabled')).toContain('font-weight: 600');
    expect(block('.sd-btn-disabled-ghost')).toContain('font-weight: 500');
    expect(block('.sd-btn-disabled-outline')).toContain('1px solid');
    expect(block('.sd-btn-disabled-solid')).toContain('border: none');
    // The neutral outline's edge is 1.5px enabled, so it stays 1.5px disabled.
    expect(block('.sd-btn-neutral-outline')).toContain('1.5px solid');
    expect(block('.sd-btn-disabled-outline.sd-btn-disabled-outline-strong')).toContain('border-width: 1.5px');
  });
});

describe('the neutral outline is the button that only steps back', () => {
  // Cancel, Zurück, close. SdConfirmDialog's cancel wears it. The look is the
  // one SaniDesk's till gives its cancel role: white, grey label, 1.5px grey
  // edge, a grey wash on hover. Never a brand colour, never red.
  it('carries no brand utility and no ghost chrome-free look', () => {
    const cls = classesOf('neutral-outline');
    expect(cls).toContain('sd-btn-neutral-outline');
    expect(cls).toContain('font-semibold');
    expect(cls).not.toMatch(/\b(bg|text|border)-sd-(orange|purple|success|warning|info|error)\b/);
    expect(cls).not.toContain('bg-transparent');
    expect(cls).not.toContain('sd-btn-disabled');
  });

  it('drops its look entirely while disabled, like every variant', () => {
    expect(classesOf('neutral-outline', { disabled: true })).not.toContain('sd-btn-neutral-outline');
  });

  it('ships its colours as real CSS that reads the neutral tokens, literals as fallback', () => {
    const base = block('.sd-btn-neutral-outline');
    expect(base).toContain('var(--sd-bg, #ffffff)');
    expect(base).toContain('var(--sd-neutral-ink, #5b6678)');
    expect(base).toContain('var(--sd-neutral-edge, #8e9cb1)');
    expect(block('.sd-btn-neutral-outline:hover')).toContain('var(--sd-neutral-wash, #f1f3f6)');
  });
});

describe('a disabled SdButton is inert, not merely painted inert', () => {
  it('gates a <button> natively and still shows why', () => {
    const w = mount(SdButton, { props: { label: 'Weiter', disabled: true } });
    expect(w.attributes('disabled')).toBeDefined();
    // `pointer-events: none` would suppress `cursor: not-allowed`, and a
    // natively disabled button does not need it to stop a click.
    expect(w.classes()).not.toContain('pointer-events-none');
  });

  it('takes the href off a disabled link, which has no native gate', () => {
    // Previously a disabled href button kept its href and only lost pointer
    // events: still tab-focusable, and Enter still navigated.
    const w = mount(SdButton, {
      props: { label: 'Weiter', href: '/orders', disabled: true },
    });
    expect(w.element.tagName).toBe('A');
    expect(w.attributes('href')).toBeUndefined();
    expect(w.attributes('aria-disabled')).toBe('true');
    // An anchor fires a call site's @click handler however it is styled, so
    // this one keeps the pointer-events gate that the <button> does not need.
    expect(w.classes()).toContain('pointer-events-none');
  });

  it('leaves an enabled link alone', () => {
    const w = mount(SdButton, { props: { label: 'Weiter', href: '/orders' } });
    expect(w.attributes('href')).toBe('/orders');
    expect(w.attributes('aria-disabled')).toBeUndefined();
    expect(w.classes()).not.toContain('pointer-events-none');
  });
});

describe('a ghost with words is drawn as the neutral outline', () => {
  // Owner 2026-11-13: no button with a label renders as bare text, "always the
  // faded grey outline like Abbrechen". `ghost` keeps its chrome-free look only
  // where it shows no words.
  it('maps a ghost with a label prop to neutral-outline', () => {
    const cls = classesOf('ghost');
    expect(cls).toContain('sd-btn-neutral-outline');
    expect(cls).not.toContain('bg-transparent');
  });

  it('maps a ghost with words in its default slot to neutral-outline', () => {
    const cls = mount(SdButton, { props: { variant: 'ghost' }, slots: { default: () => 'Abbrechen' } }).classes().join(' ');
    expect(cls).toContain('sd-btn-neutral-outline');
  });

  it('maps words wrapped in an element, beside an icon, too', () => {
    const cls = mount(SdButton, {
      props: { variant: 'ghost' },
      slots: { default: () => [h(Icon), h('span', 'Kopieren')] },
    })
      .classes()
      .join(' ');
    expect(cls).toContain('sd-btn-neutral-outline');
  });

  it('keeps an icon-only ghost chrome-free', () => {
    expect(iconGhost()).toContain('bg-transparent');
    expect(iconGhost()).not.toContain('sd-btn-neutral-outline');
  });

  it('keeps a ghost chrome-free when its default slot is only an icon, even with a label passed', () => {
    // The slot wins over `label` in the template, so no words are shown.
    const cls = mount(SdButton, { props: { variant: 'ghost', label: 'Nach oben' }, slots: { default: () => h(Icon) } })
      .classes()
      .join(' ');
    expect(cls).toContain('bg-transparent');
    expect(cls).not.toContain('sd-btn-neutral-outline');
  });

  it('disables a labelled ghost as the outline it is drawn as', () => {
    const cls = classesOf('ghost', { disabled: true });
    expect(cls).toContain('sd-btn-disabled-outline-strong');
    expect(cls).not.toContain('sd-btn-disabled-ghost');
  });
});
