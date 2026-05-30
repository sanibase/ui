/**
 * Phone number normalization + display formatting.
 *
 * Storage contract: every saved phone number is E.164 (`+41791234567`). The
 * UI calls `normalizePhone(raw)` immediately before sending to the API and
 * `formatPhone(stored)` when rendering, so the operator can type the number
 * in any reasonable shape (local Swiss with leading zero, international with
 * `00`, with or without spaces / hyphens / parens) and the saved row stays
 * canonical.
 *
 * Swiss-default — if no country code is detected, the number is assumed CH
 * and `+41` is prepended. Numbers that already carry a country code are
 * preserved unchanged.
 */

/**
 * Strip all formatting characters except an optional leading `+` and digits.
 * `+41 79 123 45 67` → `+41791234567`. `(0)79-123 45 67` → `0791234567`.
 */
function stripFormatting(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  // Preserve leading `+` if present, otherwise drop everything non-digit.
  const lead = trimmed[0] === '+' ? '+' : '';
  return lead + trimmed.replace(/[^\d]/g, '');
}

/**
 * Normalize a user-typed phone number to E.164. Returns the canonical string
 * (`+41791234567`) or `null` if the input is empty / unparseable.
 *
 * Rules:
 *   `+XXX...`     → keep as-is (already E.164)
 *   `00XXX...`    → replace `00` with `+`
 *   `0XXXXXXXXX`  → assume Swiss, replace `0` with `+41`
 *   `41XXXXXXXXX` → prepend `+`
 *   else          → return null (operator typed something unrecognizable)
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = stripFormatting(String(raw));
  if (!cleaned) return null;

  if (cleaned.startsWith('+')) {
    // Already E.164-like — basic sanity: at least 8 digits after the +.
    const digits = cleaned.slice(1);
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  }

  if (cleaned.startsWith('00')) {
    const digits = cleaned.slice(2);
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  }

  // Swiss local form: 0XXXXXXXXX (10 digits total).
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+41${cleaned.slice(1)}`;
  }

  // Swiss international without `+`: 41XXXXXXXXX (11 digits).
  if (cleaned.startsWith('41') && cleaned.length === 11) {
    return `+${cleaned}`;
  }

  // Other country codes typed without `+` (e.g. `49...` for DE) — accept
  // anything 8-15 digits as international.
  if (/^[1-9]\d{7,14}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  return null;
}

/**
 * Format a stored E.164 number for display. Swiss numbers render as
 * `+41 79 123 45 67`; everything else groups digits in trailing pairs after
 * the country code.
 *
 * Falls back to the raw value if it can't be parsed — so legacy unstored
 * input still renders rather than disappearing.
 */
export function formatPhone(stored: string | null | undefined): string {
  if (!stored) return '';
  const value = String(stored).trim();
  if (!value) return '';

  // If not E.164-shaped, attempt one normalization pass; if that fails too,
  // return the raw input so the operator can still see what's there.
  const canonical = value.startsWith('+') ? stripFormatting(value) : (normalizePhone(value) ?? '');
  if (!canonical.startsWith('+')) return value;

  // Swiss: +41 + 9 digits → "+41 79 123 45 67"
  if (canonical.startsWith('+41') && canonical.length === 12) {
    const d = canonical.slice(3);
    return `+41 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
  }

  // German: +49 + 10-11 digits → "+49 30 12345678" (rough)
  if (canonical.startsWith('+49') && canonical.length >= 11) {
    const d = canonical.slice(3);
    return `+49 ${d.slice(0, 3)} ${d.slice(3)}`;
  }

  // Generic fallback — split country code (1-3 digits) + remainder.
  const m = /^\+(\d{1,3})(\d+)$/.exec(canonical);
  if (!m) return canonical;
  const cc = m[1];
  const rest = m[2] ?? '';
  // Group rest as pairs from the right; readable but unopinionated.
  const pairs: string[] = [];
  for (let i = rest.length; i > 0; i -= 2) {
    pairs.unshift(rest.slice(Math.max(0, i - 2), i));
  }
  return `+${cc} ${pairs.join(' ')}`;
}
