import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { sdCssVariables, sdTailwindColors, sdTokenCss } from './css-variables';

const tokensCss = readFileSync(
  fileURLToPath(new URL('../styles/tokens.css', import.meta.url)),
  'utf8',
);

/** Every `--sd-*: value;` declaration inside the `:root` block. */
function declarationsIn(css: string): Record<string, string> {
  const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
  const out: Record<string, string> = {};
  for (const m of root.matchAll(/(--sd-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    out[m[1]!] = m[2]!.trim();
  }
  return out;
}

/** WCAG 2.x relative luminance, from a `#rrggbb` literal. */
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = Number.parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two `#rrggbb` literals, 1..21. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('the sd token layer', () => {
  it('ships every token as both a hex and an RGB channel triplet', () => {
    for (const [name, value] of Object.entries(sdCssVariables)) {
      if (name.endsWith('-rgb')) {
        expect(value, name).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
      } else if (name.startsWith('--sd-gradient') || name.startsWith('--sd-shadow')) {
        expect(value.length, name).toBeGreaterThan(0);
      } else {
        expect(value, name).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(sdCssVariables[`${name}-rgb`], `${name} is missing its -rgb pair`).toBeTruthy();
      }
    }
  });

  it('keeps tokens.css in sync with the TypeScript table', () => {
    // The stylesheet is the CSS half of the same table. If this fails, a token
    // was added in one place and not the other.
    expect(declarationsIn(tokensCss)).toEqual(sdCssVariables);
  });

  it('renders a theme override without touching the light values', () => {
    const dark = sdTokenCss("[data-theme='dark']", { '--sd-bg': '#120820' });
    expect(dark).toContain("[data-theme='dark'] {");
    expect(dark).toContain('--sd-bg: #120820;');
    // The paired triplet follows the override, or Tailwind opacity modifiers
    // would silently keep the light colour.
    expect(dark).toContain('--sd-bg-rgb: 18 8 32;');
    expect(sdCssVariables['--sd-bg']).toBe('#ffffff');
  });

  it('exposes the sd scale in the alpha-capable form Tailwind needs', () => {
    // `rgb(var(--x) / <alpha-value>)` is the only shape that keeps
    // `bg-sd-orange/15` working through a custom property.
    expect(sdTailwindColors.orange.DEFAULT).toBe('rgb(var(--sd-orange-rgb, 255 140 66) / <alpha-value>)');
    expect(sdTailwindColors.purple.subtle).toContain('<alpha-value>');
    expect(sdTailwindColors.bg.DEFAULT).toContain('var(--sd-bg-rgb, 255 255 255)');
  });

  it('preserves the literal palette as the var() fallback', () => {
    // A consumer that never loads tokens.css must render exactly what it
    // renders today. The fallback is that guarantee.
    const flat = JSON.stringify(sdTailwindColors);
    expect(flat).toContain('255 140 66'); // sd.orange   #FF8C42
    expect(flat).toContain('139 90 159');  // sd.purple   #8B5A9F
    expect(flat).toContain('26 26 46');    // sd.text     #1a1a2e
    expect(flat).toContain('235 235 240'); // sd.border   #ebebf0
  });

  it('keeps the disabled state legible, and neutral', () => {
    // The state this replaces was `opacity-40` over a brand fill, which put
    // white text on washed coral at 1.40:1: a button with no readable label.
    // WCAG exempts inactive controls (SC 1.4.3); meeting AA anyway is the
    // point, because a disabled "Weiter" has to say what it will do once a
    // figure is typed.
    const surface = sdCssVariables['--sd-disabled-surface']!;
    const text = sdCssVariables['--sd-disabled-text']!;
    expect(contrast(text, surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(text, sdCssVariables['--sd-bg']!)).toBeGreaterThanOrEqual(4.5);

    // Neutral, not a dilution of anything. A disabled surface whose channels
    // drift apart has a hue, and a hue here reads as a brand colour gone wrong.
    for (const token of ['--sd-disabled-surface', '--sd-disabled-border', '--sd-disabled-text']) {
      const [r, g, b] = sdCssVariables[`${token}-rgb`]!.split(' ').map(Number) as [number, number, number];
      expect(Math.max(r, g, b) - Math.min(r, g, b), `${token} is not neutral`).toBeLessThanOrEqual(30);
    }

    // The outline shape's edge has to be stronger than a plain card border, or
    // a disabled outline button loses its outline instead of its colour.
    expect(contrast(sdCssVariables['--sd-disabled-border']!, sdCssVariables['--sd-bg']!)).toBeGreaterThan(
      contrast(sdCssVariables['--sd-border']!, sdCssVariables['--sd-bg']!),
    );
  });

  it('ships the two-tone focus ring, because orange alone fails 3:1', () => {
    expect(sdCssVariables['--sd-focus-inner']).toBe('#FF8C42');
    expect(sdCssVariables['--sd-focus-outer']).toBe('#1a1a2e');
    expect(tokensCss).toContain('.sd-focus-ring:focus-visible');
    expect(tokensCss).toContain('.sd-focus-ring-always:focus');
  });
});

describe('the library Tailwind config', () => {
  it('uses the same sd scale that the package exports', async () => {
    // Tailwind configs are plain JS and cannot import the TypeScript token
    // table, so this test is what stops the two from drifting.
    const mod = await import('../../tailwind.config.js');
    expect(mod.default.theme.extend.colors.sd).toEqual(sdTailwindColors);
  });
});
