// @vitest-environment jsdom
// ---------------------------------------------------------------------------
// SdBrandIcon draws a mark from @sanibase/brand-icons. What is pinned here:
//
//   - the variant rule: `color` by default, `mono` on request, and `color`
//     falling back to `mono` where a brand has no colour mark (Mastercard);
//   - the owner's decisions: `twitter` shows X labelled "X", Apple Maps
//     renders nothing;
//   - accessibility: labelled with the brand name by default, hidden from
//     assistive technology when `title` is '';
//   - size is the height and the width keeps the mark's aspect ratio;
//   - two copies of a mark with gradients do not share ids.
// ---------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { brandIcons } from '@sanibase/brand-icons';
import SdBrandIcon from './SdBrandIcon.vue';

function svgOf(props: Record<string, unknown>) {
  const wrapper = mount(SdBrandIcon, { props: { brand: 'instagram', ...props } });
  return wrapper.find('svg');
}

describe('SdBrandIcon', () => {
  it('draws the official colour mark by default, labelled with the brand name', () => {
    const svg = svgOf({ brand: 'googlepay' });
    expect(svg.exists()).toBe(true);
    expect(svg.attributes('viewBox')).toBe(brandIcons.googlepay.colorMark?.viewBox);
    expect(svg.attributes('data-variant')).toBe('color');
    expect(svg.attributes('role')).toBe('img');
    expect(svg.attributes('aria-label')).toBe('Google Pay');
    expect(svg.attributes('aria-hidden')).toBeUndefined();
    expect(svg.element.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(svg.element.firstElementChild?.namespaceURI).toBe('http://www.w3.org/2000/svg');
  });

  it('draws the currentColor glyph for variant mono', () => {
    const svg = svgOf({ brand: 'facebook', variant: 'mono' });
    expect(svg.attributes('viewBox')).toBe(brandIcons.facebook.mono.viewBox);
    expect(svg.attributes('data-variant')).toBe('mono');
    expect(svg.html()).toContain('fill="currentColor"');
  });

  it('falls back to mono where the brand has no colour mark', () => {
    const svg = svgOf({ brand: 'mastercard', variant: 'color' });
    expect(svg.attributes('data-variant')).toBe('mono');
    expect(svg.attributes('viewBox')).toBe(brandIcons.mastercard.mono.viewBox);
  });

  it('shows the X logo, labelled "X", for twitter', () => {
    const svg = svgOf({ brand: 'twitter' });
    expect(svg.attributes('data-brand')).toBe('x');
    expect(svg.attributes('aria-label')).toBe('X');
    expect(svg.attributes('viewBox')).toBe(brandIcons.x.colorMark?.viewBox);
  });

  it('renders nothing for Apple Maps or an unknown brand', () => {
    for (const brand of ['applemaps', 'website', '']) {
      const wrapper = mount(SdBrandIcon, { props: { brand } });
      expect(wrapper.find('svg').exists()).toBe(false);
    }
  });

  it('takes a custom label, and is decorative with an empty title', () => {
    expect(svgOf({ title: 'Instagram von Gleis 56' }).attributes('aria-label')).toBe(
      'Instagram von Gleis 56',
    );
    const decorative = svgOf({ title: '' });
    expect(decorative.attributes('aria-hidden')).toBe('true');
    expect(decorative.attributes('focusable')).toBe('false');
    expect(decorative.attributes('role')).toBeUndefined();
    expect(decorative.attributes('aria-label')).toBeUndefined();
  });

  it('is 20 px tall by default and keeps the aspect ratio of a wide mark', () => {
    expect(svgOf({ brand: 'x', variant: 'mono' }).attributes('style')).toContain('width: 20px; height: 20px');
    // TWINT's colour lockup is 201 x 75.
    const twint = svgOf({ brand: 'twint', size: 30 });
    expect(twint.attributes('style')).toContain('width: 80.4px; height: 30px');
  });

  it('accepts a CSS length and falls back to the default on a malformed one', () => {
    expect(svgOf({ brand: 'x', variant: 'mono', size: '1.5em' }).attributes('style')).toContain(
      'width: 1.5em; height: 1.5em',
    );
    expect(svgOf({ brand: 'x', variant: 'mono', size: '1em;color:red' }).attributes('style')).toContain(
      'height: 20px',
    );
  });

  it('gives each copy of a mark its own gradient and clip ids', () => {
    const wrapper = mount({
      components: { SdBrandIcon },
      template: '<div><SdBrandIcon brand="twint" /><SdBrandIcon brand="twint" /></div>',
    });
    const [a, b] = wrapper.findAll('svg').map((s) => s.html());
    const idsOf = (html: string) => [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    expect(idsOf(a).length).toBeGreaterThan(0);
    expect(idsOf(a).some((id) => idsOf(b).includes(id))).toBe(false);
    for (const html of [a, b]) {
      for (const [, ref] of html.matchAll(/url\(#([^)]+)\)/g)) expect(idsOf(html)).toContain(ref);
    }
  });

  it('renders the mark on the server', async () => {
    const html = await renderToString(
      createSSRApp({ render: () => h(SdBrandIcon, { brand: 'whatsapp', variant: 'mono' }) }),
    );
    expect(html).toMatch(/^<svg[^>]+aria-label="WhatsApp"/);
    expect(html).toContain(brandIcons.whatsapp.mono.body);
  });
});
