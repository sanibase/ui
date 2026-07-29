/**
 * Library-local Tailwind config.
 *
 * The `sd` scale resolves through the CSS custom properties shipped in
 * `src/styles/tokens.css` (also exported as `sdTailwindColors` from
 * `@sanibase/ui/tokens`), with the current literals as `var()` fallbacks —
 * so a consumer that never loads `ui.css` renders exactly what it renders
 * today, and a consumer that does can retheme by overriding variables.
 *
 * The `rgb(... / <alpha-value>)` form is deliberate: it is the only shape
 * that keeps Tailwind opacity modifiers (`bg-sd-orange/15`, used throughout
 * the calendar grids) working through a custom property.
 *
 * `src/tokens/css-variables.test.ts` asserts this block equals
 * `sdTailwindColors`, so the two cannot drift.
 */
/** @type {import("tailwindcss").Config} */
export default {
  content: [],
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          200: 'var(--color-brand-200)',
          300: 'var(--color-brand-300)',
          400: 'var(--color-brand-400)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
          800: 'var(--color-brand-800)',
          900: 'var(--color-brand-900)',
          950: 'var(--color-brand-950)',
        },
        sd: {
          "orange": {
            "DEFAULT": "rgb(var(--sd-orange-rgb, 255 140 66) / <alpha-value>)",
            "dark": "rgb(var(--sd-orange-dark-rgb, 230 122 50) / <alpha-value>)"
          },
          "coral": "rgb(var(--sd-coral-rgb, 255 107 107) / <alpha-value>)",
          "pink": "rgb(var(--sd-pink-rgb, 214 93 122) / <alpha-value>)",
          "purple": {
            "DEFAULT": "rgb(var(--sd-purple-rgb, 139 90 159) / <alpha-value>)",
            "dark": "rgb(var(--sd-purple-dark-rgb, 106 61 130) / <alpha-value>)",
            "deeper": "rgb(var(--sd-purple-deeper-rgb, 74 38 104) / <alpha-value>)",
            "light": "rgb(var(--sd-purple-light-rgb, 240 232 245) / <alpha-value>)",
            "subtle": "rgb(var(--sd-purple-subtle-rgb, 248 244 251) / <alpha-value>)"
          },
          "success": {
            "DEFAULT": "rgb(var(--sd-success-rgb, 34 197 94) / <alpha-value>)",
            "dark": "rgb(var(--sd-success-dark-rgb, 22 163 74) / <alpha-value>)",
            "light": "rgb(var(--sd-success-light-rgb, 240 253 244) / <alpha-value>)",
            "text": "rgb(var(--sd-success-text-rgb, 21 128 61) / <alpha-value>)"
          },
          "warning": {
            "DEFAULT": "rgb(var(--sd-warning-rgb, 245 158 11) / <alpha-value>)",
            "dark": "rgb(var(--sd-warning-dark-rgb, 217 119 6) / <alpha-value>)",
            "light": "rgb(var(--sd-warning-light-rgb, 255 251 235) / <alpha-value>)",
            "text": "rgb(var(--sd-warning-text-rgb, 146 64 14) / <alpha-value>)"
          },
          "error": {
            "DEFAULT": "rgb(var(--sd-error-rgb, 239 68 68) / <alpha-value>)",
            "dark": "rgb(var(--sd-error-dark-rgb, 220 38 38) / <alpha-value>)",
            "light": "rgb(var(--sd-error-light-rgb, 254 242 242) / <alpha-value>)",
            "text": "rgb(var(--sd-error-text-rgb, 153 27 27) / <alpha-value>)"
          },
          "info": {
            "DEFAULT": "rgb(var(--sd-info-rgb, 59 130 246) / <alpha-value>)",
            "dark": "rgb(var(--sd-info-dark-rgb, 37 99 235) / <alpha-value>)",
            "light": "rgb(var(--sd-info-light-rgb, 239 246 255) / <alpha-value>)"
          },
          "gray": "rgb(var(--sd-gray-rgb, 209 213 219) / <alpha-value>)",
          "text": {
            "DEFAULT": "rgb(var(--sd-text-rgb, 26 26 46) / <alpha-value>)",
            "secondary": "rgb(var(--sd-text-secondary-rgb, 74 74 94) / <alpha-value>)",
            "muted": "rgb(var(--sd-text-muted-rgb, 126 126 150) / <alpha-value>)"
          },
          "bg": {
            "DEFAULT": "rgb(var(--sd-bg-rgb, 255 255 255) / <alpha-value>)",
            "alt": "rgb(var(--sd-bg-alt-rgb, 250 250 250) / <alpha-value>)",
            "surface": "rgb(var(--sd-bg-surface-rgb, 245 242 248) / <alpha-value>)",
            "dark": "rgb(var(--sd-bg-dark-rgb, 18 8 32) / <alpha-value>)"
          },
          "border": {
            "DEFAULT": "rgb(var(--sd-border-rgb, 235 235 240) / <alpha-value>)",
            "light": "rgb(var(--sd-border-light-rgb, 245 245 248) / <alpha-value>)"
          }
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        heading: ["'DM Sans'", 'sans-serif'],
        body: ["'Inter'", '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        sd: '8px',
        'sd-sm': '6px',
        'sd-md': '12px',
        'sd-lg': '16px',
      },
      boxShadow: {
        'sd-sm': '0 1px 3px rgba(0,0,0,0.04)',
        sd: '0 4px 16px rgba(0,0,0,0.06)',
        'sd-lg': '0 12px 48px rgba(0,0,0,0.08)',
        'sd-orange': '0 8px 32px rgba(255,140,66,0.20)',
        'sd-orange-sm': '0 2px 8px rgba(255,140,66,0.18)',
        'sd-purple': '0 8px 32px rgba(139,90,159,0.15)',
        'sd-purple-sm': '0 2px 8px rgba(139,90,159,0.15)',
      },
    },
  },
  plugins: [],
};
