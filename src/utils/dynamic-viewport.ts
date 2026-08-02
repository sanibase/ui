/**
 * Dynamic viewport height, with a fallback that the library actually ships.
 *
 * `100vh` is the *large* viewport height: the height the page would have if
 * every retractable browser UI were retracted. On a phone with the URL bar
 * showing, a `100vh` element is taller than the visible area, and whatever sits
 * at its bottom edge — a bottom navigation, a sheet footer, a sign-out button —
 * is under the browser chrome or the gesture bar. `100dvh` tracks the viewport
 * as it actually is. SaniMail UX §3 states the requirement in those words:
 * "`100dvh`, never `h-screen`".
 *
 * ## Why the fallback is a declaration string
 *
 * The fallback has to be shipped rather than assumed. Writing `class="h-screen"`
 * next to an inline `height: 100dvh` reads like a fallback, but `.h-screen` is
 * a *consumer* Tailwind utility — this package's own `dist/ui.css` contains no
 * such rule, because its Tailwind config has `content: []` and emits nothing. A
 * consumer that does not scan `@sanibase/ui/dist` with Tailwind, or does not use
 * Tailwind at all, gets no fallback: on an engine without `dvh` the declaration
 * is dropped and the element collapses to `height: auto`.
 *
 * So the fallback travels with the component, as two declarations of the same
 * property in one inline style string. Vue assigns a string style to
 * `element.style.cssText`, and Nuxt's SSR writes it into the `style` attribute
 * verbatim, so in both cases it is the browser's CSS parser that reads it — and
 * a parser keeps the last declaration it can parse and discards the rest. That
 * is the same mechanism a stylesheet uses, and unlike an object binding it
 * survives server rendering, where only one value per property can exist.
 *
 * **Order is the entire mechanism**: `vh` first, `dvh` second. Reversed, the
 * fallback wins everywhere and the fix silently does nothing on the devices it
 * was written for, while looking correct on every desktop.
 */

/** `[fallback, preferred]`, in the order a CSS parser must read them. */
export type ViewportHeightValue = [string, string];

/**
 * A viewport-relative length with a `vh` fallback under a `dvh` preference.
 *
 * @param percent Share of the viewport height, 0-100.
 * @param minus   Optional CSS length subtracted from both, e.g. `'2rem'`.
 */
export function dvhWithFallback(percent = 100, minus?: string): ViewportHeightValue {
  if (minus) {
    return [`calc(${percent}vh - ${minus})`, `calc(${percent}dvh - ${minus})`];
  }
  return [`${percent}vh`, `${percent}dvh`];
}

/**
 * Both declarations for one property, cascade order, ready for a style string.
 *
 * `dvhDeclarations('height')` → `'height:100vh;height:100dvh'`
 */
export function dvhDeclarations(property: string, percent = 100, minus?: string): string {
  const [fallback, preferred] = dvhWithFallback(percent, minus);
  return `${property}:${fallback};${property}:${preferred}`;
}

/** Full dynamic viewport height. The shell, the phone drawer. */
export const FULL_VIEWPORT_HEIGHT = dvhDeclarations('height');

/**
 * Join declarations into an inline style string, dropping the ones a condition
 * switched off. Conditional declarations are written as `cond && 'a:b'`, so a
 * `false` has to be filtered rather than serialised.
 */
export function styleText(...declarations: (string | false | null | undefined)[]): string {
  return declarations.filter((d): d is string => Boolean(d)).join(';');
}
