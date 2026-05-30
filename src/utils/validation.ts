/**
 * Validation regexes used by the form-validation composable.
 *
 * NOTE: @sanibase is presentational-only and must carry no domain dependency.
 * These four regexes were previously imported from @sanidesk/types; they are
 * inlined here so the design system has zero ties to any product's domain
 * package. If a consuming product needs the same regexes on its backend, it
 * keeps its own copy — @sanibase does not depend on, or export to, any product.
 */

/** Email — requires a TLD of at least 2 characters. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Phone — international or local, 6-20 digits with optional leading + and common separators. */
export const PHONE_RE = /^\+?[\d\s\-()]{6,20}$/;

/** Slug — lowercase letters, digits, hyphens. Cannot start/end with hyphen. */
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/** URL — http/https only, anything non-whitespace after the protocol. */
export const URL_RE = /^https?:\/\/[^\s]+$/;
