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
pnpm test       # vitest: pure helpers, plus mount tests under jsdom
```

Most of the suite is pure layout/arithmetic helpers, which is where the
boundary cases belong. A handful of specs mount a component instead, marked
with a `// @vitest-environment jsdom` docblock, because what they assert only
exists at render time: the agenda's per-row `:ref` callbacks firing against a
list that has since shrunk, for one. jsdom has no layout engine, so nothing
here can measure a box; a rule that has to hold at a specific pixel size is
asserted against the stylesheet, as `src/tokens/css-variables.test.ts` does.

The gallery route `/sanimail-gaps` demonstrates the calendar agenda view, the
pinned all-day band, drag-to-resize, the virtualised 40 000 row list, the
draggable split divider, the toast action, the composer dock and the token
seam, and reproduces the two live `apps/web` calendar call sites prop-for-prop
as a regression check.

The gallery route `/calendar` carries a "Narrow window (visibleDays)" block,
pinned to 390px with a 1/3/5/7 switch, an all-day event and drag enabled. That
block is where the day-range work is judged by eye.

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

### Calendar: a narrower week

The week grid draws seven day columns by default and always will. On a phone
that is unusable: at 390px the columns come out near 43px each and every event
renders as a sliver. `visibleDays` narrows the window, the way Google
Calendar's phone app offers "3 days".

```vue
<SdCalendar
  v-model:date="date"
  v-model:view-mode="mode"
  :events="events"
  :visible-days="isPhone ? 3 : 7"
  :nav-labels="{ week: isPhone ? '3 Tage' : 'Woche' }"
/>
```

It is one prop on `SdCalendar`, which threads it to both `SdCalendarWeekGrid`
and `SdDateNav`. Set it on the two components directly only if you assemble
them yourself, and then set it on **both**: a header reading
`10. Aug. - 16. Aug.` over three drawn columns is the specific lie that makes
a narrow view feel broken.

**Anchoring.** Seven days is a *week*: it snaps to `weekStartsOn` and is named
by its calendar week, exactly as before. Anything narrower is a *rolling
window*: it starts at `date` and prev/next steps by its own width. A 3-day
window cannot be week-aligned, since 3 does not divide 7 and the third window
of a week would either overlap the next or skip a day.

Values outside 1..7 are clamped rather than thrown: a longer range is an
agenda, and `SdCalendarAgenda` already covers that. The view toggle's caption
stays the host's (`navLabels.week`), because the library carries no i18n; a host
offering three days should say so there.

The arithmetic is exported for hosts that draw their own chrome around the
grid (`rangeStart`, `rangeEnd`, `rangeDates`, `stepRange`, `formatRangeLabel`,
`normaliseVisibleDays`). Use them rather than reimplementing the anchor, or
the host's label and the grid's columns will drift apart.

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

### Disabled is a solid neutral, never a faded brand colour

**The rule: disabled removes the colour and keeps the shape.** A disabled
control is drawn in the `--sd-disabled-*` neutrals. It is never a brand colour
at reduced opacity, on any component, in any variant.

Opacity cannot express "inactive", because it dims the signal and the content
together. `opacity-40` over `bg-sd-orange` put the login page's "Sign in" and
every POS "Weiter" on screen as a washed coral, `rgb(249,201,175)`, which reads
as a sickly version of the brand rather than as "not yet", and it took the
label down with it, to **1.40:1** against its own fill. That is not a legibility
compromise, it is the absence of text.

Three tokens carry the state. They are a state, not a shade of anything, and
their hues sit in the same cool neutral family as `--sd-text-muted` so a
disabled control looks like part of this system:

| token | | measured |
|---|---|---|
| `--sd-disabled-surface` | `#e4e4ec` | 1.26:1 on white: visible, and quiet |
| `--sd-disabled-border` | `#c9c9d6` | 1.64:1 on white, stronger than `--sd-border` |
| `--sd-disabled-text` | `#5f5f78` | 4.89:1 on the surface, 6.19:1 on white |

WCAG exempts inactive controls from contrast minima (SC 1.4.3). Meeting AA
anyway is deliberate: a disabled "Weiter" on a counting step has to be readable
to say what will happen once a figure is typed.

**SdButton.** Every variant disables to the same neutral, in the shape it
already had: `solid` becomes a filled neutral chip, `outline` keeps a 1px
neutral edge on white, `ghost` stays chrome-free and only mutes its label, and
`hero` stays a pill. Collapsing all fifteen to one grey block would be simpler
and wrong: a disabled ghost icon button would become a grey blob, louder
disabled than enabled. `loading` is disabled and gets the same treatment, since
`isDisabled` is `disabled || loading`. Weights and the outline border are
matched across the two states so enabling re-colours a button without moving
its label. The variant-to-shape map is a `Record<ButtonVariant, ButtonShape>`,
so adding a variant without deciding how it disables is a type error rather
than a washed-out surprise in production.

**SdCheckbox, SdRadio, SdToggle.** These carry their state in a fill, which is
why opacity failed worse here. All three set `opacity-40` on the outer `<label>`
*and* again on the control inside it; nested opacity multiplies, so the orange
landed at an effective **0.16** alpha, `rgb(255,237,225)`, and a disabled
*checked* box was very nearly indistinguishable from a disabled unchecked one.
The state was not dimmed, it was gone. While disabled, **"on" is the solid dark
neutral and "off" is white or the light neutral**; the mark that states the
value (the tick, the knob, the dot) stays fully opaque. The shared rules live in
`tokens.css` as `.sd-control-disabled-{on,off,track,text}`.

**Why real CSS rather than `sd-disabled-*` utilities.** Same reason as
`.sd-modal-close` below: these rules ship inside `dist/ui.css` and therefore
apply whether or not a consumer's Tailwind scans this package. A consumer still
carrying a hardcoded `sd` palette has no `sd-disabled-*` scale to compile, so
the utility form would emit nothing at all and the control would render
unstyled. The scale is exported through `sdTailwindColors` for consumers that
have adopted the token seam, but nothing in the library depends on it.

**Why the classes are swapped rather than layered.** Appending a neutral after
`bg-sd-orange` does not win. Two Tailwind utilities have equal specificity, so
the one that lands later in the generated stylesheet wins, and the order of
names in a `class` attribute has no say in it at all; which of the two ships
last depends on the consumer's build. Emitting only one of them removes the
question. The single place where a conflict is unavoidable is the hero pill's
radius, which competes with the `rounded-*` that `sizeClasses` always
contributes; that one is settled at two-class specificity
(`.sd-btn.sd-btn-disabled-hero`).

**Note on the cursor.** `cursor: not-allowed` is declared but is not the signal.
Blink forces `default` on a disabled form control whatever the stylesheet says
(checked in the gallery: every disabled `<button>` computes `cursor: default`,
while a disabled `<a>` keeps `not-allowed`). The state is carried by the colour
and the shape.

Judge all of it on the gallery's `/button`, `/checkbox`, `/radio` and `/toggle`
routes, each of which now shows the disabled row against its enabled one.

**Still faded, and known.** `opacity-40` is still the disabled idiom in the rest
of the package. It splits into two groups, and only one of them is this defect:

*Same defect, in a corner case.* `SdTabs` and `SdProductCard` fade a brand
colour, but only in a combination the product does not currently produce: a tab
that is both the active one and disabled (`border-sd-orange text-sd-orange` at
40%), and a card that is both `selected` and `disabled` (`border-sd-orange` plus
an orange ring at 40%). In every other combination they fade neutral chrome.
They want the same treatment; they were left out of this pass because nothing
renders them that way today, not because they are correct.

*A different defect.* `SdInput`, `SdTextarea`, `SdSelect` and `SdPriceInput`
disable to `opacity-40` over `bg-sd-bg-alt`. The surface is already neutral, so
no brand colour is being diluted, but the *typed value* is dragged to 40% and
becomes hard to read. That is a legibility problem, and what a disabled field
should look like is its own decision rather than an extension of this one.
`SdTagInput`, `SdDraggableList`, `SdImageUpload`, `SdColorPicker`,
`SdHoursGrid`, `SdCheckboxGrid`, `SdPriceVariants`, `SdToggleRow`,
`SdAccordion`, `SdSidebar` and `SdFreeFormItemModal` fade neutral chrome the
same way.

### SdModal is out of a consumer's reach

`SdModal` renders inside a `<Teleport to="body">`. Nothing it draws carries the
consuming component's scope id, so a `:deep()` rule written next to the call
site matches nothing, and there is no root element for attribute fallthrough
to land on either. A `class` passed to `<SdModal>` does not reach the dialog.

This is not a gap to work around at the call site. Anything a consumer needs
to change about the dialog chrome is a change here: a prop, or a rule in the
component's own `<style>` block, which ships in `dist/ui.css` and therefore
applies whether or not the consumer's Tailwind scans this package. That is
where the close control's sizing lives (`.sd-modal-close`): 32px drawn, 44px
hit area via a transparent `::after`, and `flex-shrink: 0` so a long title
cannot squeeze it.

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
