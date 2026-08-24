# Migration: `@sanibase/ui` 1.5.0 to 1.13.0

What a consumer inherits when it moves its pin from `1.5.0` to `1.13.0`.
28 commits. Written for SaniDesk (`apps/web`, `apps/sanimail-web`), which is the
only consumer still on 1.5.0, but nothing here is SaniDesk-specific except the
last section.

## The short version

- **Nothing breaks at the type level.** `src/index.ts` gained exports and lost
  none, `src/customer.ts` is byte-identical, `exports` in `package.json` is
  unchanged, no prop was renamed or removed, no default changed, no slot name or
  slot prop changed. TypeScript will not flag anything.
- **One runtime contract changed, silently.** `SdCalendarWeekGrid` stopped
  emitting `dayClick` from its time cells. Read [Must adjust](#must-adjust).
- **One deliberate visual change reaches every screen**: disabled controls are
  now a solid neutral rather than a faded brand colour. That is 1.13.0 itself.
- Everything else is additive, a bug fix, or cosmetic.

Peer requirements are unchanged: `vue ^3.5.0`, `primevue ^4.3.0`,
`@primevue/themes ^4.3.0`, `@phosphor-icons/vue ^2.2.1`, `chart.js ^4.4.0`.
No design token was removed or changed value; 1.13.0 adds three.

## Must adjust

### `SdCalendarWeekGrid` no longer emits `dayClick` from a time cell (`aa15657`, 1.11.0)

This is the only genuine break in the range, and it is silent: no type error,
the handler simply stops running.

In 1.5.0 a tap on a time cell in the md/touch week layout emitted
`dayClick: [date]`, carrying only the day. It now emits

```ts
slotClick: [{ resourceId: string; start: Date; end: Date }]
```

with `start` set to the quarter hour actually tapped. The keyboard path
(Enter/Space on a focused cell) moved with it. Separately, a click on the
all-day band's column background moved from `dayClick` to a **new**
`allDayClick: [date]`.

`dayClick` still exists and still fires from the `sm` (compact, stacked-card)
layout's column background. It was never emitted by day headers in either
version. `SdCalendarDayGrid` is unaffected; it always emitted `slotClick`.

**What to do.** If you listen for `@day-click` on `SdCalendar` or
`SdCalendarWeekGrid` to open a create form, wire `@slot-click` as well and take
the time from `payload.start` instead of substituting a default hour. If you
relied on a click in the all-day band, add `@all-day-click`.

Note `resourceId` is the empty string when the grid has no resource lanes. If
your code compares it against a sentinel such as `UNASSIGNED`, check that an
empty string still takes the branch you want.

### Disabled controls are a solid neutral (1.13.0)

Not a break, but it changes what users see everywhere, so it should be looked at
rather than discovered.

A disabled control used to be its normal self at `opacity-40`. A disabled
primary button therefore rendered as a washed coral with its label at 1.40:1
against its own fill. From 1.13.0 disabled removes the colour and keeps the
shape, drawn in three new tokens (`--sd-disabled-surface` `#e4e4ec`,
`--sd-disabled-border` `#c9c9d6`, `--sd-disabled-text` `#5f5f78`).

- `SdButton`: every variant. Filled becomes a neutral chip, outline keeps a 1px
  neutral edge on white, ghost stays chrome-free, hero stays a pill. `loading`
  is treated as disabled and looks the same.
- `SdCheckbox`, `SdRadio`, `SdToggle`: "on" is the solid dark neutral, "off" is
  white or the light neutral. These three previously applied `opacity-40` twice
  (on the label and again on the control); nested opacity multiplies, so their
  fills rendered at an effective 0.16 alpha and a disabled *checked* control was
  very nearly indistinguishable from an unchecked one. If any of your screens
  quietly depended on that, they will now show the state correctly.

Two behavioural details on `SdButton` come with it:

- A disabled `<SdButton href="...">` no longer renders its `href` and now
  carries `aria-disabled="true"`. Previously it kept the href and lost only
  pointer events, so it stayed tab-focusable and Enter navigated.
- A disabled `<SdButton>` without `href` no longer sets `pointer-events: none`.
  The native `disabled` attribute is the gate. Consequence: a click on a
  disabled button is now absorbed instead of passing through to a clickable
  ancestor. If you have a disabled button inside a clickable card and relied on
  the click reaching the card, that stops.

No consumer needs to add the new tokens to its own Tailwind config. Every rule
ships as real CSS in `dist/ui.css` with the literal as a `var()` fallback, so it
lands whether or not your build scans this package. The scale is also exported
through `sdTailwindColors` if you have adopted the token seam.

## Changed behaviour, no API change

These need no code edit. They change what renders.

**`SdCalendarEvent`** (`0af6922`, 1.7.0). Layout thresholds lowered
(`md 34/58` to `30/50`, `touch 42/72` to `36/62`), so short blocks now show more
lines. Padding rewritten per size; the old flat `pl-4` that silently beat the
adjacent `px-*` is gone. **Titles no longer truncate to one line**: they wrap to
2 lines in medium mode and 3 in full. A latent bug is fixed: a non-hex `color`
(`rgb()`, a named colour, a `var()`) used to produce the literal garbage
`rgb(0,0,0)14` and now goes through `color-mix`.

**`SdCalendarMonth`** (`0af6922`, `a7d2e50`, 1.7.0/1.8.0). Month chips now read
`event.color`; previously they painted from `event.status` alone, so an event in
a blue calendar drew blue in day/week and green in month. **The leading status
dot is replaced by a 3px left accent bar.** Cell and chip padding tightened, and
the day-number circle shrank (`md` 28px to 24px, `touch` 36px to 28px, with
`touch` dropping from `text-base` to `text-sm`). If you render a month view at
`size="touch"`, this is the largest single visual delta in the whole upgrade.

**`SdDateNav`** (`089bd7a`, `0a4ac04`, 1.6.0). Fixes a real bug: the week label
was hand-rolled, Monday-only, and **on a Sunday named the following week**. At
the defaults the output string is otherwise identical and the step is still
exactly 7 days.

**`SdCalendarWeekGrid` / `SdCalendarDayGrid` / `SdCalendarAllDayBand`**
(`6e95229`, `4581b99`, 1.9.0/1.10.0). The hour axis and the day columns were
restructured to support paging: the axis is now one grid item spanning all rows,
and the day columns sit in a clipped region wrapper. Grid template and geometry
at rest are unchanged, and no transform is applied when `paging` is undefined
(deliberately, so the grid does not become the containing block for
`position: fixed` descendants). Sticky `z-index` on the header row and the
all-day band went from `z-20` to `z-30`; if you overlay anything on a calendar
at `z-20` to `z-30`, re-check it.

**`SdModal`** (`57d1984`, 1.6.1). The close button's `w-8 h-8` utilities were
removed from the class list on purpose. They sat in the same cascade layer as
any `flex-shrink` a consumer's build emits, so a long title squeezed the button
to 26x32. Sizing now lives in `.sd-modal-close` in `dist/ui.css`: 32px drawn,
with a 44px hit area as a transparent centred `::after`, and `flex-shrink: 0`.
The title gained `min-w-0 break-words`, so a long unbroken token wraps instead
of overflowing. Header height is unchanged. **This requires `ui.css` to be
loaded**, which it is if you import `@sanibase/ui/ui.css`.

**`SdCalendarAgenda`** (`2e1d323`, 1.6.0). Pure bug fix, no API change. The
per-row `:ref` was an inline arrow that recomputed its index from reactive
state; Vue invokes the previous render's ref function while unmounting rows that
went away, so it ran with an index from the old, longer list and threw
`Cannot read properties of undefined (reading 'events')`. Shrinking the day
groups triggered it. The index is now assigned once as data, and `rowEls` is
pruned in `onBeforeUpdate` so `focusRow()` cannot focus a detached node. You get
the disappearance of a console error.

**`SdBottomSheet`** (`aa15657`, `b4583a0`, 1.11.0). New props only, all
defaulting to 1.5.0 behaviour. `scrim=false` makes the backdrop
`pointer-events-none` and skips the body scroll lock; `closeButton=false` hides
the built-in X without disabling dismissal; `expandable`/`expanded` add a
half/full sheet. Drag-end was rewritten to track signed travel, with an
identical outcome for a non-expandable sheet.

## New surface (additive, safe to ignore)

Component `SdCalendarSelection`. Values `selectionBox`, `SELECTION_ID`,
`stripGeometry`, and the day-range helpers `FULL_WEEK_DAYS`, `clampDayIndex`,
`dayColumnTemplate`, `dropOnSlot`, `formatRangeLabel`, `gutterColumnTemplate`,
`isFullWeek`, `normaliseVisibleDays`, `rangeDates`, `rangeEnd`, `rangeStart`,
`stepRange`. Types `SdCalendarSelectionProps`, `SelectionEdge`, `CalendarPaging`,
`CalendarSelection`, `SelectionBox`, `StripGeometry`, `WeekStart`.

New props, every one defaulting to 1.5.0 behaviour: `visibleDays` (7), `paging`,
`selection` (null), `selectionLabels` ({}), `allDayAlways` (false) across
`SdCalendar` / `SdCalendarWeekGrid` / `SdCalendarDayGrid` /
`SdCalendarAllDayBand`; `weekStartsOn` (1) and `visibleDays` (7) on `SdDateNav`.

`visibleDays` narrows the week grid to a rolling window, which is what makes a
week view usable on a phone. Set it on `SdCalendar` and it threads to both the
grid and the nav; set it on the two directly only if you assemble them yourself,
and then set it on both, or the header will name a week the columns do not show.

## What to verify on the consumer side

1. **Week view, tap a time cell** on every page that opens a create form from
   the calendar. Confirm the form prefills the tapped time. If your `@day-click`
   handler substituted a fixed hour (09:00, 18:00, 19:00), that default is now
   dead in week view and the real time is used instead. Confirm that is wanted.
2. **Month view at `size="touch"`**, if you have one. The day-number circle and
   the chip treatment both changed.
3. **Any modal with a long title.** The close button should be 32px and square,
   and the title should wrap.
4. **One disabled button per variant family**, and a disabled checkbox, radio and
   toggle in both their on and off states.
5. **A disabled link button** (`SdButton` with `href`), if you have one: it is no
   longer keyboard-navigable, which is the fix.

### SaniDesk specifics

`SdCalendar` is used in four files, all in `apps/web`: `pages/termine/index.vue`,
`pages/kurse/index.vue`, `pages/reservierungen/index.vue` and
`pages/kiosk/reservations.vue`. The first three already wire `@slot-click`
alongside `@day-click`, so the break degrades gracefully and the only visible
consequence is that the create form prefills the tapped time instead of a
hardcoded 09:00 / 18:00 / 19:00. `kiosk/reservations.vue` listens to neither, so
it is inert. None of the four sets `allDay` on its events, so the `allDayClick`
change reaches nothing. None sets `color` on its events, so the month/day colour
unification is a no-op on colour for SaniDesk; the padding and accent-bar
changes still apply, and `kiosk/reservations.vue` runs `size="touch"`.

`SdModal` is used in 30 files (28 in `apps/web`, 2 in `apps/sanimail-web`); all
inherit the close-button fix with no code change. `SdBottomSheet` is used in 3.
`apps/sanimail-web` uses no calendar component at all, so its exposure is
`SdModal`, `SdBottomSheet` and the disabled restyle.

Both apps scan `./node_modules/@sanibase/ui/dist/**` in their Tailwind config.
The new arbitrary and utility classes in the bundle (`pl-[7px]`, `pl-[10px]`,
`w-[3px]`, `mr-[3px]`, `line-clamp-2`, `line-clamp-3`, `break-words`,
`overflow-clip`, `self-stretch`, `min-w-0`) are all core Tailwind 3.3 or later
and generate against the installed 3.4.x.
