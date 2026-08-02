import { describe, expect, it } from 'vitest';
import {
  dvhDeclarations,
  dvhWithFallback,
  FULL_VIEWPORT_HEIGHT,
  styleText,
} from './dynamic-viewport';

describe('dvhWithFallback', () => {
  it('puts the vh fallback FIRST and the dvh preference SECOND', () => {
    // The load-bearing assertion. A CSS parser keeps the last declaration it
    // understands; reversed, `vh` would overwrite `dvh` on every engine and the
    // fix would be a no-op that still passes a desktop eyeball test.
    const [fallback, preferred] = dvhWithFallback(100);
    expect(fallback).toBe('100vh');
    expect(preferred).toBe('100dvh');
  });

  it('defaults to the full viewport', () => {
    expect(dvhWithFallback()).toEqual(['100vh', '100dvh']);
  });

  it('carries a percentage through to both values', () => {
    expect(dvhWithFallback(85)).toEqual(['85vh', '85dvh']);
    expect(dvhWithFallback(50)).toEqual(['50vh', '50dvh']);
  });

  it('subtracts a fixed length from both values via calc()', () => {
    expect(dvhWithFallback(100, '2rem')).toEqual([
      'calc(100vh - 2rem)',
      'calc(100dvh - 2rem)',
    ]);
  });
});

describe('dvhDeclarations', () => {
  it('emits the property twice, fallback first', () => {
    expect(dvhDeclarations('height')).toBe('height:100vh;height:100dvh');
  });

  it('works for any length property', () => {
    expect(dvhDeclarations('max-height', 85)).toBe('max-height:85vh;max-height:85dvh');
  });

  it('keeps calc() intact', () => {
    expect(dvhDeclarations('height', 100, '2rem')).toBe(
      'height:calc(100vh - 2rem);height:calc(100dvh - 2rem)',
    );
  });

  it('backs the exported full-height constant', () => {
    expect(FULL_VIEWPORT_HEIGHT).toBe('height:100vh;height:100dvh');
  });
});

describe('styleText', () => {
  it('joins declarations with semicolons', () => {
    expect(styleText('a:1', 'b:2')).toBe('a:1;b:2');
  });

  it('drops switched-off declarations rather than serialising false', () => {
    expect(styleText('a:1', false, 'b:2', undefined, null)).toBe('a:1;b:2');
  });

  it('keeps a multi-declaration fragment whole', () => {
    expect(styleText(FULL_VIEWPORT_HEIGHT, 'padding-top:0px')).toBe(
      'height:100vh;height:100dvh;padding-top:0px',
    );
  });

  it('is empty when everything is switched off', () => {
    expect(styleText(false, undefined)).toBe('');
  });
});
