// ---------------------------------------------------------------------------
// Composer dock — shared types.
//
// A composer is a *non-modal* window. It does not trap focus, it does not
// scrim the page, and it is never a dialog: the whole point is to leave a
// draft open while you go and look something up (SaniMail UX §6).
// ---------------------------------------------------------------------------

/** The three states a composer window can be put into by the user. */
export type ComposerState = 'normal' | 'maximized' | 'collapsed';

/**
 * One composer window.
 *
 * The draft itself lives in `data` rather than in the host's page component,
 * because the reason this component exists is that a draft has to outlive a
 * route change. Anything the host keeps inside a `<RouterView>` subtree dies
 * on navigation; anything kept here does not.
 */
export interface ComposerWindow {
  id: string;
  /** Title-bar text, typically the subject. Falls back to a placeholder. */
  title: string;
  state: ComposerState;
  /**
   * Monotonic recency stamp, bumped on open and on focus. The dock spends its
   * "three windows at once" budget newest-first, so the window you are typing
   * in is never the one that gets pushed down to a title bar.
   */
  touchedAt: number;
  /**
   * Ask before closing. With this set the dock *emits* `close` and leaves the
   * window standing, so the host can raise its own Verwerfen / Als Entwurf
   * speichern / Abbrechen dialog. Without it, the dock closes the window
   * itself.
   */
  confirmClose?: boolean;
  /** Host payload — the draft. Opaque to the library. */
  data?: Record<string, unknown>;
}

/** What `open()` accepts. `id` is generated when omitted. */
export interface OpenComposerOptions {
  id?: string;
  title?: string;
  state?: ComposerState;
  confirmClose?: boolean;
  data?: Record<string, unknown>;
}

/** Pixel geometry of the dock. Every value is overridable as a prop. */
export interface DockGeometry {
  /** Width of a normal composer, px. 720 in the approved mockup. */
  width: number;
  /** Width of a collapsed title bar, px. */
  collapsedWidth: number;
  /** Margin from the right edge of the viewport, px. */
  edge: number;
  /** Horizontal gap between windows, px. */
  gap: number;
  /** Total height of a normal composer (title bar included), px. */
  height: number;
  /** Height of the title bar, which is also the height of a collapsed window. */
  headerHeight: number;
  /** How many windows may be expanded at once. Three, per §6. */
  maxOpen: number;
  /** Below this viewport width a composer goes full screen. */
  phoneBreakpoint: number;
  /** Upper bound on the width of a maximised composer, px. */
  maxWidth: number;
  /** Space kept clear above a maximised composer, px. */
  topGap: number;
  /**
   * Smallest horizontal step between two collapsed bars once the strip runs
   * out of room, px. Bars overlap like a card stack rather than sliding off
   * the screen, so every draft keeps a clickable, focusable edge.
   */
  collapsedMinStep: number;
  /**
   * Base stacking order. Above the app shell (100) and deliberately below
   * sheets (200) and modals (300), so a Verwerfen dialog raised from inside a
   * composer covers the composer that raised it.
   */
  zIndex: number;
}

/** How one window renders right now. */
export type ComposerVariant = 'normal' | 'maximized' | 'collapsed' | 'fullscreen';

/** The dock's arrangement decision for one window. */
export interface ComposerPlacement {
  id: string;
  variant: ComposerVariant;
  /**
   * True when the window renders collapsed although its own state is not —
   * the three-at-once budget bit, or there was no horizontal room. The
   * window's own state is left untouched, so it springs back open when room
   * appears.
   */
  forced: boolean;
  width: number;
  height: number;
  /** Offset from the right edge of the viewport, px. */
  right: number;
  /** Offset from the bottom edge of the viewport, px. */
  bottom: number;
  zIndex: number;
}
