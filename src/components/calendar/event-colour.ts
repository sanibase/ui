// ---------------------------------------------------------------------------
// HOW A CALENDAR EVENT IS COLOURED, IN ONE PLACE.
//
// This file exists because there were two places and they disagreed.
// SdCalendarEvent (the block the day and week grids draw) honoured
// `event.color`; SdCalendarMonth painted its own chips from `event.status`
// alone and never looked at the colour at all. The visible result was that
// accepting an invitation into a blue calendar drew a blue block in day, three
// days and week, and a GREEN one in month, green being what `confirmed` maps
// to. Nothing was wrong with the data: the month grid simply had a second
// opinion about colour.
//
// The fix is not a third opinion. Both components now ask this module, so a
// change to the status palette or to the alpha of a fill lands in every view at
// once and a view cannot drift again.
//
// WHY THE SHAPE IS "CLASSES OR STYLE" RATHER THAN JUST COLOURS: an event
// WITHOUT a colour of its own is painted from the design tokens as Tailwind
// utilities, which is how the rest of the package works and what lets a
// consumer restyle the tokens. An event WITH a colour carries an arbitrary CSS
// colour that no utility can express, so it has to be an inline style. The
// caller therefore gets both fields and binds both; exactly one of them is ever
// populated.
// ---------------------------------------------------------------------------

import type { EventStatus } from './types';

/**
 * Alpha applied to an event's own colour for the block fill, as a hex pair.
 * 0x14 is 20/255, near enough 8%: a tint that reads as the calendar's colour
 * without fighting the text drawn on top of it in that same colour.
 */
const FILL_ALPHA_HEX = '14';
const FILL_ALPHA_PCT = '8%';

/** Alpha for the block's border. 0x4D is 77/255, near enough 30%. */
const BORDER_ALPHA_HEX = '4D';
const BORDER_ALPHA_PCT = '30%';

interface StatusTokens {
  fill: string;
  border: string;
  accent: string;
  text: string;
}

/**
 * The token palette for an event with no colour of its own.
 *
 * `confirmed` being green is the reason the month bug looked like a hardcoded
 * green: every event the host had not coloured, and every event in a view that
 * ignored the colour, landed here.
 */
const STATUS_TOKENS: Record<EventStatus, StatusTokens> = {
  confirmed: {
    fill: 'bg-sd-success-light',
    border: 'border-sd-success/30',
    accent: 'bg-sd-success',
    text: 'text-sd-success-text',
  },
  pending: {
    fill: 'bg-sd-warning-light',
    border: 'border-sd-warning/30',
    accent: 'bg-sd-warning',
    text: 'text-sd-warning-text',
  },
  tentative: {
    fill: 'bg-sd-purple-subtle/60',
    border: 'border-dashed border-sd-purple/40',
    accent: 'bg-sd-purple/50',
    text: 'text-sd-purple-dark',
  },
  cancelled: {
    fill: 'bg-sd-error-light/60',
    border: 'border-sd-error/20',
    accent: 'bg-sd-error/40',
    text: 'text-sd-error-text',
  },
};

export interface EventPalette {
  /** Fill + border utilities. Empty when the event carries its own colour. */
  surfaceClass: string;
  /** Accent-bar utility. Empty when the event carries its own colour. */
  accentClass: string;
  /** Text-colour utility. Empty when the event carries its own colour. */
  textClass: string;
  /** Fill + border, set only when the event carries its own colour. */
  surfaceStyle?: { backgroundColor: string; borderColor: string };
  /** Accent bar, set only when the event carries its own colour. */
  accentStyle?: { backgroundColor: string };
  /** Text colour, set only when the event carries its own colour. */
  textStyle?: { color: string };
  /** `line-through` for a cancelled event, whatever it is coloured. */
  titleDecoration: string;
}

/**
 * Dilute a CSS colour.
 *
 * The fast path appends a hex alpha pair, which is what this package did before
 * and is exact for the `#rrggbb` that CalDAV and the tenant colour pickers
 * produce. Anything else -- `rgb(...)`, a named colour, a `var(--x)` -- would
 * have become the literal garbage `rgb(0,0,0)14` and painted nothing, so it
 * goes through `color-mix` instead, which is the same result by another route.
 */
function dilute(color: string, hexAlpha: string, percent: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color)
    ? `${color}${hexAlpha}`
    : `color-mix(in srgb, ${color} ${percent}, transparent)`;
}

/**
 * Resolve how one event is painted.
 *
 * The event's own colour wins over its status for the fill, the border, the
 * accent and the text. Status still decides the strike-through, because
 * "cancelled" is a fact about the event that its calendar's colour does not
 * carry and must not hide.
 */
export function eventPalette(
  color: string | undefined,
  status: EventStatus = 'confirmed',
): EventPalette {
  const tokens = STATUS_TOKENS[status] ?? STATUS_TOKENS.confirmed;
  const titleDecoration = status === 'cancelled' ? 'line-through' : '';

  if (!color) {
    return {
      surfaceClass: `${tokens.fill} ${tokens.border}`,
      accentClass: tokens.accent,
      textClass: tokens.text,
      titleDecoration,
    };
  }

  return {
    surfaceClass: '',
    accentClass: '',
    textClass: '',
    surfaceStyle: {
      backgroundColor: dilute(color, FILL_ALPHA_HEX, FILL_ALPHA_PCT),
      borderColor: dilute(color, BORDER_ALPHA_HEX, BORDER_ALPHA_PCT),
    },
    accentStyle: { backgroundColor: color },
    textStyle: { color },
    titleDecoration,
  };
}
