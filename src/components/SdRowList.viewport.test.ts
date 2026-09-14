// @vitest-environment jsdom
// ---------------------------------------------------------------------------
// A virtualised list that starts out LOADING must still measure its viewport.
//
// The bug this pins shut was one line, `if (!el) return` inside an onMounted,
// and it broke every virtualised list that renders a skeleton first. The
// scroll element is the third branch of the v-if chain in the template, so
// while `loading` is true it does not exist: the early return fired,
// `viewportHeight` stayed 0, the ResizeObserver was never created, and nothing
// ever looked again.
//
// WHAT THAT COSTS IS NOT OBVIOUS FROM THE LINE. With `viewportHeight` at 0 the
// window degenerates -- `ceil(0 / pitch)` is 0 -- so the visible rows come out
// of the overscan budget and the list renders `overscan * 2 + 1` rows however
// tall it is. A phone showing ten rows with the default overscan of six
// renders thirteen, against a spacer sized for the whole list, so the bottom
// is blank and fills one row at a time as you scroll. It was reported as
// "it loads too late", and nothing was being loaded at all.
//
// The assertion is therefore about RENDERED ROWS and not about a private ref:
// a list that renders every row it has is the thing the user is promised.
// ---------------------------------------------------------------------------

import { afterEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import SdRowList from './SdRowList.vue';

/** jsdom has no ResizeObserver, and the component builds one. */
class StubResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = StubResizeObserver;

afterEach(() => {
  document.body.innerHTML = '';
});

const ITEM_HEIGHT = 72;
const VIEWPORT = 720;

/** jsdom reports 0 for every layout box, so clientHeight is stubbed. */
function stubViewport(height: number): void {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get() {
      return this.className?.includes?.('overflow-y-auto') ? height : 0;
    },
  });
}

function rows(n: number): { id: number }[] {
  return Array.from({ length: n }, (_, i) => ({ id: i }));
}

/**
 * Counted off the document rather than off the wrapper.
 *
 * The component's root is a v-if chain, so its root node is a fragment and
 * `findAll` reaches for a vm that is not there. What matters is how many rows
 * are in the page, which is also what a user counts.
 */
function rendered(): number {
  return document.body.querySelectorAll('[role="row"]').length;
}

describe('a virtualised list that starts out loading', () => {
  it('renders every row once the data arrives, not overscan * 2 + 1', async () => {
    stubViewport(VIEWPORT);
    // Mounted LOADING, which is how every real list starts: the scroll element
    // does not exist yet, so this is the case the old onMounted gave up on.
    const wrapper = mount(SdRowList, {
      attachTo: document.body,
      props: {
        items: [] as { id: number }[],
        loading: true,
        virtualized: true,
        semantics: 'grid' as const,
        ariaLabel: 'rows',
        itemHeight: ITEM_HEIGHT,
        gap: 0,
        overscan: 6,
        itemKey: (item: unknown) => String((item as { id: number }).id),
      },
    });
    expect(rendered()).toBe(0);

    await wrapper.setProps({ loading: false, items: rows(18) });
    await nextTick();
    await nextTick();

    // Ten rows fit in 720px and eighteen exist, so with a measured viewport
    // the whole list is inside the window and every row is drawn. With the
    // viewport stuck at 0 this is 13, and the last five rows are the blank
    // strip the owner photographed.
    expect(rendered()).toBe(18);
  });

  it('still renders the whole list when it is mounted with its rows already there', async () => {
    // THE CONTROL. This case always worked, because the scroll element exists
    // at mount. If it ever stops working the fix above has broken the path it
    // was not meant to touch.
    stubViewport(VIEWPORT);
    const wrapper = mount(SdRowList, {
      attachTo: document.body,
      props: {
        items: rows(18),
        loading: false,
        virtualized: true,
        semantics: 'grid' as const,
        ariaLabel: 'rows',
        itemHeight: ITEM_HEIGHT,
        gap: 0,
        overscan: 6,
        itemKey: (item: unknown) => String((item as { id: number }).id),
      },
    });
    await nextTick();
    await nextTick();
    expect(rendered()).toBe(18);
  });
});
