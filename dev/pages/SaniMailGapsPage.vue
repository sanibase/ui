<script setup lang="ts">
/**
 * M-UI demo — every capability added for SaniMail, on one page.
 *
 * Agenda view, the pinned all-day band, drag-to-resize, the resource-free day
 * grid, a 40 000 row virtualised list with grid semantics, the draggable and
 * persisted split divider, the toast action, rich tag suggestions with an
 * invalid chip, and the token seam. Nothing here ships; it exists so a
 * reviewer can see the behaviour rather than read about it.
 */
import { computed, ref } from 'vue';
import {
  SdCalendar,
  SdCalendarAgenda,
  SdRowList,
  SdSplitPanel,
  SdTagInput,
  SdToast,
  SdBadge,
  SdButton,
  sdCssVariables,
  useComposerDock,
  useToast,
} from '@sanibase/ui';
import type {
  CalendarEvent,
  CalendarResizePayload,
  CalendarViewMode,
  TagState,
  TagSuggestion,
} from '@sanibase/ui';

// ── Calendar fixtures ──────────────────────────────────────────────────────

const today = new Date();
function at(dayOffset: number, h: number, m = 0): Date {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d;
}
function midnight(dayOffset: number): Date {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(0, 0, 0, 0);
  return d;
}

const events = ref<CalendarEvent[]>([
  // Multi-day all-day bar — spans two band columns.
  { id: 'inv', title: 'Inventar Getränkelager', allDay: true, start: midnight(-1), end: midnight(1), color: '#22c55e' },
  // Single all-day, later in the week — proves the band packs rows.
  { id: 'nat', title: 'Nationalfeiertag, Küche geschlossen', allDay: true, start: midnight(3), end: midnight(4), color: '#D65D7A' },
  { id: 'ov', title: 'Ferien Naty', allDay: true, start: midnight(-1), end: midnight(4), color: '#8B5A9F' },
  // 06:00 and 23:00 — invisible in the old fixed 07:00-22:00 window.
  { id: 'lief', title: 'Lieferung Pistor', subtitle: 'Warenannahme', start: at(0, 6, 0), end: at(0, 7, 0), status: 'confirmed' },
  { id: 'mise', title: 'Mise en place', subtitle: 'Küche', start: at(0, 11, 0), end: at(0, 12, 0), status: 'pending' },
  { id: 'tel', title: 'Telefon Payrexx', subtitle: 'Team Medusa', start: at(0, 14, 30), end: at(0, 15, 0), status: 'tentative' },
  { id: 'musik', title: 'Livemusik, Duo Riva', subtitle: 'Medusa Bar', start: at(0, 19, 0), end: at(0, 22, 0) },
  { id: 'spaet', title: 'Schichtende Bar', start: at(0, 23, 0), end: at(1, 0, 30) },
  { id: 'liefer2', title: 'Lieferantengespräch', subtitle: 'Josefstrasse 12', start: at(2, 9, 0), end: at(2, 10, 0) },
  { id: 'blaser', title: 'Reservation Blaser, 8 Personen', subtitle: 'Fenstertisch', start: at(2, 19, 30), end: at(2, 22, 0) },
]);

const calDate = ref(new Date());
const calView = ref<CalendarViewMode>('week');
const lastResize = ref<string>('—');

function onResize(p: CalendarResizePayload) {
  // Optimistic write, exactly as the host app would do it.
  const i = events.value.findIndex((e) => e.id === p.event.id);
  if (i >= 0) events.value[i] = { ...events.value[i]!, start: p.start, end: p.end };
  lastResize.value = `${p.event.title} · ${p.edge} → ${p.start.toLocaleTimeString('de-CH').slice(0, 5)}–${p.end.toLocaleTimeString('de-CH').slice(0, 5)}`;
}

const navLabels = {
  today: 'Heute', day: 'Tag', week: 'Woche', month: 'Monat',
  agenda: 'Agenda', allDay: 'Ganztags', more: 'weitere',
};

// ── Virtualised list ───────────────────────────────────────────────────────

interface Message { id: number; from: string; subject: string; preview: string; time: string; unread: boolean }

const SENDERS = ['Anna Meier', 'Migros', 'Pistor AG', 'Payrexx', 'Team Medusa', 'Swisscom', 'Naty'];
const messages: Message[] = Array.from({ length: 40_000 }, (_, i) => ({
  id: i,
  from: SENDERS[i % SENDERS.length]!,
  subject: `Nachricht ${i + 1} — Reservation, Lieferung oder Abrechnung`,
  preview: 'Guten Tag, wir würden gerne für Freitag einen Tisch für acht Personen …',
  time: `${String(8 + (i % 12)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
  unread: i % 5 === 0,
}));

const selected = ref<number | null>(null);
const selectedMessage = computed(() => (selected.value === null ? null : messages[selected.value] ?? null));

function messageKey(item: unknown) {
  return (item as Message).id;
}

// ── Toast with an action ───────────────────────────────────────────────────

const toast = useToast();
const archived = ref(0);

function archiveWithUndo() {
  archived.value += 12;
  toast.undo('12 Nachrichten archiviert.', 'Rückgängig', () => {
    archived.value -= 12;
  });
}

// ── Tag input ──────────────────────────────────────────────────────────────

const recipients = ref<string[]>(['anna.meier@medusabar.ch', 'nicht-eine-adresse']);
const contactSuggestions: TagSuggestion[] = [
  { value: 'anna.meier@medusabar.ch', label: 'Anna Meier', description: 'anna.meier@medusabar.ch', initials: 'AM' },
  { value: 'support@medusabar.ch', label: 'Support (Gruppe)', description: 'support@medusabar.ch', initials: 'SU' },
  { value: 'bestellung@pistor.ch', label: 'Pistor AG, Bestellwesen', description: 'bestellung@pistor.ch', initials: 'PA' },
  { value: 'gesperrt@example.com', label: 'Gesperrter Kontakt', description: 'gesperrt@example.com', initials: 'GK', disabled: true },
];
const ADDRESS_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const recipientStates = computed<Record<string, TagState>>(() =>
  Object.fromEntries(recipients.value.map((r) => [r, ADDRESS_RE.test(r) ? 'default' : 'invalid'])),
);

// ── Split panel ────────────────────────────────────────────────────────────

const splitSize = ref<number | undefined>(undefined);
const splitVertical = ref(false);

// ── Tokens ─────────────────────────────────────────────────────────────────

const tokenSample = Object.entries(sdCssVariables)
  .filter(([k, v]) => !k.endsWith('-rgb') && v.startsWith('#'))
  .slice(0, 12);
// ── Consumer regression: the two live apps/web call sites ──────────────────
// Reproduced prop-for-prop from apps/web/app/pages/termine/index.vue and
// .../reservierungen/index.vue so a breaking change to either shows up here
// rather than in production. Nothing on these two is new API except
// `nav-labels` and `locale`, which those pages already pass and which used to
// fall through to the DOM as dead attributes.

const termineResources = [
  { id: 'staff-1', label: 'Naty', subtitle: 'Coiffure' },
  { id: 'staff-2', label: 'Lea', subtitle: 'Kosmetik' },
  { id: 'unassigned', label: 'Ohne Zuweisung' },
];
const termineEvents = ref<CalendarEvent[]>([
  { id: 'a1', resourceId: 'staff-1', title: 'Damenschnitt', subtitle: 'M. Blaser', start: at(0, 9, 0), end: at(0, 10, 0), status: 'confirmed' },
  { id: 'a2', resourceId: 'staff-1', title: 'Färben', subtitle: 'S. Küng', start: at(0, 10, 30), end: at(0, 12, 0), status: 'pending' },
  { id: 'a3', resourceId: 'staff-2', title: 'Gesichtsbehandlung', start: at(0, 14, 0), end: at(0, 15, 30), status: 'tentative' },
  { id: 'a4', resourceId: 'unassigned', title: 'Anfrage offen', start: at(0, 16, 0), end: at(0, 17, 0), status: 'cancelled' },
]);
const termineDate = ref(new Date());
const termineView = ref<CalendarViewMode>('day');
const termineLog = ref('—');

const reservierungenEvents = ref<CalendarEvent[]>([
  { id: 'r1', resourceId: 't1', title: 'Blaser, 4 Pers.', start: at(0, 19, 0), end: at(0, 21, 0), status: 'confirmed' },
  { id: 'r2', resourceId: 't2', title: 'Walk-in, 2 Pers.', start: at(0, 20, 0), end: at(0, 21, 30), status: 'pending' },
  { id: 'r3', resourceId: 't3', title: 'Meier, 6 Pers.', start: at(0, 22, 0), end: at(1, 1, 0), status: 'confirmed' },
]);
const reservierungenResources = [
  { id: 't1', label: 'Tisch 1', subtitle: '4 Plätze' },
  { id: 't2', label: 'Tisch 2', subtitle: '2 Plätze' },
  { id: 't3', label: 'Fenstertisch', subtitle: '8 Plätze' },
];
const reservierungenDate = ref(new Date());
const reservierungenView = ref<CalendarViewMode>('day');

// ── Composer dock ──────────────────────────────────────────────────────────
// The dock itself is mounted in dev/App.vue, next to the RouterView and not
// inside it. That is the integration contract, and it is what makes the
// "navigate away and back" demonstration below honest.

const dock = useComposerDock();

function openComposer(title: string, to: string[], body: string): string {
  return dock.open({ title, data: { to, subject: title, body } });
}

function openOne(): void {
  openComposer('Bestellung KW 31, Lieferung Dienstag', ['bestellung@pistor.ch'],
    'Guten Tag Herr Bühler\n\nfür die kommende Woche brauchen wir die übliche Lieferung.');
}

/** The scenario the release is judged on: three at once, one maximised, one collapsed. */
function openScenario(): void {
  dock.closeAll();
  const a = openComposer('Bestellung KW 31, Lieferung Dienstag', ['bestellung@pistor.ch'],
    'Guten Tag Herr Bühler\n\nfür die kommende Woche brauchen wir die übliche Lieferung.');
  const b = openComposer('Re: Rechnung 4471', ['tobias.lang@example.ch'],
    'Guten Tag Herr Lang\n\ndie MWST-Nummer fehlt tatsächlich, wir senden die Rechnung korrigiert nach.');
  const c = openComposer('Livemusik August, Duo Riva', ['duo.riva@example.ch'],
    'Hallo zusammen\n\npasst der 15. August bei euch?');
  dock.collapse(a);
  dock.maximize(b);
  dock.focus(c);
}

const dockState = computed(() =>
  dock.composers.value.map((c) => ({ id: c.id, title: c.title || 'Neue Nachricht', state: c.state })),
);
</script>

<template>
  <div class="space-y-10">
    <header>
      <h1 class="font-heading text-2xl font-bold text-sd-text">
        SaniMail gap release
      </h1>
      <p class="text-sd-text-secondary text-sm mt-1 max-w-3xl">
        Every capability added in the M-UI milestone. Each block is the new behaviour only —
        anything not shown here is unchanged from 1.3.0.
      </p>
    </header>

    <!-- ════ 1. Calendar ════ -->
    <section>
      <h2 class="font-heading text-lg font-bold text-sd-text mb-1">
        1. Calendar — agenda, all-day band, resize, 00:00-24:00
      </h2>
      <p class="text-sd-text-secondary text-sm mb-3">
        Week and Day carry a pinned <b>Ganztags</b> band (three overlapping all-day bars, one spanning two days).
        Hover an event to reveal the top and bottom <b>resize handles</b>; drag, or focus an event and press
        <code class="text-xs bg-sd-bg-alt px-1 rounded">Shift</code> + <code class="text-xs bg-sd-bg-alt px-1 rounded">↑/↓</code>.
        The window is <b>00:00-24:00 scrolled to 06:00</b>, so both the 06:00 delivery and the 23:00 shift are reachable.
        Arrow keys move through the hour cells.
      </p>
      <div class="flex items-center gap-3 mb-2 text-sm">
        <SdBadge
          label="eventResize"
          variant="info"
          size="sm"
        />
        <span class="text-sd-text-secondary">{{ lastResize }}</span>
      </div>
      <div class="bg-white border border-sd-border rounded-sd-md p-3 h-[560px]">
        <SdCalendar
          v-model:date="calDate"
          v-model:view-mode="calView"
          :events="events"
          :view-modes="['month', 'week', 'day', 'agenda']"
          :start-hour="0"
          :end-hour="24"
          :scroll-to-hour="6"
          :slot-height="14"
          :nav-labels="navLabels"
          resizable
          draggable
          locale="de-CH"
          @event-resize="onResize"
        />
      </div>
    </section>

    <!-- ════ 2. Agenda standalone ════ -->
    <section>
      <h2 class="font-heading text-lg font-bold text-sd-text mb-1">
        2. SdCalendarAgenda — the phone-portrait default
      </h2>
      <p class="text-sd-text-secondary text-sm mb-3">
        Day separators, start over end in the time column, <b>Ganztags</b> for all-day rows, a colour dot per event.
        Roving tabindex: click a row, then arrow up and down.
      </p>
      <div class="w-[402px] h-[520px]">
        <SdCalendarAgenda
          :date="calDate"
          :events="events"
          :days="10"
          locale="de-CH"
        />
      </div>
    </section>

    <!-- ════ 3. Virtualised list ════ -->
    <section>
      <h2 class="font-heading text-lg font-bold text-sd-text mb-1">
        3. SdRowList — 40 000 rows, virtualised, role="grid"
      </h2>
      <p class="text-sd-text-secondary text-sm mb-3">
        Forty thousand messages, 72px rows. Roughly twenty are in the DOM at any moment — inspect and scroll to confirm.
        Click a row then use <code class="text-xs bg-sd-bg-alt px-1 rounded">↑ ↓ Home End PageUp PageDown</code>,
        <code class="text-xs bg-sd-bg-alt px-1 rounded">→</code> to step into the row's star button,
        <code class="text-xs bg-sd-bg-alt px-1 rounded">Space</code> to select.
      </p>
      <SdRowList
        :items="messages"
        :virtualized="true"
        :item-height="72"
        :gap="8"
        :item-key="messageKey"
        height="480px"
        semantics="grid"
        aria-label="Posteingang"
        @row-click="(_i, index) => (selected = index)"
      >
        <template #content="{ item }">
          <div class="flex items-baseline gap-2">
            <span
              v-if="(item as Message).unread"
              class="w-1.5 h-1.5 rounded-full bg-sd-orange shrink-0"
            />
            <span
              class="truncate"
              :class="(item as Message).unread ? 'font-bold text-sd-text' : 'text-sd-text'"
            >{{ (item as Message).from }}</span>
          </div>
          <div class="truncate text-sm text-sd-text">
            {{ (item as Message).subject }}
          </div>
          <div class="truncate text-[13px] text-sd-text-secondary">
            {{ (item as Message).preview }}
          </div>
        </template>
        <template #meta="{ item }">
          <span class="text-[13px] text-sd-text-secondary tabular-nums">{{ (item as Message).time }}</span>
        </template>
        <template #actions>
          <button
            type="button"
            class="sd-focus-ring w-11 h-11 rounded-md text-sd-text-secondary hover:bg-sd-purple-subtle"
            aria-label="Markieren"
          >
            ★
          </button>
        </template>
      </SdRowList>
      <p class="text-sm text-sd-text-secondary mt-2">
        Selected: <b>{{ selectedMessage?.subject ?? '—' }}</b>
      </p>
    </section>

    <!-- ════ 4. Split panel ════ -->
    <section>
      <h2 class="font-heading text-lg font-bold text-sd-text mb-1">
        4. SdSplitPanel — draggable divider, persisted, vertical mode
      </h2>
      <p class="text-sd-text-secondary text-sm mb-3">
        Drag the divider, or focus it and use the arrow keys (Shift for a bigger step, Home/End for the limits,
        double-click to reset). The position is written to <code class="text-xs bg-sd-bg-alt px-1 rounded">localStorage</code>
        under <code class="text-xs bg-sd-bg-alt px-1 rounded">sd-split:demo</code> — reload and it survives.
      </p>
      <SdButton
        :label="splitVertical ? 'Reader rechts' : 'Reader unten'"
        variant="secondary"
        size="sm"
        class="mb-3"
        @click="splitVertical = !splitVertical"
      />
      <div class="h-[320px] border border-sd-border rounded-sd-md bg-white overflow-hidden">
        <SdSplitPanel
          v-model:size="splitSize"
          :orientation="splitVertical ? 'vertical' : 'horizontal'"
          :key="splitVertical ? 'v' : 'h'"
          resizable
          :bordered="false"
          :min-size="160"
          storage-key="demo"
          class="h-full"
        >
          <template #left>
            <div class="p-4 h-full bg-sd-bg-alt text-sm text-sd-text-secondary">
              Liste — {{ splitSize ? `${Math.round(splitSize)}px` : 'aus dem ratio-Preset' }}
            </div>
          </template>
          <template #right>
            <div class="p-4 h-full text-sm text-sd-text-secondary">
              Lesebereich
            </div>
          </template>
        </SdSplitPanel>
      </div>
    </section>

    <!-- ════ 5. Toast action ════ -->
    <section>
      <h2 class="font-heading text-lg font-bold text-sd-text mb-1">
        5. SdToast — action slot, the undo primitive
      </h2>
      <p class="text-sd-text-secondary text-sm mb-3">
        Hover the toast: the countdown holds while an action is present, otherwise the button is unreachable.
        Archived counter: <b>{{ archived }}</b>
      </p>
      <SdButton
        label="12 Nachrichten archivieren"
        @click="archiveWithUndo"
      />
      <div class="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
        <SdToast
          v-for="t in toast.toasts.value"
          :key="t.id"
          :message="t.message"
          :variant="t.variant"
          :duration="t.duration"
          :action-label="t.action?.label"
          :pause-on-hover="t.pauseOnHover"
          @action="t.action?.onAction()"
          @close="toast.remove(t.id)"
        />
      </div>
    </section>

    <!-- ════ 6. Tag input ════ -->
    <section>
      <h2 class="font-heading text-lg font-bold text-sd-text mb-1">
        6. SdTagInput — per-tag state and name-plus-address suggestions
      </h2>
      <p class="text-sd-text-secondary text-sm mb-3">
        The second chip is malformed and renders red <b>without blocking send</b>. Type "me" or "pistor" for two-line
        suggestions; one entry is disabled. Casing is preserved, <code class="text-xs bg-sd-bg-alt px-1 rounded">;</code>
        and <code class="text-xs bg-sd-bg-alt px-1 rounded">,</code> commit, and pasting a comma-separated list makes one chip each.
      </p>
      <div class="max-w-xl">
        <SdTagInput
          v-model="recipients"
          :suggestions="contactSuggestions"
          :tag-states="recipientStates"
          :lowercase="false"
          :separators="[',', ';']"
          label="An"
          placeholder="Name oder Adresse"
        />
      </div>
    </section>

    <!-- ════ 7. Tokens ════ -->
    <section>
      <h2 class="font-heading text-lg font-bold text-sd-text mb-1">
        7. Token seam — CSS custom properties
      </h2>
      <p class="text-sd-text-secondary text-sm mb-3">
        Every swatch below is painted by a Tailwind <code class="text-xs bg-sd-bg-alt px-1 rounded">bg-sd-*</code> class that
        now resolves through <code class="text-xs bg-sd-bg-alt px-1 rounded">rgb(var(--sd-*-rgb) / &lt;alpha-value&gt;)</code>.
        The 40% row proves opacity modifiers still work through the variable, which is the part that breaks if the
        token holds a hex.
      </p>
      <div class="grid grid-cols-6 gap-3 max-w-3xl">
        <div
          v-for="[name, hex] in tokenSample"
          :key="name"
          class="text-[11px] text-sd-text-secondary"
        >
          <div
            class="h-10 rounded-md border border-sd-border"
            :style="{ background: `var(${name})` }"
          />
          <div class="mt-1 truncate">
            {{ name }}
          </div>
          <div class="opacity-60">
            {{ hex }}
          </div>
        </div>
      </div>
      <div class="flex gap-2 mt-4">
        <div class="h-10 w-24 rounded-md bg-sd-orange" />
        <div class="h-10 w-24 rounded-md bg-sd-orange/40" />
        <div class="h-10 w-24 rounded-md bg-sd-purple" />
        <div class="h-10 w-24 rounded-md bg-sd-purple/40" />
        <div class="h-10 w-24 rounded-md bg-sd-success" />
        <div class="h-10 w-24 rounded-md bg-sd-success/40" />
      </div>
      <p class="text-sd-text-secondary text-sm mt-3">
        Focus ring: tab to this button and check the two-tone ring.
        <button
          type="button"
          class="sd-focus-ring ml-2 px-3 py-1.5 rounded-md bg-white border border-sd-border text-sd-text"
        >
          Fokus
        </button>
      </p>
    </section>
    <!-- ════ 8. Consumer regression ════ -->
    <section>
      <h2 class="font-heading text-lg font-bold text-sd-text mb-1">
        8. Consumer regression — the two live apps/web call sites
      </h2>
      <p class="text-sd-text-secondary text-sm mb-3">
        Reproduced prop-for-prop from <code class="text-xs bg-sd-bg-alt px-1 rounded">/termine</code> and
        <code class="text-xs bg-sd-bg-alt px-1 rounded">/reservierungen</code>. Both use the horizontal (Gantt)
        resource grid with drag-and-drop, no all-day events, and the three-mode toggle. Nothing here opts into a new
        prop except <code class="text-xs bg-sd-bg-alt px-1 rounded">nav-labels</code> and
        <code class="text-xs bg-sd-bg-alt px-1 rounded">locale</code>, which those pages already pass and which used
        to fall through to the DOM as dead attributes.
      </p>
      <p class="text-sm text-sd-text-secondary mb-2">
        eventDrop / slotClick: <b>{{ termineLog }}</b>
      </p>
      <div class="bg-white border border-sd-border rounded-sd-md p-3 h-[420px] mb-6">
        <SdCalendar
          v-model:date="termineDate"
          v-model:view-mode="termineView"
          :events="termineEvents"
          :resources="termineResources"
          :start-hour="8"
          :end-hour="20"
          orientation="horizontal"
          draggable
          size="md"
          :nav-labels="{ today: 'Heute', day: 'Tag', week: 'Woche', month: 'Monat' }"
          locale="de-CH"
          @slot-click="(p) => (termineLog = `slotClick ${p.resourceId} ${p.start.toLocaleTimeString('de-CH').slice(0, 5)}`)"
          @event-drop="(p) => (termineLog = `eventDrop ${p.event.title} → ${p.resourceId} ${p.start.toLocaleTimeString('de-CH').slice(0, 5)}`)"
        />
      </div>
      <div class="bg-white border border-sd-border rounded-sd-md p-3 h-[420px]">
        <SdCalendar
          v-model:date="reservierungenDate"
          v-model:view-mode="reservierungenView"
          :events="reservierungenEvents"
          :resources="reservierungenResources"
          :start-hour="18"
          :end-hour="26"
          orientation="horizontal"
          draggable
          size="md"
          :nav-labels="{ today: 'Heute', day: 'Tag', week: 'Woche', month: 'Monat' }"
          locale="de-CH"
        />
      </div>
    </section>
    <!-- ════ 9. Composer dock ════ -->
    <section>
      <h2 class="font-heading text-lg font-bold text-sd-text mb-1">
        9. SdComposerDock — non-modal composer windows
      </h2>
      <p class="text-sd-text-secondary text-sm mb-3 max-w-3xl">
        Not a modal: no scrim, no focus trap, and the page behind stays readable and clickable while a draft is open.
        Scroll this page with a composer open, or click a calendar event behind it, and see that nothing is blocked.
        The dock is mounted in the gallery shell next to the router view, so
        <b>navigate to any other component page and back</b> — the drafts are still there, still typed in.
      </p>
      <ul class="text-sd-text-secondary text-sm mb-4 space-y-1 max-w-3xl list-disc pl-5">
        <li>
          <b>Escape collapses, never closes.</b> Click into a composer body, press
          <code class="text-xs bg-sd-bg-alt px-1 rounded">Escape</code>, and watch the state table below: the window
          goes to <code class="text-xs bg-sd-bg-alt px-1 rounded">collapsed</code> and stays in the dock.
        </li>
        <li>
          <b>Keyboard reach.</b> <code class="text-xs bg-sd-bg-alt px-1 rounded">F6</code> moves focus from the page
          into the composers and steps through them,
          <code class="text-xs bg-sd-bg-alt px-1 rounded">Shift</code> +
          <code class="text-xs bg-sd-bg-alt px-1 rounded">F6</code> steps back, and cycling past the last one returns
          focus to where it started. <code class="text-xs bg-sd-bg-alt px-1 rounded">Tab</code> walks out of a composer
          and on into the page, because a non-modal window must not trap focus.
        </li>
        <li>
          <b>Three at once.</b> The dock is a <code class="text-xs bg-sd-bg-alt px-1 rounded">region</code> landmark
          named "Entwürfe" and each window is a <code class="text-xs bg-sd-bg-alt px-1 rounded">group</code> named by
          its subject — never a <code class="text-xs bg-sd-bg-alt px-1 rounded">dialog</code>, which would imply the
          modality we are deliberately avoiding. Opening, collapsing and closing are announced politely.
        </li>
        <li>
          <b>Arrangement is the dock's job.</b> A fourth composer, or one with no horizontal room for its 720px,
          renders as a stacked title bar without losing its own state. Narrow the browser below 768px and the
          front composer goes full screen.
        </li>
      </ul>
      <div class="flex flex-wrap gap-2 mb-4">
        <SdButton
          label="Drei Entwürfe: einer maximiert, einer eingeklappt"
          @click="openScenario"
        />
        <SdButton
          label="Neue Nachricht"
          variant="secondary"
          @click="openOne"
        />
        <SdButton
          label="Alle schliessen"
          variant="secondary"
          @click="dock.closeAll()"
        />
      </div>
      <div class="max-w-xl border border-sd-border rounded-sd-md bg-white overflow-hidden">
        <p class="px-4 py-2 border-b border-sd-border text-sm font-medium text-sd-text">
          Dock-Zustand ({{ dockState.length }})
        </p>
        <p
          v-if="dockState.length === 0"
          class="px-4 py-3 text-sm text-sd-text-secondary"
        >
          Kein Entwurf offen.
        </p>
        <div
          v-for="row in dockState"
          :key="row.id"
          class="flex items-center gap-3 px-4 py-2 border-b last:border-b-0 border-sd-border text-sm"
        >
          <span class="flex-1 truncate text-sd-text">{{ row.title }}</span>
          <SdBadge
            :label="row.state"
            :variant="row.state === 'collapsed' ? 'neutral' : 'info'"
            size="sm"
          />
        </div>
      </div>
    </section>

  </div>
</template>
