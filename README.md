# @sanibase/ui

Product-neutral, **presentational-only** design system shared across the product
family (SaniDesk, Sanitax, future apps). Vue 3 + PrimeVue components (`Sd*`),
composables, and design tokens.

## The one rule

`@sanibase/ui` carries **components, composables, and design tokens — and nothing
else.** No DB, no services, no auth, no domain types. This boundary is the whole
reason the package can be shared without coupling the products' backends or
release cadences. An ESLint guard (`no-restricted-imports`) fails the build if a
`@sanidesk/*` or `@sanitax/*` import ever appears. Do not relax it.

Each consuming app pins a semver version and upgrades on its own schedule.

## Install (consumers)

The package is published to **GitHub Packages** under the `sanibase` org. Consumers
need an `.npmrc` scoping the `@sanibase` registry:

```
@sanibase:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Then:

```sh
pnpm add @sanibase/ui@1.0.0
```

```ts
import { SdButton, useToast } from '@sanibase/ui';
import '@sanibase/ui/ui.css';
```

A PrimeVue-free subset for customer-facing surfaces:

```ts
import { useToast } from '@sanibase/ui/customer';
```

## Design tokens

The `sd` palette exists in two forms that must stay in step:

- **`src/tokens/css-variables.ts`** — the canonical table. Exports
  `sdCssVariables`, `sdTokenCss()` and `sdTailwindColors`.
- **`src/styles/tokens.css`** — the same table as CSS custom properties,
  shipped inside `dist/ui.css` and also as `@sanibase/ui/tokens.css`.

Every colour ships twice: as a hex (`--sd-orange`, read by hand-written CSS)
and as a bare RGB channel triplet (`--sd-orange-rgb`, read by Tailwind so
`bg-sd-orange/15` keeps its opacity modifier). `src/tokens/css-variables.test.ts`
fails the test run if the stylesheet, the TypeScript table and
`tailwind.config.js` ever disagree.

A consumer adopts the seam by replacing the hardcoded `sd` block in its own
Tailwind config:

```js
import { sdTailwindColors } from '@sanibase/ui/tokens';
theme: { extend: { colors: { sd: sdTailwindColors } } }
```

Every reference carries the current literal as a `var()` fallback, so a
consumer that never loads `ui.css` renders exactly what it renders today.
**Dark mode is deliberately not implemented** — only the seam is. Shipping one
later means one `sdTokenCss('[data-theme="dark"]', { … })` block, not a pass
over sixty components.

## Develop

```sh
pnpm install
pnpm dev        # component gallery (dev/)
pnpm build      # vite lib build + .d.ts emit
pnpm lint       # includes the presentational-only boundary guard
pnpm typecheck
pnpm test       # vitest — pure layout/arithmetic helpers
```

The gallery route `/sanimail-gaps` demonstrates the calendar agenda view, the
pinned all-day band, drag-to-resize, the virtualised 40 000 row list, the
draggable split divider, the toast action, the composer dock and the token
seam, and reproduces the two live `apps/web` calendar call sites prop-for-prop
as a regression check.

### SdComposerDock

Non-modal composer windows: three states (normal, maximised, collapsed to a
title bar), up to three open at once, further ones stacked as title bars, full
screen on a phone. `Escape` collapses and never closes, and focus is never
trapped — the page behind stays readable and operable, which is the whole
point.

The windows live in `useComposerDock()`, a module-scope store, and the dock is
mounted **once in the app shell, next to the router view and never inside
it**:

```vue
<SdComposerDock>
  <template #default="{ composer }">
    <MyComposerFields :composer="composer" />
  </template>
</SdComposerDock>
```

```ts
const dock = useComposerDock();
dock.open({ title: 'Bestellung KW 31', data: { to: [], body: '' } });
```

A dock rendered by a page unmounts with that page, and a draft that dies on
navigation is exactly what this component exists to prevent. The chrome, the
three states and the arrangement are the dock's; the fields are the host's.
Mark the field that should take focus on open with `data-autofocus`.

## Release

1. Bump `version` in `package.json`.
2. Commit, tag `vX.Y.Z`, push the tag.
3. CI (`.github/workflows/publish.yml`) builds, lints, and publishes to GitHub Packages.

## Provenance

Extracted from SaniDesk's internal `@sanidesk/ui` per Sanitax `docs/03-decisions.md §13`.
The only former domain tie — four validation regexes from `@sanidesk/types` — was
inlined into `src/utils/validation.ts`. The package builds standalone with zero
ties to any product.
