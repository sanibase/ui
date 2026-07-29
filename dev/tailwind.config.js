/**
 * Dev-gallery Tailwind config.
 *
 * Inherits the library theme wholesale so the gallery is an honest preview:
 * the `sd` scale here resolves through the same CSS custom properties the
 * published components do (see `src/styles/tokens.css`, imported at the top
 * of `dev/style.css`). If a token override ever breaks a component, it breaks
 * here first.
 */
import base from '../tailwind.config.js';

/** @type {import("tailwindcss").Config} */
export default {
  ...base,
  content: [
    './index.html',
    './**/*.{vue,ts}',
    '../src/**/*.{vue,ts}',
  ],
};
