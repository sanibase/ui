/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    './index.html',
    './**/*.{vue,ts}',
    '../src/**/*.{vue,ts}',
  ],
  theme: {
    extend: {
      colors: {
        sd: {
          orange: '#FF8C42',
          coral: '#FF6B6B',
          pink: '#D65D7A',
          purple: {
            DEFAULT: '#8B5A9F',
            dark: '#6a3d82',
            deeper: '#4a2668',
            light: '#f0e8f5',
            subtle: '#f8f4fb',
          },
          success: { DEFAULT: '#22c55e', light: '#f0fdf4' },
          warning: { DEFAULT: '#f59e0b', light: '#fffbeb' },
          error: { DEFAULT: '#ef4444', light: '#fef2f2' },
          info: { DEFAULT: '#3b82f6', light: '#eff6ff' },
          text: { DEFAULT: '#1a1a2e', secondary: '#4a4a5e', muted: '#7e7e96' },
          bg: { DEFAULT: '#ffffff', alt: '#fafafa', surface: '#f5f2f8' },
          border: { DEFAULT: '#ebebf0', light: '#f5f5f8' },
        },
      },
      fontFamily: {
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
        'sd-purple': '0 8px 32px rgba(139,90,159,0.15)',
      },
    },
  },
  plugins: [],
};
