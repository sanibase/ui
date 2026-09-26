// ---------------------------------------------------------------------------
// Money entry in integer cents (Rappen).
//
// One rule, owned here so the price field and a consumer's paste parser can
// never read the same string two ways:
//
//   - Digits only are Rappen. `1900` is 1900 (CHF 19.00), `19` is 19
//     (CHF 0.19). This is what a till operator types and what SdPriceInput
//     has always done.
//   - A `.` or `,` means francs. What stands before it is francs, what stands
//     after it is Rappen, at most two digits: `19.5` and `19,50` are 1950,
//     `19.05` is 1905, `.5` is 50.
//   - Swiss dash notation closes the Rappen: `19.-`, `19.--`, `19.–` are 1900.
//   - An apostrophe or a space is thousands grouping, so it means francs too:
//     `1'900` is 190000, `1 900.50` is 190050. Grouping is strict (first group
//     one to three digits, every later group exactly three) because a stray
//     mark is more likely a typo than a number, and a typo must be refused
//     rather than read as something else.
//   - A leading `CHF`, `Fr.` or `SFr.` means francs. Whoever writes the
//     currency in front of an amount is writing francs, not Rappen:
//     `CHF 1900` is 190000, `CHF 19` is 1900, `CHF 19.00` is 1900.
//
// Pasted data is the one place bare digits mean francs. A spreadsheet drops
// the `.00`, so a column of prices arrives as `19`, `4.5`, `1900`. A host
// reading such a paste asks for that with `{ bare: 'francs' }`: then `19` is
// 1900 and `1900` is 190000, and every other string reads exactly as above.
// Typing never does this; the till types Rappen.
//
// Anything else is refused (`null`): a third decimal (`19.555`, and `1.900`,
// which could be either a thousand francs or 1.90 and so is neither), a
// negative, letters, a number too large to hold exactly. The arithmetic is
// string concatenation, never a float.
// ---------------------------------------------------------------------------

// Grouping marks: the ASCII apostrophe, the typographic one (U+2019) that
// `Intl.NumberFormat('de-CH')` emits and iOS smart punctuation substitutes,
// a space, a no-break space and a narrow no-break space (U+202F).
const GROUP = "['\u2019 \u00A0\u202F]";
const INT = `(?:\\d{1,3}(?:${GROUP}\\d{3})+|\\d+)`;
// Hyphen-minus, a doubled one, an en dash or an em dash.
const DASH = '(?:--?|\u2013|\u2014)';

const DIGITS = /^\d+$/;
const GROUP_MARKS = new RegExp(GROUP, 'g');

/** A complete amount: francs with an optional separator and tail, or a bare `.5`. */
const COMPLETE = new RegExp(`^(?:(${INT})(?:[.,](\\d{1,2}|${DASH})?)?|[.,](\\d{1,2}))$`);

/**
 * Everything that is, or can still become, a complete amount by typing more
 * at its end. `1'9` is here (it becomes `1'900`), `19.555` is not (no amount
 * starts that way), and neither is `.-` (a dash needs francs before it).
 */
const DRAFT = new RegExp(
  `^(?:${INT}(?:[.,](?:\\d{0,2}|${DASH}))?|[.,]\\d{0,2}|\\d{1,3}(?:${GROUP}\\d{3})*${GROUP}\\d{0,2})?$`,
);

// Followed by a digit or a separator, so a bare `Fr` is not eaten on its own.
const CURRENCY_PREFIX = /^(?:CHF|S?FR\.?)\s*(?=[\d.,])/i;

/** Drops a leading `CHF` / `Fr.` / `SFr.` (any case) and the space after it. */
export function stripCurrencyPrefix(text: string): string {
  return text.replace(CURRENCY_PREFIX, '');
}

/**
 * What digits with no separator and no grouping mean.
 *
 *  - `'rappen'`: what is typed into a price field. `1900` is CHF 19.00.
 *  - `'francs'`: what is pasted from a spreadsheet, which drops `.00`.
 *    `19` is CHF 19.00, `1900` is CHF 1900.00.
 */
export type MoneyBareDigits = 'rappen' | 'francs';

export interface ParseMoneyOptions {
  /** What bare digits mean. Default `'rappen'`, the rule of the price field. */
  bare?: MoneyBareDigits;
}

/** Reads a string that is already trimmed and free of a currency prefix. */
function readAmount(text: string, bare: MoneyBareDigits = 'rappen'): number | null {
  if (DIGITS.test(text)) {
    const cents = Number(bare === 'francs' ? `${text}00` : text);
    return Number.isSafeInteger(cents) ? cents : null;
  }
  const match = COMPLETE.exec(text);
  if (!match) return null;
  const francs = (match[1] ?? '').replace(GROUP_MARKS, '');
  const tail = match[2] ?? match[3] ?? '';
  const rappen = /^\d/.test(tail) ? tail.padEnd(2, '0') : '00';
  const cents = Number(`${francs || '0'}${rappen}`);
  return Number.isSafeInteger(cents) ? cents : null;
}

/**
 * Reads a complete money string into integer cents, or `null` when it is not
 * one. See the rule at the top of this file; in short, digits only are
 * Rappen, and a separator, a grouping mark or a currency in front means
 * francs. `{ bare: 'francs' }` reads digits only as francs too, for a paste
 * from a spreadsheet.
 *
 * ```ts
 * parseMoneyToCents('1900')      // 1900  (CHF 19.00)
 * parseMoneyToCents('19')        // 19    (CHF 0.19)
 * parseMoneyToCents('19,5')      // 1950
 * parseMoneyToCents('19.-')      // 1900
 * parseMoneyToCents("1'900.50")  // 190050
 * parseMoneyToCents('CHF 19.00') // 1900
 * parseMoneyToCents('CHF 1900')  // 190000
 * parseMoneyToCents('19.555')    // null
 * parseMoneyToCents('')          // null
 *
 * parseMoneyToCents('19', { bare: 'francs' })   // 1900
 * parseMoneyToCents('1900', { bare: 'francs' }) // 190000
 * parseMoneyToCents('19.5', { bare: 'francs' }) // 1950, as without the option
 * ```
 */
export function parseMoneyToCents(input: string, options: ParseMoneyOptions = {}): number | null {
  if (typeof input !== 'string') return null;
  const text = input.trim();
  const amount = stripCurrencyPrefix(text).trim();
  // A currency written in front is francs whatever was asked for.
  const bare: MoneyBareDigits = amount !== text || options?.bare === 'francs' ? 'francs' : 'rappen';
  return readAmount(amount, bare);
}

/**
 * Integer cents as `francs.RR` with no grouping: `1900` is `19.00`, `5` is
 * `0.05`, `-150` is `-1.50`. A fraction of a cent is truncated. This is the
 * canonical form `parseMoneyToCents` reads back to the same number.
 */
export function formatCents(cents: number): string {
  if (!Number.isFinite(cents)) return '0.00';
  const whole = Math.trunc(cents);
  const abs = Math.abs(whole);
  const sign = whole < 0 ? '-' : '';
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/**
 * What a partly typed amount is worth. Used by SdPriceInput to decide, per
 * keystroke, whether the text may stand and what to emit. Not exported from
 * the package: a consumer holding a finished string wants `parseMoneyToCents`.
 *
 *  - `accepted: false`: no amount starts this way (a third decimal, a letter,
 *    a dash with no francs) or it is too large to hold. Refuse the keystroke.
 *  - `cents: number`: the value. For every complete amount this is exactly
 *    `parseMoneyToCents(draft)`; a draft with no digits yet (`''`, `.`) is 0,
 *    an empty field, as it has always been. Digits only are Rappen here:
 *    a draft is typed, and a currency prefix is the caller's to read.
 *  - `cents: null`: may stand, but is not an amount yet (`1'`, `1'9`), so
 *    nothing is emitted until it is.
 *
 * The draft is read as it stands: not trimmed and no currency prefix removed.
 */
export type MoneyDraft = { accepted: false } | { accepted: true; cents: number | null };

export function readMoneyDraft(draft: string): MoneyDraft {
  if (!DRAFT.test(draft)) return { accepted: false };
  if (!/\d/.test(draft)) return { accepted: true, cents: 0 };
  const cents = readAmount(draft);
  if (cents !== null) return { accepted: true, cents };
  // A complete shape that still did not read is a number too large to hold.
  if (DIGITS.test(draft) || COMPLETE.test(draft)) return { accepted: false };
  return { accepted: true, cents: null };
}
