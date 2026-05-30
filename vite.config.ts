import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

/**
 * Multi-entry library build.
 *
 * Two entry points are emitted so customer-facing PWA surfaces (/order,
 * /app, /q, /beleg, /r) can import from `@sanibase/ui/customer` and skip
 * the heavy admin chunks (DataTable, DatePicker, Paginator, Column,
 * HoursGrid) entirely. Without this split, even a single
 * `import { useToast } from '@sanibase/ui'` on a customer layout pulls
 * `primevue/datatable` + `primevue/datepicker` + `primevue/column` into
 * the shared chunk graph (~700 KB of JS the customer never uses) — those
 * external imports live at module scope of the single bundled
 * `dist/index.js` and Rollup can't drop them downstream because PrimeVue
 * has no `sideEffects: false` declared.
 *
 *   - `dist/index.js`     — full set (admin/staff/POS surface, unchanged).
 *   - `dist/customer.js`  — PrimeVue-free subset (see src/customer.ts).
 *
 * Rollup hoists shared components (SdButton, SdInput, …) into shared
 * chunks emitted alongside the two entries; both entries reference them
 * via relative imports, so a component used on both sides is only
 * downloaded once when both ends of the app are visited in one session.
 *
 * Historic note: an earlier pass tried `preserveModules: true` (one
 * chunk per source file). It collapsed because minified single-letter
 * identifiers (h, s, b, …) collided when Vite's dep optimizer evaluated
 * the same component via two import paths — `Identifier 'h' has already
 * been declared` on SdToast. The current multi-entry approach keeps the
 * stable single-bundle-per-entry shape while still allowing the split.
 *
 * Tree-shaking is meaningful at the consumer level because
 * `sideEffects` in package.json was narrowed from
 * `["**\/*.css", "**\/*.vue"]` to `["**\/*.css"]`. PrimeVue is
 * externalised so it stays as the consumer's own dep.
 */
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        customer: resolve(__dirname, 'src/customer.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'vue',
        /^primevue($|\/)/,
        /^@primevue\//,
        /^@primeuix\//,
        /^@phosphor-icons\//,
      ],
    },
  },
});
