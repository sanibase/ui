// @vitest-environment jsdom
// ---------------------------------------------------------------------------
// SdSignaturePad mounted under jsdom. jsdom has no canvas, so getContext,
// toBlob and toDataURL are stubbed with a recording context: these specs
// prove the pointer handling, the empty state, the events and the export
// gate. The geometry (smoothing, fit on resize, trimming) has its own pure
// spec in utils/signature-geometry.test.ts.
// ---------------------------------------------------------------------------

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import SdSignaturePad, { type SdSignaturePadExpose } from './SdSignaturePad.vue';

let mounted: VueWrapper[] = [];
let exported: { width: number; height: number; type?: string }[] = [];

function fakeContext(): Record<string, unknown> {
  const noop = (): void => {};
  return {
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    strokeStyle: '',
    fillStyle: '',
    setTransform: noop,
    clearRect: noop,
    fillRect: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    quadraticCurveTo: noop,
    arc: noop,
    stroke: noop,
    fill: noop,
  };
}

beforeEach(() => {
  exported = [];
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => fakeContext() as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
    this: HTMLCanvasElement,
    cb: BlobCallback,
    type?: string,
  ) {
    exported.push({ width: this.width, height: this.height, type });
    cb(new Blob(['png'], { type: type ?? 'image/png' }));
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(function (this: HTMLCanvasElement, type?: string) {
    exported.push({ width: this.width, height: this.height, type });
    return `data:${type ?? 'image/png'};base64,AAAA`;
  });
});

afterEach(() => {
  for (const w of mounted) w.unmount();
  mounted = [];
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

function mountPad(props: Record<string, unknown> = {}) {
  const w = mount(SdSignaturePad, { props, attachTo: document.body });
  mounted.push(w);
  return w;
}

const api = (w: VueWrapper): SdSignaturePadExpose => w.vm as unknown as SdSignaturePadExpose;

function pointer(type: string, x: number, y: number, extra: PointerEventInit = {}): PointerEvent {
  return new PointerEvent(type, {
    pointerId: 1,
    pointerType: 'pen',
    button: 0,
    clientX: x,
    clientY: y,
    bubbles: true,
    cancelable: true,
    ...extra,
  });
}

async function draw(w: VueWrapper, points: [number, number][], extra: PointerEventInit = {}): Promise<void> {
  const c = w.get('canvas').element;
  const [first, ...rest] = points;
  c.dispatchEvent(pointer('pointerdown', first![0], first![1], extra));
  for (const [x, y] of rest) c.dispatchEvent(pointer('pointermove', x, y, extra));
  const last = points[points.length - 1]!;
  c.dispatchEvent(pointer('pointerup', last[0], last[1], extra));
  await w.vm.$nextTick();
}

const clearButton = (w: VueWrapper) => w.get('button.sd-signature-clear');

describe('SdSignaturePad', () => {
  it('starts empty: placeholder shown, clear disabled, no image', async () => {
    const w = mountPad();
    expect(api(w).isEmpty()).toBe(true);
    expect(w.get('.sd-signature-placeholder').text()).toBe('Sign here');
    expect(clearButton(w).attributes('disabled')).toBeDefined();
    expect(clearButton(w).text()).toBe('Clear');
    expect(await api(w).toBlob()).toBeNull();
    expect(api(w).toDataURL()).toBeNull();
    expect(exported).toEqual([]);
  });

  it('names the canvas as an image and takes the host words', () => {
    const w = mountPad({ ariaLabel: 'Unterschrift', clearLabel: 'Löschen', placeholder: 'Hier unterschreiben' });
    const c = w.get('canvas');
    expect(c.attributes('role')).toBe('img');
    expect(c.attributes('aria-label')).toBe('Unterschrift');
    expect(c.attributes('tabindex')).toBeUndefined();
    expect(clearButton(w).text()).toBe('Löschen');
    expect(w.get('.sd-signature-placeholder').text()).toBe('Hier unterschreiben');
    expect(w.get('.sd-signature-placeholder').attributes('aria-hidden')).toBe('true');
  });

  it('a drawn stroke makes it non-empty and emits change', async () => {
    const w = mountPad();
    await draw(w, [
      [20, 30],
      [40, 50],
      [80, 40],
    ]);
    expect(api(w).isEmpty()).toBe(false);
    expect(w.emitted('change')).toEqual([[{ empty: false }]]);
    expect(w.find('.sd-signature-placeholder').exists()).toBe(false);
    expect(clearButton(w).attributes('disabled')).toBeUndefined();
  });

  it('a single tap is a dot and counts as drawn', async () => {
    const w = mountPad();
    await draw(w, [[10, 10]]);
    expect(api(w).isEmpty()).toBe(false);
  });

  it('ignores a second pointer while one is drawing', async () => {
    const w = mountPad();
    const c = w.get('canvas').element;
    c.dispatchEvent(pointer('pointerdown', 10, 10));
    c.dispatchEvent(pointer('pointerdown', 90, 90, { pointerId: 2 }));
    c.dispatchEvent(pointer('pointerup', 90, 90, { pointerId: 2 }));
    expect(w.emitted('change')).toBeUndefined();
    c.dispatchEvent(pointer('pointerup', 10, 10));
    expect(w.emitted('change')).toEqual([[{ empty: false }]]);
  });

  it('ignores a right mouse button', async () => {
    const w = mountPad();
    await draw(w, [[10, 10], [50, 50]], { pointerType: 'mouse', button: 2 });
    expect(api(w).isEmpty()).toBe(true);
    expect(w.emitted('change')).toBeUndefined();
  });

  it('clear() empties it and emits, the button too', async () => {
    const w = mountPad();
    await draw(w, [[20, 30], [60, 70]]);
    api(w).clear();
    await w.vm.$nextTick();
    expect(api(w).isEmpty()).toBe(true);
    expect(w.emitted('change')!.at(-1)).toEqual([{ empty: true }]);
    expect(w.find('.sd-signature-placeholder').exists()).toBe(true);

    await draw(w, [[20, 30], [60, 70]]);
    await clearButton(w).trigger('click');
    expect(api(w).isEmpty()).toBe(true);
    expect(w.emitted('change')!.at(-1)).toEqual([{ empty: true }]);
  });

  it('clear() on an empty pad emits nothing', () => {
    const w = mountPad();
    api(w).clear();
    expect(w.emitted('change')).toBeUndefined();
  });

  it('toBlob() returns a PNG of the trimmed drawing once something is drawn', async () => {
    const w = mountPad();
    await draw(w, [[20, 30], [120, 80]]);
    const blob = await api(w).toBlob();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob!.type).toBe('image/png');
    // Ink 20..120 x 30..80 plus the 2.5 line and an 8 px margin each side, at 2x.
    expect(exported[0]).toEqual({ width: Math.ceil((100 + 2.5 + 16) * 2), height: Math.ceil((50 + 2.5 + 16) * 2), type: 'image/png' });
    expect(api(w).toDataURL('image/jpeg', 0.9)).toBe('data:image/jpeg;base64,AAAA');
  });

  it('disabled ignores input and disables the clear button', async () => {
    const w = mountPad({ disabled: true });
    await draw(w, [[20, 30], [60, 70]]);
    expect(api(w).isEmpty()).toBe(true);
    expect(w.emitted('change')).toBeUndefined();
    expect(clearButton(w).attributes('disabled')).toBeDefined();
    expect(w.get('canvas').attributes('aria-disabled')).toBe('true');
  });

  it('turning disabled on mid-stroke ends the stroke and keeps what was drawn', async () => {
    const w = mountPad();
    const c = w.get('canvas').element;
    c.dispatchEvent(pointer('pointerdown', 10, 10));
    c.dispatchEvent(pointer('pointermove', 40, 40));
    await w.setProps({ disabled: true });
    expect(w.emitted('change')).toEqual([[{ empty: false }]]);
    c.dispatchEvent(pointer('pointermove', 90, 90));
    c.dispatchEvent(pointer('pointerup', 90, 90));
    expect(w.emitted('change')).toHaveLength(1);
    expect(api(w).isEmpty()).toBe(false);
    expect(clearButton(w).attributes('disabled')).toBeDefined();
  });

  it('keeps the page from scrolling under the pen and the clear button at a 44px target', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/SdSignaturePad.vue'), 'utf8');
    expect(source).toMatch(/\.sd-signature-canvas \{[^}]*touch-action: none;/);
    // SdButton size "lg" is 46px high.
    expect(source).toMatch(/size="lg"[\s\S]*class="sd-signature-clear"/);
  });
});
