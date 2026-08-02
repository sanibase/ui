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

The gallery route `/shell-gaps` covers the round-two findings below: the
dynamic-viewport height and its fallback, the `layout-change` mount emit, the
skeleton rhythm and the sheet. Open it at a phone viewport — the shell block is
the one thing on it that a desktop review cannot judge.

### Dynamic viewport height

`SdAppShell`, `SdBottomSheet` and `SdComposerDock` size themselves in `dvh`
with a `vh` fallback, emitted as **two declarations of the same property** in
one inline style string (`utils/dynamic-viewport.ts`):

```
height:100vh;height:100dvh
```

`100vh` is the *large* viewport height, so on a phone browser with the URL bar
showing a `vh`-sized surface is taller than the visible area and whatever sits
at its bottom edge — a bottom navigation, a sheet footer, a send row — is under
the chrome. The `vh` declaration underneath is the fallback for an engine
without `dvh`, and it has to be shipped rather than assumed: this package's
`dist/ui.css` contains no utility classes at all (`content: []`), so an
`h-screen` class alongside was only ever a fallback for consumers whose own
Tailwind happened to scan `@sanibase/ui/dist`.

A string is used rather than an object binding because it is the browser's CSS
parser that resolves it — in the client via `style.cssText` and on the server
via the rendered `style` attribute — and a parser keeps the last declaration it
can parse. An object binding can only carry one value per property, so it
cannot express a fallback at all under SSR. Reuse it via `dvhDeclarations()`
rather than writing a bare `100dvh`.

### Skeleton rhythm

`SdRowList` draws two text bars per skeleton row by default, which is what it
has always drawn. A row with a different rhythm says so:

```vue
<SdRowList :items="messages" :loading="loading" :skeleton-lines="3" />
```

A skeleton exists to hold the shape the data will take, so a two-bar skeleton
under a three-line row makes the list jolt when data lands. For a row that is
not a stack of text bars, fill the `#skeleton` slot instead. A list that pins
`itemHeight` now pins its loading skeleton to the same height, so the two match
exactly rather than approximately.

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

1. Verify green first: `npm run build && npm run lint && npm test`. `npm publish`
   reruns the build via `prepublishOnly` (clean + vite build + `vue-tsc`
   declarations + `tokens.css`), so a broken build fails the publish, but lint
   and tests are not gates — run them yourself.
2. Bump `version` in `package.json`, commit as `chore(ui): release vX.Y.Z`, tag
   `vX.Y.Z`.
3. Publish to GitHub Packages with `npm publish` (not `pnpm publish`, which
   refuses a dirty tree). Authentication comes from `NODE_AUTH_TOKEN`, which
   this repo's `.npmrc` interpolates; when it is unset the empty value overrides
   the global `~/.npmrc`, so it must be set in the publishing environment.
4. Push the release commit and the tag so the repo never lags the registry.
   Releases are pushed by SHA, so the local `main` pointer does not move and
   reads stale — check `git ls-remote origin refs/heads/main` before believing
   the clone.
5. Bump the pin in every consumer (SaniDesk `apps/web` and `apps/sanimail-web`),
   `pnpm install`, restart the dev server.

Keep edits to `.github/workflows/**` out of the release line — pushing them
requires broader authorisation than a release push, and a rejected workflow file
blocks the whole push including the tag.

Pushing tag `vX.Y.Z` also triggers `.github/workflows/publish.yml`, which builds,
lints and publishes using Actions' own `GITHUB_TOKEN`. When step 3 already
published that version, the run fails on the duplicate — red CI on an
already-published tag is expected noise.

## Provenance

Extracted from SaniDesk's internal `@sanidesk/ui` per Sanitax `docs/03-decisions.md §13`.
The only former domain tie — four validation regexes from `@sanidesk/types` — was
inlined into `src/utils/validation.ts`. The package builds standalone with zero
ties to any product.
