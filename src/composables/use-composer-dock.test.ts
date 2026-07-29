import { beforeEach, describe, expect, it } from 'vitest';
import { useComposerDock } from './use-composer-dock';

// The store is a module-scope singleton on purpose (that is what makes a draft
// survive a route change), so each test starts by emptying it.
const dock = useComposerDock();

beforeEach(() => {
  dock.closeAll();
});

describe('useComposerDock', () => {
  it('opens a composer in the normal state and makes it active', () => {
    const id = dock.open({ title: 'Bestellung KW 31' });
    expect(dock.count.value).toBe(1);
    expect(dock.get(id)?.state).toBe('normal');
    expect(dock.activeId.value).toBe(id);
  });

  it('keeps windows in open order', () => {
    dock.open({ id: 'a' });
    dock.open({ id: 'b' });
    expect(dock.composers.value.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('re-opening the same draft brings it forward instead of duplicating it', () => {
    dock.open({ id: 'draft-9', title: 'Re: Rechnung 4471' });
    dock.collapse('draft-9');
    dock.open({ id: 'other' });

    const id = dock.open({ id: 'draft-9' });

    expect(dock.count.value).toBe(2);
    expect(id).toBe('draft-9');
    expect(dock.get('draft-9')?.state).toBe('normal');
    expect(dock.activeId.value).toBe('draft-9');
  });

  it('stamps recency so the newest window wins the expanded budget', () => {
    dock.open({ id: 'a' });
    dock.open({ id: 'b' });
    dock.focus('a');
    expect(dock.get('a')!.touchedAt).toBeGreaterThan(dock.get('b')!.touchedAt);
  });

  it('allows only one maximised window', () => {
    dock.open({ id: 'a' });
    dock.open({ id: 'b' });
    dock.maximize('a');
    dock.maximize('b');
    expect(dock.get('a')?.state).toBe('normal');
    expect(dock.get('b')?.state).toBe('maximized');
  });

  it('toggles between collapsed and normal', () => {
    const id = dock.open({});
    dock.toggleCollapse(id);
    expect(dock.get(id)?.state).toBe('collapsed');
    dock.toggleCollapse(id);
    expect(dock.get(id)?.state).toBe('normal');
  });

  it('expanding a maximised window returns it to normal, not to collapsed', () => {
    const id = dock.open({});
    dock.maximize(id);
    dock.expand(id);
    expect(dock.get(id)?.state).toBe('normal');
  });

  it('hands the dock to the most recent survivor when the active window closes', () => {
    dock.open({ id: 'a' });
    dock.open({ id: 'b' });
    dock.open({ id: 'c' });
    dock.focus('a');
    dock.close('a');
    expect(dock.activeId.value).toBe('c');
  });

  it('clears the active window when the last one closes', () => {
    const id = dock.open({});
    dock.close(id);
    expect(dock.activeId.value).toBeNull();
    expect(dock.count.value).toBe(0);
  });

  it('carries the draft on the window, where a route change cannot reach it', () => {
    const id = dock.open({ data: { subject: 'Bestellung KW 31', body: 'Guten Tag' } });
    dock.update(id, { data: { subject: 'Bestellung KW 31', body: 'Guten Tag Herr Bühler' } });
    // A second call site — a different page, after navigation — sees the same
    // store, because it is module scope rather than component state.
    const elsewhere = useComposerDock();
    expect(elsewhere.get(id)?.data).toEqual({
      subject: 'Bestellung KW 31',
      body: 'Guten Tag Herr Bühler',
    });
  });

  it('ignores operations on an id that is not open', () => {
    expect(() => {
      dock.close('nope');
      dock.focus('nope');
      dock.collapse('nope');
      dock.update('nope', { title: 'x' });
    }).not.toThrow();
    expect(dock.count.value).toBe(0);
  });

  it('generates unique ids', () => {
    const ids = [dock.open({}), dock.open({}), dock.open({})];
    expect(new Set(ids).size).toBe(3);
  });
});
