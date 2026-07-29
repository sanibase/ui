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
