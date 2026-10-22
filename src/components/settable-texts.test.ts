// @vitest-environment jsdom
// ---------------------------------------------------------------------------
// The words a component draws are the host's to set. The library carries no
// i18n, so every user-visible or announced string is a prop (or a key of a
// labels object), defaulting to the English it has always shipped. Until
// 1.22.0 these were literals in the template, and a German host had no way to
// replace them short of a DOM patch.
//
// For each one, two assertions: without the prop the text is exactly what it
// was (so no consumer that passes nothing sees a change), and with the prop the
// host's text renders in its place. SdSelect and SdDataTable are covered in
// their own spec files.
// ---------------------------------------------------------------------------

import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import SdDateNav from './SdDateNav.vue';
import SdCalendar from './SdCalendar.vue';
import SdBulkActionBar from './SdBulkActionBar.vue';
import SdCheckboxGrid from './SdCheckboxGrid.vue';
import SdHoursGrid, { type DaySchedule } from './SdHoursGrid.vue';
import SdImageUpload from './SdImageUpload.vue';
import SdPriceVariants from './SdPriceVariants.vue';
import SdPrintOverlay from './SdPrintOverlay.vue';
import SdSwissMap from './SdSwissMap.vue';
import SdGeoMap from './SdGeoMap.vue';

let mounted: VueWrapper[] = [];
afterEach(() => {
  for (const w of mounted) w.unmount();
  mounted = [];
  document.body.innerHTML = '';
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each spec mounts a different component
function track<T extends VueWrapper<any>>(w: T): T {
  mounted.push(w);
  return w;
}

const DATE = new Date(2026, 9, 22);

describe('SdDateNav arrow labels', () => {
  const arrows = (w: VueWrapper) => {
    const buttons = w.findAll('button');
    return [buttons[0]!.attributes('aria-label'), buttons[2]!.attributes('aria-label')];
  };

  it('names the arrows "Previous" and "Next" by default', () => {
    const w = track(mount(SdDateNav, { props: { modelValue: DATE } }));
    expect(arrows(w)).toEqual(['Previous', 'Next']);
  });

  it('takes labels.previous and labels.next, beside the labels it already took', () => {
    const w = track(mount(SdDateNav, {
      props: { modelValue: DATE, labels: { today: 'Heute', previous: 'Zurück', next: 'Weiter' } },
    }));
    expect(arrows(w)).toEqual(['Zurück', 'Weiter']);
    expect(w.findAll('button')[1]!.text()).toBe('Heute');
  });

  it('keeps the English default for an arrow the host leaves out', () => {
    const w = track(mount(SdDateNav, { props: { modelValue: DATE, labels: { previous: 'Zurück' } } }));
    expect(arrows(w)).toEqual(['Zurück', 'Next']);
  });

  it('reaches the nav through SdCalendar\'s navLabels', () => {
    const w = track(mount(SdCalendar, {
      props: { date: DATE, viewMode: 'month', events: [], navLabels: { previous: 'Zurück', next: 'Weiter' } },
    }));
    expect(arrows(w.findComponent(SdDateNav))).toEqual(['Zurück', 'Weiter']);
  });
});

describe('SdBulkActionBar texts', () => {
  const bar = () => document.body.querySelector('.fixed') as HTMLElement;

  it('says "N selected" and "Clear" by default', () => {
    track(mount(SdBulkActionBar, { props: { count: 3 }, attachTo: document.body }));
    expect(bar().querySelector('span')!.textContent!.trim()).toBe('3 selected');
    expect(bar().querySelector('button')!.textContent!.trim()).toBe('Clear');
  });

  it('puts the count into the host\'s line, and takes the host\'s clear label', () => {
    track(mount(SdBulkActionBar, {
      props: { count: 3, selectedLabel: '{count} ausgewählt', clearLabel: 'Aufheben' },
      attachTo: document.body,
    }));
    expect(bar().querySelector('span')!.textContent!.trim()).toBe('3 ausgewählt');
    expect(bar().querySelector('button')!.textContent!.trim()).toBe('Aufheben');
  });
});

describe('SdCheckboxGrid selectAllLabel', () => {
  const options = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }];

  it('labels the select-all box "Select all" by default', () => {
    const w = track(mount(SdCheckboxGrid, { props: { options } }));
    expect(w.text()).toContain('Select all');
  });

  it('takes the host\'s label', () => {
    const w = track(mount(SdCheckboxGrid, { props: { options, selectAllLabel: 'Alle auswählen' } }));
    expect(w.text()).toContain('Alle auswählen');
    expect(w.text()).not.toContain('Select all');
  });
});

describe('SdHoursGrid removePeriodLabel', () => {
  const schedule: DaySchedule[] = [
    { day: 'Mo', enabled: true, periods: [{ open: '08:00', close: '12:00' }, { open: '13:00', close: '18:00' }] },
  ];
  const removeLabels = (w: VueWrapper) =>
    w.findAll('button[aria-label]').map((b) => b.attributes('aria-label'));

  // The time pickers are PrimeVue's DatePicker, which needs matchMedia; they
  // carry none of the texts asserted here.
  const global = { stubs: { SdDatePicker: true } };

  it('names each remove button "Remove period" by default', () => {
    const w = track(mount(SdHoursGrid, { props: { modelValue: schedule }, global }));
    expect(removeLabels(w)).toEqual(['Remove period', 'Remove period']);
  });

  it('takes the host\'s name', () => {
    const w = track(mount(SdHoursGrid, {
      props: { modelValue: schedule, removePeriodLabel: 'Zeitraum entfernen' },
      global,
    }));
    expect(removeLabels(w)).toEqual(['Zeitraum entfernen', 'Zeitraum entfernen']);
  });
});

describe('SdImageUpload texts', () => {
  const withImage = (props: Record<string, unknown> = {}) =>
    track(mount(SdImageUpload, { props: { modelValue: 'https://example.test/a.png', ...props } }));

  const drop = async (w: VueWrapper, file: File) => {
    await w.find('[style*="aspect-ratio"]').trigger('drop', { dataTransfer: { files: [file] } });
    return w.emitted('error')?.[0]?.[0];
  };
  const big = () => new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'a.png', { type: 'image/png' });
  const pdf = () => new File(['%PDF'], 'a.pdf', { type: 'application/pdf' });

  it('draws "Preview" and "Remove" by default', () => {
    const w = withImage();
    expect(w.find('img').attributes('alt')).toBe('Preview');
    expect(w.find('button').text()).toBe('Remove');
  });

  it('takes the host\'s alt text and remove label', () => {
    const w = withImage({ previewAlt: 'Vorschau', removeLabel: 'Entfernen' });
    expect(w.find('img').attributes('alt')).toBe('Vorschau');
    expect(w.find('button').text()).toBe('Entfernen');
  });

  it('emits the English errors by default', async () => {
    expect(await drop(withImage(), pdf())).toBe('File must be an image.');
    expect(await drop(withImage({ maxSize: 2 * 1024 * 1024 }), big())).toBe('File must be under 2MB.');
  });

  it('emits the host\'s errors, with the limit put into {max}', async () => {
    expect(await drop(withImage({ errorNotImage: 'Nur Bilder' }), pdf())).toBe('Nur Bilder');
    expect(await drop(withImage({ maxSize: 2 * 1024 * 1024, errorTooLarge: 'Höchstens {max} MB' }), big()))
      .toBe('Höchstens 2 MB');
  });
});

describe('SdPriceVariants texts', () => {
  const variants = [{ label: 'Klein', price: '4.50' }, { label: 'Gross', price: '6.00' }];
  const GERMAN = {
    singlePriceLabel: 'Ein Preis',
    addVariantsLabel: 'Varianten',
    variantLabel: 'Variante',
    priceLabel: 'Preis',
    variantPlaceholder: 'z. B. Klein',
    removeVariantLabel: 'Variante entfernen',
    addVariantLabel: '+ Variante',
  };
  const texts = (w: VueWrapper) => ({
    toggle: w.findAll('button')[0]!.text(),
    labels: w.findAll('label').map((l) => l.text()),
    placeholder: w.find('input').attributes('placeholder'),
    remove: w.findAll('button[aria-label]').map((b) => b.attributes('aria-label')),
    add: w.findAll('button').at(-1)!.text(),
  });

  it('draws the English it always has', () => {
    const single = track(mount(SdPriceVariants, { props: {} }));
    expect(single.find('button').text()).toBe('Add variants');
    const multi = track(mount(SdPriceVariants, { props: { multiVariant: true, variants } }));
    expect(texts(multi)).toEqual({
      toggle: 'Single price',
      labels: ['Variant', 'Price'],
      placeholder: 'e.g. Small',
      remove: ['Remove variant', 'Remove variant'],
      add: '+ Add variant',
    });
  });

  it('draws the host\'s words in each place', () => {
    const single = track(mount(SdPriceVariants, { props: GERMAN }));
    expect(single.find('button').text()).toBe('Varianten');
    const multi = track(mount(SdPriceVariants, { props: { ...GERMAN, multiVariant: true, variants } }));
    expect(texts(multi)).toEqual({
      toggle: 'Ein Preis',
      labels: ['Variante', 'Preis'],
      placeholder: 'z. B. Klein',
      remove: ['Variante entfernen', 'Variante entfernen'],
      add: '+ Variante',
    });
  });
});

describe('SdPrintOverlay printLabel', () => {
  const printButton = () =>
    [...document.body.querySelectorAll('button')].at(-1)!.textContent!.trim();

  it('says "Print" by default', () => {
    track(mount(SdPrintOverlay, { props: { open: true }, attachTo: document.body }));
    expect(printButton()).toBe('Print');
  });

  it('takes the host\'s label', () => {
    track(mount(SdPrintOverlay, { props: { open: true, printLabel: 'Drucken' }, attachTo: document.body }));
    expect(printButton()).toBe('Drucken');
  });
});

describe('map ariaLabel', () => {
  // The map draws once its geo chunk has been imported.
  const label = async (w: VueWrapper) => {
    await vi.waitFor(async () => {
      await flushPromises();
      expect(w.find('svg[role="img"]').exists()).toBe(true);
    }, { timeout: 5000 });
    return w.get('svg[role="img"]').attributes('aria-label');
  };

  it('SdSwissMap: "Visitor map of Switzerland" by default, the host\'s when given', async () => {
    expect(await label(track(mount(SdSwissMap, { props: { points: [] } })))).toBe('Visitor map of Switzerland');
    expect(await label(track(mount(SdSwissMap, { props: { points: [], ariaLabel: 'Besucherkarte Schweiz' } }))))
      .toBe('Besucherkarte Schweiz');
  });

  it('takes a template\'s aria-label="…" as the prop: on the map, not on the wrapper', async () => {
    const w = track(mount(SdSwissMap, { props: { points: [] }, attrs: { 'aria-label': 'Besucherkarte Schweiz' } }));
    expect(await label(w)).toBe('Besucherkarte Schweiz');
    expect(w.attributes('aria-label')).toBeUndefined();
  });

  it('SdGeoMap: the topology\'s English name by default, the host\'s when given', async () => {
    expect(await label(track(mount(SdGeoMap, { props: { topology: 'europe', points: [] } })))).toBe('Visitor map of Europe');
    expect(await label(track(mount(SdGeoMap, { props: { topology: 'world', points: [] } })))).toBe('Visitor world map');
    expect(await label(track(mount(SdGeoMap, { props: { topology: 'world', points: [], ariaLabel: 'Besucher weltweit' } }))))
      .toBe('Besucher weltweit');
  });
});
