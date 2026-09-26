import { describe, expect, it } from 'vitest';
import { formatCents, parseMoneyToCents, readMoneyDraft, stripCurrencyPrefix } from './money';

// Every example the owner decided, verbatim. The table is the contract: a
// change to any row is a change to what a price typed or pasted into SaniDesk
// is worth.
const DECIDED: Array<[string, number]> = [
  // Digits only are Rappen, as the field has always read them.
  ['1900', 1900],
  ['19', 19],
  ['25', 25],
  // A separator means francs.
  ['19.5', 1950],
  ['19,5', 1950],
  ['19.50', 1950],
  ['19,50', 1950],
  ['19.05', 1905],
  ['19.00', 1900],
  ['19,00', 1900],
  ['.5', 50],
  [',50', 50],
  ['0.5', 50],
  // Swiss dash notation.
  ['19.-', 1900],
  ['19.\u2013', 1900],
  ['19,-', 1900],
  // Apostrophe and space are thousands grouping, and mean francs.
  ["1'900", 190000],
  ["1'900.50", 190050],
  ['1 900.50', 190050],
  // A leading currency is ignored.
  ['CHF 19.00', 1900],
  ['Fr. 19.00', 1900],
  ['SFr. 19.00', 1900],
];

describe('parseMoneyToCents, the decided rule', () => {
  it.each(DECIDED)('reads %j as %i', (input, cents) => {
    expect(parseMoneyToCents(input)).toBe(cents);
  });

  it.each(['19.555', '1.900', '1,900', '0.001'])('refuses %j, a third decimal', (input) => {
    // `1.900` is the case that matters: a thousand francs to one reader, 1.90
    // to another, so it is neither.
    expect(parseMoneyToCents(input)).toBeNull();
  });
});

describe('parseMoneyToCents, the edges of the rule', () => {
  it('reads a separator with nothing after it as whole francs', () => {
    expect(parseMoneyToCents('19.')).toBe(1900);
    expect(parseMoneyToCents('19,')).toBe(1900);
    expect(parseMoneyToCents('0.')).toBe(0);
  });

  it('accepts the doubled dash and the em dash as well', () => {
    expect(parseMoneyToCents('19.--')).toBe(1900);
    expect(parseMoneyToCents('19.\u2014')).toBe(1900);
    expect(parseMoneyToCents("1'900.-")).toBe(190000);
  });

  it('needs francs before a dash, and nothing after one', () => {
    expect(parseMoneyToCents('.-')).toBeNull();
    expect(parseMoneyToCents('19.-5')).toBeNull();
    expect(parseMoneyToCents('19.---')).toBeNull();
    expect(parseMoneyToCents('19-')).toBeNull();
  });

  it('takes every grouping mark a Swiss source produces', () => {
    // U+2019 is what Intl.NumberFormat('de-CH') emits and what iOS smart
    // punctuation turns a typed apostrophe into.
    expect(parseMoneyToCents('1\u2019900.50')).toBe(190050);
    expect(parseMoneyToCents(new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2 }).format(1900.5))).toBe(190050);
    expect(parseMoneyToCents('1\u00A0900.50')).toBe(190050);
    expect(parseMoneyToCents('1\u202F900,50')).toBe(190050);
    expect(parseMoneyToCents("1'000'000")).toBe(100000000);
    expect(parseMoneyToCents("12'500,5")).toBe(1250050);
  });

  it('refuses grouping that is not in threes, rather than guessing', () => {
    for (const input of ["19'00", "1'90", "1'9000", "1900'000", "1''900", "'900", "1'", '12 50', "1'900'"]) {
      expect(parseMoneyToCents(input), input).toBeNull();
    }
  });

  it('keeps leading zeros harmless', () => {
    expect(parseMoneyToCents('0019')).toBe(19);
    expect(parseMoneyToCents('019.50')).toBe(1950);
    expect(parseMoneyToCents('0')).toBe(0);
    expect(parseMoneyToCents('0.00')).toBe(0);
  });

  it('ignores surrounding whitespace and the currency in any case', () => {
    expect(parseMoneyToCents('  19.50\t')).toBe(1950);
    expect(parseMoneyToCents('chf 19.50')).toBe(1950);
    expect(parseMoneyToCents('CHF19.50')).toBe(1950);
    expect(parseMoneyToCents('Fr 19.50')).toBe(1950);
    expect(parseMoneyToCents("sfr. 1'900.-")).toBe(190000);
    expect(parseMoneyToCents('CHF .50')).toBe(50);
  });

  it('reads bare digits after a currency as francs, because whoever writes CHF writes francs', () => {
    expect(parseMoneyToCents('CHF 1900')).toBe(190000);
    expect(parseMoneyToCents('CHF 19')).toBe(1900);
    expect(parseMoneyToCents('Fr. 19')).toBe(1900);
    expect(parseMoneyToCents('SFr. 19')).toBe(1900);
    expect(parseMoneyToCents('chf19')).toBe(1900);
    expect(parseMoneyToCents('  CHF 0019 ')).toBe(1900);
    expect(parseMoneyToCents('CHF 0')).toBe(0);
    // With a separator or grouping it already read as francs; nothing moves.
    expect(parseMoneyToCents('CHF 19.00')).toBe(1900);
    expect(parseMoneyToCents('CHF 19.5')).toBe(1950);
    expect(parseMoneyToCents("CHF 1'900")).toBe(190000);
    expect(parseMoneyToCents('CHF .50')).toBe(50);
    // Without the currency, digits only are still Rappen.
    expect(parseMoneyToCents('1900')).toBe(1900);
  });

  it('refuses anything that is not an amount', () => {
    for (const input of ['', '   ', '.', ',', 'CHF', 'CHF ', 'abc', '19a', '-19.50', '+19', '19.50 CHF', '1e3', '19..5', '19.,5', '1.2.3', 'Fr.']) {
      expect(parseMoneyToCents(input), JSON.stringify(input)).toBeNull();
    }
  });

  it('refuses a number too large to hold exactly, rather than rounding it', () => {
    expect(parseMoneyToCents('9007199254740991')).toBe(9007199254740991);
    expect(parseMoneyToCents('9007199254740993')).toBeNull();
    expect(parseMoneyToCents('90071992547409.93')).toBeNull();
  });

  it('refuses a value that is not a string at all', () => {
    expect(parseMoneyToCents(19 as unknown as string)).toBeNull();
    expect(parseMoneyToCents(null as unknown as string)).toBeNull();
  });
});

// A column of prices pasted from a spreadsheet: the sheet drops `.00`, so a
// bare number there is francs. Owner's decision; typing keeps Rappen.
const PASTED_FRANCS: Array<[string, number]> = [
  ['19', 1900],
  ['1900', 190000],
  ['0', 0],
  ['0019', 1900],
  ['  19\t', 1900],
  ['19.5', 1950],
  ['19,50', 1950],
  ['19.05', 1905],
  ['.5', 50],
  ['19.-', 1900],
  ["1'900", 190000],
  ["1'900.50", 190050],
  ['1 900', 190000],
  ['CHF 19', 1900],
  ['CHF 1900', 190000],
  ['CHF 19.00', 1900],
];

describe("parseMoneyToCents with { bare: 'francs' }, for pasted data", () => {
  it.each(PASTED_FRANCS)('reads %j as %i', (input, cents) => {
    expect(parseMoneyToCents(input, { bare: 'francs' })).toBe(cents);
  });

  it('differs from the default on bare digits only', () => {
    for (const [input] of [...DECIDED, ...PASTED_FRANCS]) {
      const typed = parseMoneyToCents(input);
      const pasted = parseMoneyToCents(input, { bare: 'francs' });
      if (/^\s*\d+\s*$/.test(input)) {
        expect(pasted, input).toBe((typed as number) * 100);
      } else {
        expect(pasted, input).toBe(typed);
      }
    }
  });

  it('refuses what the default refuses', () => {
    for (const input of ['', '   ', '.', 'CHF', 'abc', '19a', '-19', '+19', '19.555', '1.900', "19'00", '12 50', '1e3', '19 CHF']) {
      expect(parseMoneyToCents(input, { bare: 'francs' }), JSON.stringify(input)).toBeNull();
    }
  });

  it('refuses francs too large to hold as cents, rather than rounding them', () => {
    expect(parseMoneyToCents('90071992547409', { bare: 'francs' })).toBe(9007199254740900);
    expect(parseMoneyToCents('90071992547410', { bare: 'francs' })).toBeNull();
  });

  it("defaults to Rappen, and reads { bare: 'rappen' } as the default", () => {
    expect(parseMoneyToCents('19', {})).toBe(19);
    expect(parseMoneyToCents('19', { bare: 'rappen' })).toBe(19);
    expect(parseMoneyToCents('19', undefined)).toBe(19);
  });
});

describe('formatCents', () => {
  it('writes the canonical francs.RR', () => {
    expect(formatCents(0)).toBe('0.00');
    expect(formatCents(5)).toBe('0.05');
    expect(formatCents(19)).toBe('0.19');
    expect(formatCents(1900)).toBe('19.00');
    expect(formatCents(1905)).toBe('19.05');
    expect(formatCents(190050)).toBe('1900.50');
  });

  it('keeps the sign of a negative amount and drops a fraction of a cent', () => {
    expect(formatCents(-150)).toBe('-1.50');
    expect(formatCents(-5)).toBe('-0.05');
    expect(formatCents(1950.9)).toBe('19.50');
    expect(formatCents(Number.NaN)).toBe('0.00');
  });

  it('reads back to the same cents through parseMoneyToCents', () => {
    for (const cents of [0, 1, 9, 10, 19, 99, 100, 101, 1900, 1905, 1950, 99999900]) {
      expect(parseMoneyToCents(formatCents(cents)), String(cents)).toBe(cents);
    }
  });
});

describe('stripCurrencyPrefix', () => {
  it('drops a leading currency followed by an amount, and nothing else', () => {
    expect(stripCurrencyPrefix('CHF 19.00')).toBe('19.00');
    expect(stripCurrencyPrefix('SFr. .50')).toBe('.50');
    expect(stripCurrencyPrefix('CHF')).toBe('CHF');
    expect(stripCurrencyPrefix('Fr')).toBe('Fr');
    expect(stripCurrencyPrefix('19 CHF')).toBe('19 CHF');
  });
});

describe('readMoneyDraft, a partly typed amount', () => {
  it('agrees with parseMoneyToCents on every complete amount', () => {
    for (const [input, cents] of DECIDED) {
      const plain = stripCurrencyPrefix(input);
      expect(readMoneyDraft(plain), input).toEqual({ accepted: true, cents });
    }
  });

  it('lets every prefix of a decided amount stand while it is typed', () => {
    for (const [input] of DECIDED) {
      const plain = stripCurrencyPrefix(input);
      for (let i = 0; i <= plain.length; i++) {
        expect(readMoneyDraft(plain.slice(0, i)).accepted, JSON.stringify(plain.slice(0, i))).toBe(true);
      }
    }
  });

  it('counts an empty field and a bare separator as zero', () => {
    expect(readMoneyDraft('')).toEqual({ accepted: true, cents: 0 });
    expect(readMoneyDraft('.')).toEqual({ accepted: true, cents: 0 });
    expect(readMoneyDraft(',')).toEqual({ accepted: true, cents: 0 });
  });

  it('holds an unfinished group without a value', () => {
    expect(readMoneyDraft("1'")).toEqual({ accepted: true, cents: null });
    expect(readMoneyDraft("1'9")).toEqual({ accepted: true, cents: null });
    expect(readMoneyDraft('1 90')).toEqual({ accepted: true, cents: null });
    expect(readMoneyDraft("1'900'")).toEqual({ accepted: true, cents: null });
  });

  it('refuses what no amount starts with', () => {
    for (const draft of ['19.555', '19.5.', '19..', '.-', '19-', '19.-5', "1'90.5", "1900'", 'a', '19a', ' 19', '-']) {
      expect(readMoneyDraft(draft), JSON.stringify(draft)).toEqual({ accepted: false });
    }
  });

  it('refuses a complete amount too large to hold', () => {
    expect(readMoneyDraft('9007199254740993')).toEqual({ accepted: false });
    expect(readMoneyDraft('90071992547409.93')).toEqual({ accepted: false });
  });
});
