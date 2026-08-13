import { describe, expect, it } from 'vitest';
import { eventPalette } from './event-colour';

describe('eventPalette', () => {
  describe('without a colour of its own', () => {
    it('paints from the status tokens and sets no inline style', () => {
      const p = eventPalette(undefined, 'confirmed');
      expect(p.surfaceClass).toContain('bg-sd-success-light');
      expect(p.accentClass).toBe('bg-sd-success');
      expect(p.textClass).toBe('text-sd-success-text');
      expect(p.surfaceStyle).toBeUndefined();
      expect(p.accentStyle).toBeUndefined();
      expect(p.textStyle).toBeUndefined();
    });

    it('defaults to confirmed', () => {
      expect(eventPalette(undefined)).toEqual(eventPalette(undefined, 'confirmed'));
    });

    it('gives each status its own tokens', () => {
      expect(eventPalette(undefined, 'pending').accentClass).toBe('bg-sd-warning');
      expect(eventPalette(undefined, 'tentative').accentClass).toBe('bg-sd-purple/50');
      expect(eventPalette(undefined, 'cancelled').accentClass).toBe('bg-sd-error/40');
    });
  });

  describe('with a colour of its own', () => {
    // This is the regression the whole module exists for: month view painted
    // `confirmed` green and ignored the calendar's colour, so the same event
    // was blue in week and green in month.
    it('lets the colour win over the status, leaving no token classes behind', () => {
      const p = eventPalette('#3b82f6', 'confirmed');
      expect(p.surfaceClass).toBe('');
      expect(p.accentClass).toBe('');
      expect(p.textClass).toBe('');
      expect(p.accentStyle).toEqual({ backgroundColor: '#3b82f6' });
      expect(p.textStyle).toEqual({ color: '#3b82f6' });
    });

    it('dilutes a six-digit hex by appending an alpha pair', () => {
      const p = eventPalette('#3b82f6', 'confirmed');
      expect(p.surfaceStyle).toEqual({
        backgroundColor: '#3b82f614',
        borderColor: '#3b82f64D',
      });
    });

    it('dilutes anything that is not a six-digit hex with color-mix', () => {
      // `rgb(59,130,246)14` is not a colour; it used to be what this produced.
      const p = eventPalette('rgb(59,130,246)');
      expect(p.surfaceStyle?.backgroundColor).toBe(
        'color-mix(in srgb, rgb(59,130,246) 8%, transparent)',
      );
      expect(p.surfaceStyle?.borderColor).toBe(
        'color-mix(in srgb, rgb(59,130,246) 30%, transparent)',
      );
    });

    it('treats a hex with an alpha pair already on it as not-a-plain-hex', () => {
      expect(eventPalette('#3b82f680').surfaceStyle?.backgroundColor).toBe(
        'color-mix(in srgb, #3b82f680 8%, transparent)',
      );
    });
  });

  describe('cancelled', () => {
    it('strikes the title through whether or not the event is coloured', () => {
      expect(eventPalette(undefined, 'cancelled').titleDecoration).toBe('line-through');
      expect(eventPalette('#3b82f6', 'cancelled').titleDecoration).toBe('line-through');
    });

    it('leaves every other status undecorated', () => {
      for (const status of ['confirmed', 'pending', 'tentative'] as const) {
        expect(eventPalette('#3b82f6', status).titleDecoration).toBe('');
      }
    });
  });
});
