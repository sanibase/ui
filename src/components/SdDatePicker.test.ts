// @vitest-environment jsdom
// ---------------------------------------------------------------------------
// SdDatePicker, the one calendar (SaniDesk SD-596, owner 2026-11-23).
//
// PrimeVue's DatePicker still draws the grid, the keyboard and the aria; the
// kit marks its cells with data attributes that its stylesheet reads. jsdom
// applies no stylesheet, so these specs assert the marks (and the classes
// PrimeVue sets), not the colours: muted days, the week band and the "von bis"
// band with its filled ends, blocked days, the legend only when given, today,
// the chosen day, the month view's current month; and that the props every
// SaniDesk field uses (popup, range, date + time, time only, inline month,
// touch) still render.
//
// Today is pinned to Monday 23.11.2026 (the day of the approved mockup).
// ---------------------------------------------------------------------------

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { h } from 'vue';
import PrimeVue from 'primevue/config';
import SdDatePicker from './SdDatePicker.vue';
import { bandKeys, bandPart, dayKey } from './date-picker-days';

window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 23, 10, 0));
});
afterAll(() => {
  vi.useRealTimers();
});

/** The part of the locale table SaniDesk fills for German (Monday first). */
const DE = {
  firstDayOfWeek: 1,
  dayNamesMin: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  monthNamesShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
};

let mounted: VueWrapper[] = [];
afterEach(() => {
  for (const w of mounted) w.unmount();
  mounted = [];
  document.body.innerHTML = '';
});

function mountPicker(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
  const w = mount(SdDatePicker, {
    props: { inline: true, modelValue: new Date(2026, 10, 18), ...props },
    slots,
    global: { plugins: [[PrimeVue, { locale: DE }]] },
    attachTo: document.body,
  });
  mounted.push(w);
  return w;
}

/** The cell of a day of the month shown (never a neighbouring month's). */
function cell(w: VueWrapper, day: number) {
  const found = w
    .findAll('td.p-datepicker-day-cell:not(.p-datepicker-other-month)')
    .find((td) => td.find('.p-datepicker-day').text() === String(day));
  if (!found) throw new Error(`no cell for day ${day}`);
  return found;
}

describe('SdDatePicker: the look every field shares', () => {
  it('draws the panel with the kit class over the PrimeVue grid, Monday first from the locale', () => {
    const w = mountPicker();
    const panel = w.find('.p-datepicker-panel');
    expect(panel.classes()).toContain('sd-calendar');
    expect(panel.classes()).toContain('sd-calendar-md');
    expect(w.findAll('.p-datepicker-weekday').map((d) => d.text())).toEqual(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']);
    // November 2026 has 30 days, all drawn from PrimeVue's own grid.
    expect(w.findAll('td.p-datepicker-day-cell:not(.p-datepicker-other-month)')).toHaveLength(30);
  });

  it('marks today (23.11.) for the orange ring, and only today', () => {
    const w = mountPicker();
    const today = w.findAll('td.p-datepicker-today');
    expect(today).toHaveLength(1);
    expect(today[0].find('.p-datepicker-day').text()).toBe('23');
  });

  it('fills the chosen day and emits a picked one', async () => {
    const w = mountPicker();
    const chosen = w.findAll('.p-datepicker-day-selected');
    expect(chosen).toHaveLength(1);
    expect(chosen[0].text()).toBe('18');
    expect(chosen[0].attributes('aria-selected')).toBe('true');
    await cell(w, 26).find('.p-datepicker-day').trigger('click');
    const sent = w.emitted('update:modelValue')?.at(-1)?.[0] as Date;
    expect(dayKey(sent)).toBe('2026-11-26');
  });

  it('keeps the neighbouring months in the DOM (keyboard) but marks them for hiding', () => {
    const w = mountPicker();
    // 1.11.2026 is a Sunday: six October days lead the first row.
    const first = w.find('tbody tr').findAll('td');
    expect(first.slice(0, 6).every((td) => td.classes().includes('p-datepicker-other-month'))).toBe(true);
    // Each still holds its day, so an arrow key stepping onto it finds an element.
    expect(first.slice(0, 6).every((td) => td.find('.p-datepicker-day').exists())).toBe(true);
    expect(w.findAll('td.p-datepicker-other-month[data-sd-muted]')).toHaveLength(0);
  });

  it('draws no legend when none is given', () => {
    const w = mountPicker();
    expect(w.find('[data-testid="sd-datepicker-legend"]').exists()).toBe(false);
  });
});

describe('SdDatePicker: mutedDates', () => {
  it('marks muted days, from ISO strings and Dates alike, and leaves them pickable', async () => {
    const w = mountPicker({ mutedDates: ['2026-11-17', new Date(2026, 10, 1, 15, 30), 'not a day'] });
    expect(w.findAll('td[data-sd-muted]')).toHaveLength(2);
    expect(cell(w, 17).attributes('data-sd-muted')).toBe('');
    expect(cell(w, 1).attributes('data-sd-muted')).toBe('');
    expect(cell(w, 17).find('.p-datepicker-day').classes()).not.toContain('p-disabled');
    await cell(w, 17).find('.p-datepicker-day').trigger('click');
    expect(dayKey(w.emitted('update:modelValue')?.at(-1)?.[0] as Date)).toBe('2026-11-17');
  });

  it('reads the muted label out after the day number', () => {
    const w = mountPicker({ mutedDates: ['2026-11-17'], mutedLabel: 'no session' });
    expect(cell(w, 17).attributes('aria-label')).toBe('17, no session');
    expect(cell(w, 17).attributes('title')).toBe('no session');
    expect(cell(w, 18).attributes('title')).toBeUndefined();
  });
});

describe('SdDatePicker: highlightRange', () => {
  it('draws a week as a band, ends not filled, a muted day inside still marked muted', () => {
    const w = mountPicker({
      modelValue: new Date(2026, 10, 19),
      highlightRange: { start: '2026-11-16', end: '2026-11-22' },
      mutedDates: ['2026-11-17'],
    });
    const band = w.findAll('td[data-sd-band]');
    expect(band.map((td) => td.find('.p-datepicker-day').text())).toEqual(['16', '17', '18', '19', '20', '21', '22']);
    expect(band.every((td) => td.attributes('data-sd-band') === 'week')).toBe(true);
    expect(cell(w, 16).attributes('data-sd-band-start')).toBe('');
    expect(cell(w, 22).attributes('data-sd-band-end')).toBe('');
    expect(w.findAll('td[data-sd-fill]')).toHaveLength(0);
    expect(cell(w, 17).attributes('data-sd-muted')).toBe('');
  });

  it('fills the ends of a "von bis" band', () => {
    const w = mountPicker({
      modelValue: null,
      highlightRange: { start: new Date(2026, 10, 18), end: new Date(2026, 10, 10), fillEnds: true },
    });
    const band = w.findAll('td[data-sd-band="range"]');
    expect(band).toHaveLength(9);
    expect(w.findAll('td[data-sd-fill]').map((td) => td.find('.p-datepicker-day').text())).toEqual(['10', '18']);
    expect(cell(w, 10).attributes('data-sd-band-start')).toBe('');
    expect(cell(w, 18).attributes('data-sd-band-end')).toBe('');
  });

  it('cuts a band at the month edge, never onto the hidden neighbouring days', () => {
    const w = mountPicker({ highlightRange: { start: '2026-11-30', end: '2026-12-06' } });
    expect(w.findAll('td[data-sd-band]')).toHaveLength(1);
    expect(cell(w, 30).attributes('data-sd-band-start')).toBe('');
    expect(cell(w, 30).attributes('data-sd-band-end')).toBe('');
  });

  it('follows a complete value of a range field by itself', () => {
    const w = mountPicker({ range: true, modelValue: [new Date(2026, 10, 10), new Date(2026, 10, 12)] });
    expect(w.findAll('td[data-sd-band="range"]')).toHaveLength(3);
    expect(w.findAll('td[data-sd-fill]')).toHaveLength(2);
    // PrimeVue still owns the selection: the ends are its chosen days.
    expect(w.findAll('.p-datepicker-day-selected').map((s) => s.text())).toEqual(['10', '12']);
  });

  it('draws no band for a range field still waiting for its end', () => {
    const w = mountPicker({ range: true, modelValue: [new Date(2026, 10, 10), null] });
    expect(w.findAll('td[data-sd-band]')).toHaveLength(0);
  });
});

describe('SdDatePicker: disabledDates', () => {
  it('blocks the given days through PrimeVue: not pickable, aria-disabled', async () => {
    const w = mountPicker({ disabledDates: ['2026-11-20', new Date(2026, 10, 21)] });
    const day = cell(w, 20).find('.p-datepicker-day');
    expect(day.classes()).toContain('p-disabled');
    expect(day.attributes('aria-disabled')).toBe('true');
    expect(cell(w, 21).find('.p-datepicker-day').classes()).toContain('p-disabled');
    expect(cell(w, 22).find('.p-datepicker-day').classes()).not.toContain('p-disabled');
    await day.trigger('click');
    expect(w.emitted('update:modelValue')).toBeUndefined();
  });
});

describe('SdDatePicker: legend', () => {
  it('draws the swatch lines in a row and the notes under them, only when given', () => {
    const w = mountPicker({
      legend: [
        { label: 'chosen', swatch: 'selected' },
        { label: 'today', swatch: 'today' },
        { label: 'Light: the till was closed.' },
      ],
    });
    const legend = w.find('[data-testid="sd-datepicker-legend"]');
    expect(legend.exists()).toBe(true);
    // Inside the panel, so it travels with the popup.
    expect(w.find('.p-datepicker-panel [data-testid="sd-datepicker-legend"]').exists()).toBe(true);
    expect(legend.findAll('.sd-calendar-legend-mark').map((m) => m.text())).toEqual(['chosen', 'today']);
    expect(legend.find('.sd-calendar-swatch-selected').exists()).toBe(true);
    expect(legend.find('.sd-calendar-swatch-today').exists()).toBe(true);
    expect(legend.findAll('.sd-calendar-legend-note').map((n) => n.text())).toEqual(['Light: the till was closed.']);
  });

  it('takes a slot in place of the lines', () => {
    const w = mountPicker({}, { legend: () => h('span', { class: 'own' }, 'own legend') });
    expect(w.find('[data-testid="sd-datepicker-legend"] .own').text()).toBe('own legend');
  });
});

describe('SdDatePicker: month view', () => {
  it('draws twelve months, the chosen one filled and the current month marked', () => {
    const w = mountPicker({ mode: 'month', modelValue: new Date(2026, 9, 1) });
    const months = w.findAll('.p-datepicker-month');
    expect(months).toHaveLength(12);
    expect(months.map((m) => m.text().trim().slice(0, 3))).toEqual(DE.monthNamesShort);
    expect(months[9].classes()).toContain('p-datepicker-month-selected');
    expect(months[10].attributes('data-sd-current')).toBe('');
    expect(w.findAll('.p-datepicker-month[data-sd-current]')).toHaveLength(1);
  });

  it('marks no month as current in another year', () => {
    const w = mountPicker({ mode: 'month', modelValue: new Date(2025, 9, 1) });
    expect(w.findAll('.p-datepicker-month[data-sd-current]')).toHaveLength(0);
  });
});

describe('SdDatePicker: the props SaniDesk already uses still render', () => {
  it('popup date field: an input with the value, label, hint, no panel until opened', () => {
    const w = mountPicker({ inline: false, label: 'Datum', hint: 'Pick one', placeholder: 'dd.mm.yyyy' });
    expect(w.find('label').text()).toBe('Datum');
    expect((w.find('input').element as HTMLInputElement).value).toBe('18.11.2026');
    expect(w.text()).toContain('Pick one');
    expect(document.querySelector('.p-datepicker-panel')).toBeNull();
    expect(w.find('.p-datepicker-dropdown').exists()).toBe(true);
  });

  it('error replaces the hint and marks the wrapper', () => {
    const w = mountPicker({ inline: false, error: 'Required', hint: 'Pick one' });
    expect(w.text()).toContain('Required');
    expect(w.text()).not.toContain('Pick one');
    expect(w.find('.sd-datepicker-error').exists()).toBe(true);
  });

  it('date + time: the grid with the hour and minute under it', () => {
    const w = mountPicker({ mode: 'datetime', modelValue: new Date(2026, 10, 22, 18, 0) });
    expect(w.find('.p-datepicker-day-view').exists()).toBe(true);
    expect(w.find('.p-datepicker-time-picker').exists()).toBe(true);
    expect(w.find('.p-datepicker-hour-picker').text()).toContain('18');
  });

  it('time only: no grid, no fixed calendar width class lost', () => {
    const w = mountPicker({ mode: 'time', modelValue: new Date(2000, 0, 1, 9, 30) });
    expect(w.find('.p-datepicker-day-view').exists()).toBe(false);
    expect(w.find('.p-datepicker-panel').classes()).toEqual(expect.arrayContaining(['sd-calendar', 'p-datepicker-timeonly']));
  });

  it('range: picks a start, then an end', async () => {
    const w = mountPicker({ range: true, modelValue: null });
    await cell(w, 10).find('.p-datepicker-day').trigger('click');
    const first = w.emitted('update:modelValue')?.at(-1)?.[0] as (Date | null)[];
    expect(dayKey(first[0])).toBe('2026-11-10');
    expect(first[1]).toBeNull();
  });

  it('min and max still block days', () => {
    const w = mountPicker({ minDate: new Date(2026, 10, 5), maxDate: new Date(2026, 10, 25) });
    expect(cell(w, 4).find('.p-datepicker-day').classes()).toContain('p-disabled');
    expect(cell(w, 5).find('.p-datepicker-day').classes()).not.toContain('p-disabled');
    expect(cell(w, 26).find('.p-datepicker-day').classes()).toContain('p-disabled');
  });

  it('touch size: the native input, untouched', () => {
    const w = mountPicker({ inline: false, size: 'touch' });
    const input = w.find('input.sd-native-input');
    expect(input.attributes('type')).toBe('date');
    expect((input.element as HTMLInputElement).value).toBe('2026-11-18');
  });

  it('inline sizes to the calendar; a field stays full width', () => {
    expect(mountPicker().classes()).toContain('sd-datepicker-inline');
    expect(mountPicker({ inline: false }).classes()).toContain('w-full');
  });
});

describe('date-picker-days', () => {
  it('orders a band given end first and cuts nothing inside the month', () => {
    const band = bandKeys({ start: '2026-11-22', end: '2026-11-16' });
    expect(band).toEqual({ start: '2026-11-16', end: '2026-11-22', kind: 'week' });
    expect(bandPart({ year: 2026, month: 10, day: 18 }, band)).toEqual({ kind: 'week', start: false, end: false });
    expect(bandPart({ year: 2026, month: 10, day: 15 }, band)).toBeNull();
    expect(bandPart({ year: 2026, month: 10, day: 16, otherMonth: true }, band)).toBeNull();
  });

  it('starts the band again on the first of the month', () => {
    const band = bandKeys({ start: '2026-10-29', end: '2026-11-04' });
    expect(bandPart({ year: 2026, month: 10, day: 1 }, band)).toEqual({ kind: 'week', start: true, end: false });
  });

  it('names days the same from a Date and from a string', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(dayKey('2026-01-05')).toBe('2026-01-05');
    expect(dayKey('2026-01-05T10:00:00Z')).toBe('2026-01-05');
    expect(dayKey('05.01.2026')).toBeNull();
    expect(dayKey(new Date('nope'))).toBeNull();
  });
});
