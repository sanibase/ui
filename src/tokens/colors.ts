/**
 * SaniDesk brand color tokens.
 *
 * Two-color brand identity:
 * - Gradient (orange → coral → pink) for primary CTAs
 * - Purple for structural accents, selection states, navigation
 */
export const colors = {
  /* ── Brand gradient ─────────────────────────── */
  gradient: {
    brand: 'linear-gradient(135deg, #FF8C42, #FF6B6B, #D65D7A)',
    purple: 'linear-gradient(135deg, #8B5A9F, #6a3d82)',
  },

  orange: { DEFAULT: '#FF8C42', dark: '#e67a32' },
  coral: '#FF6B6B',
  pink: '#D65D7A',

  /* ── Purple (structural accent) ─────────────── */
  purple: {
    DEFAULT: '#8B5A9F',
    dark: '#6a3d82',
    deeper: '#4a2668',
    light: '#f0e8f5',
    subtle: '#f8f4fb',
  },

  /* ── Semantic ────────────────────────────────── */
  success: { DEFAULT: '#22c55e', dark: '#16a34a', light: '#f0fdf4', text: '#15803d' },
  warning: { DEFAULT: '#f59e0b', dark: '#d97706', light: '#fffbeb', text: '#92400e' },
  error: { DEFAULT: '#ef4444', dark: '#dc2626', light: '#fef2f2', text: '#991b1b' },
  info: { DEFAULT: '#3b82f6', dark: '#2563eb', light: '#eff6ff' },

  /* ── Neutrals ────────────────────────────────── */
  gray: '#d1d5db',
  text: {
    DEFAULT: '#1a1a2e',
    secondary: '#4a4a5e',
    muted: '#7e7e96',
  },
  bg: {
    DEFAULT: '#ffffff',
    alt: '#fafafa',
    surface: '#f5f2f8',
    dark: '#120820',
  },
  border: {
    DEFAULT: '#ebebf0',
    light: '#f5f5f8',
  },
} as const;
