# Migration: `@sanibase/ui` 1.5.x maintenance line

`release/1.5.x` is `v1.5.0` plus the price-entry change and nothing else, for a
consumer that pins 1.5.0 and is not ready for the main line. It publishes under
the `v1-maint` dist-tag, so installing without a version still gets the main
line. The main line carries the same change as 1.16.0, and its `MIGRATION.md`
also covers everything between 1.5.0 and 1.13.0.

## 1.5.1: price entry, a separator means francs (same change as 1.16.0)

`SdPriceInput` keeps its props, emits and model (integer cents), so nothing
shows in a type error. What changes is what the typed or pasted text is worth.
The rule lives in `parseMoneyToCents` (`src/utils/money.ts`), which the field
reads through.

- **Digits only are still Rappen**, right-filled exactly as before: `1900` is
  CHF 19.00, `19` is CHF 0.19. A till typed this way sees no change.
- **A `.` or `,` now means francs.** It used to be dropped silently and the
  digits read as cents, so `19.5` was CHF 1.95. Now `19.5` and `19,50` are
  CHF 19.50, `.5` is CHF 0.50, and the Swiss `19.-` is CHF 19.00. On the
  on-screen numpad, `2`, `0`, `.` then more digits is CHF 20 and those Rappen.
- **An apostrophe or space is thousands grouping** and means francs, strictly in
  threes: `1'900` is CHF 1900.00, `19'00` is refused rather than guessed.
- **A leading `CHF`, `Fr.` or `SFr.` means francs**: a pasted `CHF 1900` is
  CHF 1900.00, `CHF 19.00` is CHF 19.00.
- **Refused**: a third decimal (`19.555`, and the ambiguous `1.900`), letters.
  A refused keystroke does not land. A refused paste keeps the previous value
  and shows the error border and `aria-invalid` until the next edit.
- An untouched stored value (after focus, blur or Enter) still takes a digit
  typed at its end into its cents (`19.00` then `5` is 190.05), but a separator
  typed there is refused rather than read as CHF 1900.
- The field still emits on every accepted keystroke. A half-typed group (`1'9`)
  emits nothing until it is complete.

New exports: `parseMoneyToCents(input, options?)`, `formatCents(cents)`, and
the types `ParseMoneyOptions` and `MoneyBareDigits`. A host that parses an
amount itself (a paste, a native input) should call `parseMoneyToCents`
instead of `parseFloat`, so it cannot disagree with the field. For a column of
prices pasted from a spreadsheet, which drops `.00`, pass `{ bare: 'francs' }`:
then `19` is 1900 and `1900` is 190000, and every other string reads as above.

**What to verify on the consumer side**: a price typed as digits only (must be
unchanged), `19.5` typed and on the numpad (CHF 19.50), and any code of your own
that pre-processed the field's text or relied on `.` being ignored.
