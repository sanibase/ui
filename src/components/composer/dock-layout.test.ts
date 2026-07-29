import { describe, expect, it } from 'vitest';
import { DEFAULT_DOCK_GEOMETRY as G, layoutComposers, type LayoutWindow } from './dock-layout';

/** The desktop viewport the mockup is drawn at. */
const desktop = { width: 1440, height: 900 };
const wide = { width: 2560, height: 1440 };
const phone = { width: 390, height: 844 };

function win(id: string, state: LayoutWindow['state'], touchedAt?: number): LayoutWindow {
  return { id, state, touchedAt };
}

function byId(list: ReturnType<typeof layoutComposers>, id: string) {
  const p = list.find((x) => x.id === id);
  if (!p) throw new Error(`no placement for ${id}`);
  return p;
}

/** Distance from the right edge of the viewport to a window's left edge. */
function leftExtent(p: { right: number; width: number }) {
  return p.right + p.width;
}

describe('layoutComposers — the mockup geometry', () => {
  it('docks a single composer 26px from the right edge at 720px wide', () => {
    const [p] = layoutComposers([win('a', 'normal')], desktop);
    expect(p).toMatchObject({ variant: 'normal', right: 26, width: 720, bottom: 0, forced: false });
  });

  it('stacks two collapsed bars at right 26 and right 388', () => {
    // Frame 03, second shot: `.comp.mini` at right:26 and `.comp.mini2` at
    // right:388. That is 340px of bar plus a 22px gap.
    const out = layoutComposers([win('a', 'collapsed'), win('b', 'collapsed')], desktop);
    expect(byId(out, 'a').right).toBe(26);
    expect(byId(out, 'b').right).toBe(388);
    expect(byId(out, 'b').width).toBe(340);
  });

  it('places a title bar to the left of an open composer', () => {
    const out = layoutComposers([win('a', 'normal', 5), win('b', 'collapsed', 1)], desktop);
    expect(byId(out, 'a').right).toBe(26);
    expect(byId(out, 'b').right).toBe(26 + 720 + 22);
  });

  it('collapses a window to just its title bar height', () => {
    const [p] = layoutComposers([win('a', 'collapsed')], desktop);
    expect(p.height).toBe(G.headerHeight);
    expect(p.variant).toBe('collapsed');
    expect(p.forced).toBe(false);
  });
});

describe('layoutComposers — three at once', () => {
  it('opens three composers side by side when the screen is wide enough', () => {
    const out = layoutComposers([win('a', 'normal'), win('b', 'normal'), win('c', 'normal')], wide);
    expect(out.map((p) => p.variant)).toEqual(['normal', 'normal', 'normal']);
    expect(out.map((p) => p.right)).toEqual([26, 768, 1510]);
    expect(leftExtent(out[2]!)).toBeLessThanOrEqual(wide.width - G.edge);
  });

  it('never opens more than three, and keeps the newest three', () => {
    const out = layoutComposers(
      [win('a', 'normal', 1), win('b', 'normal', 2), win('c', 'normal', 3), win('d', 'normal', 4)],
      wide,
    );
    expect(byId(out, 'a').variant).toBe('collapsed');
    expect(byId(out, 'a').forced).toBe(true);
    expect(['b', 'c', 'd'].map((id) => byId(out, id).variant)).toEqual(['normal', 'normal', 'normal']);
  });

  it('collapses what does not fit rather than running off the left edge', () => {
    // Three 720px windows need 2196px. At 1440 only one of them fits.
    const out = layoutComposers(
      [win('a', 'normal', 1), win('b', 'normal', 2), win('c', 'normal', 3)],
      desktop,
    );
    expect(out.map((p) => p.variant)).toEqual(['collapsed', 'collapsed', 'normal']);
    expect(out.every((p) => leftExtent(p) <= desktop.width - G.edge)).toBe(true);
  });

  it('keeps the window you last touched open, not the one you opened first', () => {
    const out = layoutComposers(
      [win('a', 'normal', 90), win('b', 'normal', 10), win('c', 'normal', 20)],
      desktop,
    );
    expect(byId(out, 'a').variant).toBe('normal');
    expect(byId(out, 'b').variant).toBe('collapsed');
    expect(byId(out, 'c').variant).toBe('collapsed');
  });

  it('marks a forced collapse as forced and a chosen one as not', () => {
    const out = layoutComposers(
      [win('a', 'collapsed', 1), win('b', 'normal', 2), win('c', 'normal', 3)],
      desktop,
    );
    expect(byId(out, 'a').forced).toBe(false); // the user collapsed it
    expect(byId(out, 'b').forced).toBe(true); // no room left
  });
});

describe('layoutComposers — overflow', () => {
  it('overlaps title bars instead of pushing a draft off the screen', () => {
    const out = layoutComposers(
      [
        win('a', 'collapsed', 1),
        win('b', 'collapsed', 2),
        win('c', 'collapsed', 3),
        win('d', 'collapsed', 4),
        win('e', 'normal', 5),
      ],
      desktop,
    );
    // Every bar stays inside the viewport, and the strip ends exactly on the
    // left margin.
    expect(Math.max(...out.map(leftExtent))).toBeLessThanOrEqual(desktop.width - G.edge);
    // Overlapped, but each one still shows a grabbable edge.
    const bars = out.filter((p) => p.variant === 'collapsed').map((p) => p.right).sort((x, y) => x - y);
    for (let i = 1; i < bars.length; i += 1) {
      expect(bars[i]! - bars[i - 1]!).toBeGreaterThanOrEqual(G.collapsedMinStep);
    }
  });

  it('keeps the strip on screen with an open composer between two bars', () => {
    // The leftmost window contributes its whole width, not a step. Spreading
    // the overflow over it too leaves the strip hanging off the screen — which
    // it did, visibly, before this was fixed.
    const out = layoutComposers(
      [win('a', 'collapsed', 1), win('b', 'normal', 9), win('c', 'collapsed', 2)],
      { width: 1280, height: 720 },
    );
    expect(byId(out, 'b').variant).toBe('normal');
    expect(Math.max(...out.map(leftExtent))).toBeLessThanOrEqual(1280 - G.edge);
  });

  it('keeps every window on screen across a spread of viewports and mixes', () => {
    const states: Array<LayoutWindow['state']> = ['normal', 'collapsed', 'maximized'];
    for (const width of [768, 1024, 1280, 1440, 1920, 2560]) {
      for (let n = 1; n <= 5; n += 1) {
        for (let seed = 0; seed < states.length ** 2; seed += 1) {
          const list = Array.from({ length: n }, (_, i) =>
            win(`w${i}`, states[(seed + i) % states.length]!, i),
          );
          const out = layoutComposers(list, { width, height: 900 });
          const overflow = out.filter((p) => leftExtent(p) > width - G.edge);
          expect({ width, n, seed, overflow }).toEqual({ width, n, seed, overflow: [] });
        }
      }
    }
  });

  it('does not compress anything when the strip already fits', () => {
    const out = layoutComposers([win('a', 'collapsed'), win('b', 'collapsed')], desktop);
    expect(byId(out, 'b').right - byId(out, 'a').right).toBe(G.collapsedWidth + G.gap);
  });

  it('puts the most recent window on top of the stack', () => {
    const out = layoutComposers(
      [win('a', 'collapsed', 1), win('b', 'collapsed', 9), win('c', 'collapsed', 5)],
      desktop,
    );
    expect(byId(out, 'b').zIndex).toBeGreaterThan(byId(out, 'c').zIndex);
    expect(byId(out, 'c').zIndex).toBeGreaterThan(byId(out, 'a').zIndex);
  });
});

describe('layoutComposers — maximised', () => {
  it('takes the maximised window out of the strip and centres it', () => {
    const out = layoutComposers([win('a', 'maximized'), win('b', 'collapsed')], desktop);
    const a = byId(out, 'a');
    expect(a.variant).toBe('maximized');
    expect(a.width).toBe(G.maxWidth);
    expect(a.right).toBe((1440 - G.maxWidth) / 2);
    expect(a.height).toBe(900 - G.topGap);
    // The bar underneath re-flows to the corner rather than holding a slot.
    expect(byId(out, 'b').right).toBe(G.edge);
  });

  it('allows only one maximised window; the rest fall back to the strip', () => {
    const out = layoutComposers([win('a', 'maximized', 1), win('b', 'maximized', 2)], wide);
    expect(byId(out, 'b').variant).toBe('maximized');
    expect(byId(out, 'a').variant).toBe('normal');
  });

  it('stacks the maximised window above everything else', () => {
    const out = layoutComposers([win('a', 'maximized', 1), win('b', 'normal', 9)], wide);
    expect(byId(out, 'a').zIndex).toBeGreaterThan(byId(out, 'b').zIndex);
  });

  it('counts against the three-window budget', () => {
    const out = layoutComposers(
      [win('a', 'normal', 1), win('b', 'normal', 2), win('c', 'normal', 3), win('d', 'maximized', 4)],
      wide,
    );
    expect(byId(out, 'a').variant).toBe('collapsed');
    expect(byId(out, 'b').variant).toBe('normal');
    expect(byId(out, 'd').variant).toBe('maximized');
  });
});

describe('layoutComposers — phone', () => {
  it('goes full screen under the breakpoint', () => {
    const out = layoutComposers([win('a', 'normal')], phone);
    expect(out[0]).toMatchObject({ variant: 'fullscreen', width: 390, height: 844, right: 0, bottom: 0 });
  });

  it('shows one composer full screen and stacks the rest as bars', () => {
    const out = layoutComposers(
      [win('a', 'normal', 1), win('b', 'collapsed', 2), win('c', 'normal', 3)],
      phone,
    );
    expect(byId(out, 'c').variant).toBe('fullscreen');
    expect(byId(out, 'a').variant).toBe('collapsed');
    expect(byId(out, 'a').bottom).toBe(0);
    expect(byId(out, 'b').bottom).toBe(G.headerHeight);
    expect(byId(out, 'a').width).toBe(phone.width);
  });

  it('shows only title bars when every draft is collapsed', () => {
    const out = layoutComposers([win('a', 'collapsed'), win('b', 'collapsed')], phone);
    expect(out.every((p) => p.variant === 'collapsed')).toBe(true);
  });
});

describe('layoutComposers — degenerate input', () => {
  it('returns nothing for an empty dock', () => {
    expect(layoutComposers([], desktop)).toEqual([]);
  });

  it('does not collapse every draft on an unmeasured viewport', () => {
    // First paint, before the resize observer has fired. Reading width 0 as
    // "no room" would flash every open composer down to a title bar.
    const out = layoutComposers([win('a', 'normal')], { width: 0, height: 0 });
    expect(out[0]!.variant).toBe('normal');
    expect(out[0]!.height).toBe(G.height);
  });

  it('never renders a composer taller than the viewport', () => {
    const out = layoutComposers([win('a', 'normal')], { width: 1440, height: 500 });
    expect(out[0]!.height).toBe(500 - G.topGap);
  });

  it('keeps output in open order so the DOM matches the strip', () => {
    const out = layoutComposers(
      [win('a', 'normal', 3), win('b', 'maximized', 9), win('c', 'collapsed', 1)],
      wide,
    );
    expect(out.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });
});
