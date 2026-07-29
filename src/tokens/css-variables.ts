/**
 * The `sd` token layer, expressed as CSS custom properties.
 *
 * ## Why this file exists
 *
 * Until now the `sd` palette lived twice: once as `colors` in `./colors.ts`
 * (consumed by JS) and once as literal hex values in every Tailwind config
 * that renders `bg-sd-orange` / `text-sd-text` / `border-sd-border`. A theme
 * change therefore meant editing sixty components' worth of compiled utility
 * classes, which is why dark mode kept getting deferred.
 *
 * This module makes the palette resolvable **through CSS custom properties**,
 * so a theme is a variable override on one selector rather than a rewrite:
 *
 * ```css
 * [data-theme='dark'] { --sd-bg-rgb: 18 8 32; --sd-text-rgb: 245 243 250; }
 * ```
 *
 * Dark mode itself is deliberately **not** implemented here (it is cut from
 * SaniMail v1). Only the seam is.
 *
 * ## Why two variables per token
 *
 * Every token ships as a hex (`--sd-orange`) *and* as a bare RGB channel
 * triplet (`--sd-orange-rgb`).
 *
 * - The hex form is what hand-written CSS in the library already reads
 *   (`var(--sd-border, #ebebf0)` in SdDataTable, SdDatePicker, …), so it must
 *   stay.
 * - The triplet form is what Tailwind needs. `bg-sd-orange/15` only survives
 *   theming if the colour is declared as `rgb(var(--sd-orange-rgb) /
 *   <alpha-value>)`. Handing Tailwind a `var(--sd-orange)` that holds a hex
 *   silently drops every opacity modifier — and the calendar grids alone use
 *   `/15`, `/25`, `/30`, `/40`.
 *
 * Fallbacks are baked into every `var()` reference, so a consumer that never
 * loads `@sanibase/ui/tokens.css` renders exactly the colours it renders
 * today.
 */

/** A single palette entry. `name` is the CSS custom-property suffix. */
export interface SdColorToken {
  /** CSS custom property name, including the `--sd-` prefix. */
  name: string;
  /** Light-theme hex value. */
  hex: string;
}

function toRgbTriplet(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/**
 * Canonical light-theme palette. Values are identical to the literals that
 * `tailwind.config.js`, `@sanidesk/config/tailwind` and `apps/web`'s
 * `main.css` already carry — this is a re-expression, not a re-design.
 */
export const sdColorTokens: readonly SdColorToken[] = [
  { name: '--sd-orange', hex: '#FF8C42' },
  { name: '--sd-orange-dark', hex: '#e67a32' },
  { name: '--sd-coral', hex: '#FF6B6B' },
  { name: '--sd-pink', hex: '#D65D7A' },

  { name: '--sd-purple', hex: '#8B5A9F' },
  { name: '--sd-purple-dark', hex: '#6a3d82' },
  { name: '--sd-purple-deeper', hex: '#4a2668' },
  { name: '--sd-purple-light', hex: '#f0e8f5' },
  { name: '--sd-purple-subtle', hex: '#f8f4fb' },

  { name: '--sd-success', hex: '#22c55e' },
  { name: '--sd-success-dark', hex: '#16a34a' },
  { name: '--sd-success-light', hex: '#f0fdf4' },
  { name: '--sd-success-text', hex: '#15803d' },

  { name: '--sd-warning', hex: '#f59e0b' },
  { name: '--sd-warning-dark', hex: '#d97706' },
  { name: '--sd-warning-light', hex: '#fffbeb' },
  { name: '--sd-warning-text', hex: '#92400e' },

  { name: '--sd-error', hex: '#ef4444' },
  { name: '--sd-error-dark', hex: '#dc2626' },
  { name: '--sd-error-light', hex: '#fef2f2' },
  { name: '--sd-error-text', hex: '#991b1b' },

  { name: '--sd-info', hex: '#3b82f6' },
  { name: '--sd-info-dark', hex: '#2563eb' },
  { name: '--sd-info-light', hex: '#eff6ff' },

  { name: '--sd-gray', hex: '#d1d5db' },

  { name: '--sd-text', hex: '#1a1a2e' },
  { name: '--sd-text-secondary', hex: '#4a4a5e' },
  { name: '--sd-text-muted', hex: '#7e7e96' },

  { name: '--sd-bg', hex: '#ffffff' },
  { name: '--sd-bg-alt', hex: '#fafafa' },
  { name: '--sd-bg-surface', hex: '#f5f2f8' },
  { name: '--sd-bg-dark', hex: '#120820' },

  { name: '--sd-border', hex: '#ebebf0' },
  { name: '--sd-border-light', hex: '#f5f5f8' },

  /**
   * Two-tone focus ring. Orange alone measures 2.31:1 on white and fails
   * WCAG SC 1.4.11's 3:1 floor for non-text UI, so the accessible ring is an
   * orange inner edge on a `sd.text` outer edge (13.5:1). Components render
   * it via the `.sd-focus-ring` utility in `tokens.css`.
   */
  { name: '--sd-focus-inner', hex: '#FF8C42' },
  { name: '--sd-focus-outer', hex: '#1a1a2e' },
] as const;

/** Non-colour custom properties (gradients, shadows) shipped alongside. */
export const sdEffectTokens: Readonly<Record<string, string>> = {
  '--sd-gradient-brand': 'linear-gradient(135deg, #FF8C42, #FF6B6B, #D65D7A)',
  '--sd-gradient-purple': 'linear-gradient(135deg, #8B5A9F, #6a3d82)',
  '--sd-shadow-orange': '0 8px 32px rgba(255, 140, 66, 0.25)',
  '--sd-shadow-orange-hover': '0 12px 40px rgba(255, 140, 66, 0.35)',
  '--sd-shadow-purple': '0 8px 32px rgba(139, 90, 159, 0.2)',
  '--sd-shadow-purple-hover': '0 12px 40px rgba(139, 90, 159, 0.3)',
};

/** `{ '--sd-orange': '#FF8C42', '--sd-orange-rgb': '255 140 66', … }` */
export const sdCssVariables: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries([
    ...sdColorTokens.flatMap((t) => [
      [t.name, t.hex],
      [`${t.name}-rgb`, toRgbTriplet(t.hex)],
    ]),
    ...Object.entries(sdEffectTokens),
  ]),
);

/**
 * Render the token block as CSS text for an arbitrary selector.
 *
 * Shipping a dark theme later is one call plus a palette override:
 * `sdTokenCss("[data-theme='dark']", { '--sd-bg': '#120820', … })`.
 */
export function sdTokenCss(
  selector = ':root',
  overrides: Record<string, string> = {},
): string {
  const merged: Record<string, string> = { ...sdCssVariables };
  for (const [k, v] of Object.entries(overrides)) {
    merged[k] = v;
    // Keep the paired triplet in sync when a hex token is overridden.
    if (!k.endsWith('-rgb') && v.startsWith('#')) merged[`${k}-rgb`] = toRgbTriplet(v);
  }
  const body = Object.entries(merged)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
  return `${selector} {\n${body}\n}`;
}

/**
 * The `sd` scale for a Tailwind `theme.extend.colors` block, resolved through
 * the custom properties with the current literals as fallbacks.
 *
 * Drop-in replacement for the hardcoded `sd: { … }` object:
 *
 * ```js
 * import { sdTailwindColors } from '@sanibase/ui/tokens';
 * theme: { extend: { colors: { sd: sdTailwindColors } } }
 * ```
 *
 * Opacity modifiers (`bg-sd-orange/15`) keep working because every entry is
 * an `rgb(… / <alpha-value>)` expression.
 */
function ref(token: string): string {
  const triplet = sdCssVariables[`${token}-rgb`];
  return `rgb(var(${token}-rgb, ${triplet}) / <alpha-value>)`;
}

export const sdTailwindColors = {
  orange: { DEFAULT: ref('--sd-orange'), dark: ref('--sd-orange-dark') },
  coral: ref('--sd-coral'),
  pink: ref('--sd-pink'),
  purple: {
    DEFAULT: ref('--sd-purple'),
    dark: ref('--sd-purple-dark'),
    deeper: ref('--sd-purple-deeper'),
    light: ref('--sd-purple-light'),
    subtle: ref('--sd-purple-subtle'),
  },
  success: {
    DEFAULT: ref('--sd-success'),
    dark: ref('--sd-success-dark'),
    light: ref('--sd-success-light'),
    text: ref('--sd-success-text'),
  },
  warning: {
    DEFAULT: ref('--sd-warning'),
    dark: ref('--sd-warning-dark'),
    light: ref('--sd-warning-light'),
    text: ref('--sd-warning-text'),
  },
  error: {
    DEFAULT: ref('--sd-error'),
    dark: ref('--sd-error-dark'),
    light: ref('--sd-error-light'),
    text: ref('--sd-error-text'),
  },
  info: {
    DEFAULT: ref('--sd-info'),
    dark: ref('--sd-info-dark'),
    light: ref('--sd-info-light'),
  },
  gray: ref('--sd-gray'),
  text: {
    DEFAULT: ref('--sd-text'),
    secondary: ref('--sd-text-secondary'),
    muted: ref('--sd-text-muted'),
  },
  bg: {
    DEFAULT: ref('--sd-bg'),
    alt: ref('--sd-bg-alt'),
    surface: ref('--sd-bg-surface'),
    dark: ref('--sd-bg-dark'),
  },
  border: { DEFAULT: ref('--sd-border'), light: ref('--sd-border-light') },
} as const;
