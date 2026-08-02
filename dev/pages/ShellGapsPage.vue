<script setup lang="ts">
/**
 * Shell and list gaps — the second round of SaniMail findings.
 *
 * Everything here was found by shipping 1.4.0 and then using it, so each block
 * shows the defect and the fix side by side rather than only the fix. Nothing
 * on this page ships; it exists so a reviewer can watch the behaviour instead
 * of reading about it.
 *
 * The dynamic-viewport block is the one that cannot be judged on a desktop.
 * Open this page on a phone, or in a device-emulated browser, and read the
 * numbers: on a desktop `vh` and `dvh` are equal and every row agrees, which is
 * exactly why the bug survived a desktop review.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  SdAppShell,
  SdBadge,
  SdBottomSheet,
  SdButton,
  SdRowList,
  SdSidebar,
  dvhDeclarations,
  skeletonLineWidths,
} from '@sanibase/ui';
import type { ShellLayout, SidebarGroup } from '@sanibase/ui';
import {
  PhAt, PhCalendarBlank, PhEnvelope, PhGear, PhUsers,
} from '@phosphor-icons/vue';

// ── 1. Dynamic viewport ────────────────────────────────────────────────────

const probe = ref<HTMLElement | null>(null);
const probeDvh = ref<HTMLElement | null>(null);
const measured = ref({ vh: 0, dvh: 0, inner: 0, supportsDvh: false });

function measure(): void {
  measured.value = {
    vh: probe.value?.getBoundingClientRect().height ?? 0,
    dvh: probeDvh.value?.getBoundingClientRect().height ?? 0,
    inner: window.innerHeight,
    supportsDvh: typeof CSS !== 'undefined' && CSS.supports('height', '100dvh'),
  };
}

/** The exact string the shell now puts on its root element. */
const shellHeightDeclaration = dvhDeclarations('height');

// ── 2. layout-change on mount ──────────────────────────────────────────────

const emitLog = ref<string[]>([]);
const shellMounted = ref(false);
const stamp = () => new Date().toLocaleTimeString('de-CH');

function onLayoutChange(next: ShellLayout): void {
  emitLog.value.unshift(`${stamp()} → ${next}`);
}

const sidebarGroups: SidebarGroup[] = [
  {
    key: 'pillars',
    items: [
      { key: 'mail', label: 'Posteingang', icon: PhEnvelope, badge: 12 },
      { key: 'cal', label: 'Kalender', icon: PhCalendarBlank },
      { key: 'contacts', label: 'Kontakte', icon: PhUsers },
      { key: 'addresses', label: 'Adressen', icon: PhAt, badge: 3 },
    ],
  },
  { key: 'system', items: [{ key: 'settings', label: 'Einstellungen', icon: PhGear }] },
];

// ── 3. Skeleton rhythm ─────────────────────────────────────────────────────

interface Message { id: number; from: string; subject: string; preview: string; time: string }

const messages: Message[] = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  from: ['Anna Meier', 'Migros', 'Pistor AG', 'Payrexx', 'Team Medusa', 'Naty'][i]!,
  subject: `Nachricht ${i + 1} — Reservation, Lieferung oder Abrechnung`,
  preview: 'Guten Tag, wir würden gerne für Freitag einen Tisch für acht Personen …',
  time: `${String(8 + i).padStart(2, '0')}:${String(i * 7).padStart(2, '0')}`,
}));

/** Flips every three seconds, so the jolt is visible without clicking. */
const listLoading = ref(true);
let loadingTimer: ReturnType<typeof setInterval> | undefined;

const twoLine = ref(2);
const threeLine = ref(3);
const widthPreview = computed(() => skeletonLineWidths(threeLine.value).join(' · '));

/**
 * Live measurement of the pinned list, so the "they match" claim is a number a
 * reviewer can read rather than an assertion in a comment.
 */
const pinnedList = ref<HTMLElement | null>(null);
const pinnedSkeletonHeight = ref(0);
const pinnedRowHeight = ref(0);

function measurePinned(): void {
  const root = (pinnedList.value as unknown as { $el?: HTMLElement })?.$el;
  if (!root) return;
  const skeleton = root.querySelector('.animate-pulse');
  if (skeleton) pinnedSkeletonHeight.value = Math.round(skeleton.getBoundingClientRect().height);
  const row = root.querySelector('.transition-all');
  if (row) pinnedRowHeight.value = Math.round(row.getBoundingClientRect().height);
}

// ── 4. The account sheet in landscape-compact ──────────────────────────────

const sheetOpen = ref(false);

onMounted(() => {
  measure();
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('orientationchange', measure);
  shellMounted.value = true;
  loadingTimer = setInterval(() => {
    listLoading.value = !listLoading.value;
    setTimeout(measurePinned, 50);
  }, 3000);
  setTimeout(measurePinned, 50);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', measure);
  window.removeEventListener('orientationchange', measure);
  if (loadingTimer) clearInterval(loadingTimer);
});
</script>

<template>
  <div class="space-y-10">
    <header>
      <h1 class="font-heading text-2xl font-bold text-sd-text">
        Shell and list gaps
      </h1>
      <p class="text-sd-text-secondary text-sm mt-1 max-w-3xl">
        The second round of SaniMail findings: everything below was found by shipping the M-UI
        milestone and then building on it. Each block is the new behaviour only.
      </p>
    </header>

    <!-- ════ 1. Dynamic viewport height ════ -->
    <section>
      <h2 class="font-heading text-lg font-bold text-sd-text mb-1">
        1. SdAppShell — dynamic viewport height, with a fallback that ships
      </h2>
      <p class="text-sd-text-secondary text-sm mb-3 max-w-3xl">
        The shell's root carries
        <code class="text-xs bg-sd-bg-alt px-1 rounded">{{ shellHeightDeclaration }}</code>
        as one inline declaration pair, so the CSS parser keeps <code class="text-xs bg-sd-bg-alt px-1 rounded">dvh</code>
        where it is understood and <code class="text-xs bg-sd-bg-alt px-1 rounded">vh</code> where it is not. The
        <code class="text-xs bg-sd-bg-alt px-1 rounded">h-screen</code> class it used to carry alongside was never a
        fallback: this package ships no <code class="text-xs bg-sd-bg-alt px-1 rounded">.h-screen</code> rule, so it only
        resolved for consumers whose own Tailwind happened to scan
        <code class="text-xs bg-sd-bg-alt px-1 rounded">@sanibase/ui/dist</code>.
      </p>
      <p class="text-sd-text-secondary text-sm mb-3 max-w-3xl">
        <b>On a desktop the two rows below are identical, and that is the point.</b>
        The difference only appears where a browser has retractable chrome, so resize this in a
        device-emulated viewport or open it on a phone and scroll.
      </p>

      <div class="flex items-stretch gap-4 mb-3">
        <div class="flex-1">
          <div
            ref="probe"
            class="border border-sd-border rounded-sd-md bg-white p-3 text-sm"
            style="height:100vh; max-height:120px;"
          >
            <b>100vh</b> — the large viewport
          </div>
        </div>
        <div class="flex-1">
          <div
            ref="probeDvh"
            class="border border-sd-border rounded-sd-md bg-white p-3 text-sm"
            :style="`${shellHeightDeclaration}; max-height:120px;`"
          >
            <b>100vh / 100dvh</b> — the shipped pair
          </div>
        </div>
      </div>

      <div class="bg-white border border-sd-border rounded-sd-md p-4 text-sm space-y-1">
        <div class="flex gap-2 items-center">
          <SdBadge
            :label="measured.supportsDvh ? 'dvh supported' : 'dvh NOT supported — fallback active'"
            :variant="measured.supportsDvh ? 'success' : 'warning'"
            size="sm"
          />
          <button
            type="button"
            class="text-xs text-sd-purple hover:underline"
            @click="measure"
          >
            re-measure
          </button>
        </div>
        <p><code class="text-xs">window.innerHeight</code>: <b>{{ measured.inner }}px</b></p>
        <p>unclamped <code class="text-xs">100vh</code> probe: <b>{{ Math.round(measured.vh) }}px</b> (clamped for display)</p>
        <p>unclamped shipped pair: <b>{{ Math.round(measured.dvh) }}px</b> (clamped for display)</p>
      </div>
    </section>

    <!-- ════ 2. layout-change on mount ════ -->
    <section>
      <h2 class="font-heading text-lg font-bold text-sd-text mb-1">
        2. SdAppShell — <code class="text-base">layout-change</code> reports on mount
      </h2>
      <p class="text-sd-text-secondary text-sm mb-3 max-w-3xl">
        The log below has an entry <b>before you touch anything</b>. It did not until now: the emit came
        from a bare <code class="text-xs bg-sd-bg-alt px-1 rounded">watch</code>, so it fired only on a
        <i>transition</i>. A phone loading the app fresh never crosses a breakpoint, no emit ever arrived,
        and a host driving its panes off this event rendered the desktop arrangement on a 390px screen.
        Repeats are suppressed, so resizing within one mode adds nothing.
      </p>

      <div class="flex flex-wrap gap-4">
        <div
          class="border border-sd-border rounded-sd-md overflow-hidden shrink-0"
          style="width: min(393px, 100%); height: 520px;"
        >
          <SdAppShell
            v-if="shellMounted"
            bottom-nav
            @layout-change="onLayoutChange"
          >
            <template #topbar>
              <span class="font-heading font-bold text-sd-text text-sm">Posteingang</span>
            </template>
            <template #sidebar>
              <SdSidebar
                :groups="sidebarGroups"
                active-key="mail"
              />
            </template>
            <template #bottom-nav>
              <div class="flex h-14 items-center justify-around text-xs text-sd-text-secondary">
                <span>Mail</span><span>Kalender</span><span>Kontakte</span><span>Adressen</span>
              </div>
            </template>
            <div class="p-4 text-sm text-sd-text-secondary">
              Content pane. Resize the window to add entries to the log.
            </div>
          </SdAppShell>
        </div>

        <div class="flex-1 min-w-[280px] bg-white border border-sd-border rounded-sd-md p-4">
          <p class="text-sm font-semibold text-sd-text mb-2">
            layout-change emits <SdBadge
              :label="String(emitLog.length)"
              variant="info"
              size="sm"
            />
          </p>
          <ol class="text-sm text-sd-text-secondary space-y-1 font-mono">
            <li
              v-for="(e, i) in emitLog"
              :key="i"
            >
              {{ e }}
            </li>
            <li
              v-if="emitLog.length === 0"
              class="text-sd-error"
            >
              nothing emitted — this is the bug
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- ════ 3. Skeleton rhythm ════ -->
    <section>
      <h2 class="font-heading text-lg font-bold text-sd-text mb-1">
        3. SdRowList — <code class="text-base">skeletonLines</code> and a <code class="text-base">skeleton</code> slot
      </h2>
      <p class="text-sd-text-secondary text-sm mb-3 max-w-3xl">
        Both lists flip between loading and loaded every three seconds. The left one is the default,
        two bars against a three-line row: watch every row below the first jump a line height when the
        data lands. The right one passes
        <code class="text-xs bg-sd-bg-alt px-1 rounded">:skeleton-lines="3"</code> and holds still.
        Widths for {{ threeLine }} lines: <code class="text-xs bg-sd-bg-alt px-1 rounded">{{ widthPreview }}</code>.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p class="text-sm font-semibold text-sd-text mb-2">
            Default — <code class="text-xs">skeletonLines</code> 2, jolts
          </p>
          <SdRowList
            :items="listLoading ? [] : messages"
            :loading="listLoading"
            :skeleton-count="4"
            :skeleton-lines="twoLine"
            :gap="8"
          >
            <template #content="{ item }">
              <div class="truncate font-bold text-sd-text">
                {{ (item as Message).from }}
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
          </SdRowList>
        </div>

        <div>
          <p class="text-sm font-semibold text-sd-text mb-2">
            <code class="text-xs">:skeleton-lines="3"</code> — matches the row rhythm
          </p>
          <SdRowList
            :items="listLoading ? [] : messages"
            :loading="listLoading"
            :skeleton-count="4"
            :skeleton-lines="threeLine"
            :gap="8"
          >
            <template #content="{ item }">
              <div class="truncate font-bold text-sd-text">
                {{ (item as Message).from }}
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
          </SdRowList>
        </div>
      </div>

      <p class="text-sm font-semibold text-sd-text mt-6 mb-2">
        Pinned rows — skeleton and row are the same 72px
      </p>
      <p class="text-sd-text-secondary text-sm mb-2 max-w-3xl">
        A list that pins <code class="text-xs bg-sd-bg-alt px-1 rounded">itemHeight</code> — the virtualised
        message list, 72px comfortable per UX §6 — now pins its loading skeleton to the same height. Only the
        load-more boundary skeleton did before, so the initial skeleton and the rows it stood in for were
        different heights. Measured live:
        <b>skeleton {{ pinnedSkeletonHeight }}px</b> · <b>row {{ pinnedRowHeight }}px</b>.
      </p>
      <SdRowList
        ref="pinnedList"
        :items="listLoading ? [] : messages"
        :loading="listLoading"
        :skeleton-count="3"
        :skeleton-lines="3"
        :virtualized="true"
        :item-height="72"
        :gap="8"
        size="sm"
        height="248px"
      >
        <template #content="{ item }">
          <div class="truncate text-[13px] font-bold text-sd-text">
            {{ (item as Message).from }}
          </div>
          <div class="truncate text-[13px] text-sd-text">
            {{ (item as Message).subject }}
          </div>
          <div class="truncate text-[12px] text-sd-text-secondary">
            {{ (item as Message).preview }}
          </div>
        </template>
      </SdRowList>

      <p class="text-sm font-semibold text-sd-text mt-6 mb-2">
        <code class="text-xs">#skeleton</code> slot — for a row that is not a stack of text bars
      </p>
      <SdRowList
        :items="listLoading ? [] : messages.slice(0, 3)"
        :loading="listLoading"
        :skeleton-count="3"
        :gap="8"
      >
        <template #skeleton>
          <div class="flex items-center gap-4 rounded-sd-md border border-sd-border bg-white p-4 animate-pulse">
            <div class="h-12 w-12 shrink-0 rounded-full bg-sd-purple-subtle" />
            <div class="h-8 flex-1 rounded bg-sd-bg-alt" />
            <div class="h-8 w-24 shrink-0 rounded bg-sd-bg-alt" />
          </div>
        </template>
        <template #content="{ item }">
          <div class="truncate font-bold text-sd-text">
            {{ (item as Message).from }}
          </div>
        </template>
      </SdRowList>
    </section>

    <!-- ════ 4. The sheet in landscape-compact ════ -->
    <section>
      <h2 class="font-heading text-lg font-bold text-sd-text mb-1">
        4. SdBottomSheet — sized by the dynamic viewport, still a bottom sheet
      </h2>
      <p class="text-sd-text-secondary text-sm mb-3 max-w-3xl">
        UX §3 asks for side sheets below 480px of height. This release does not add one, because the
        one sheet that exists there fits and scrolls, and a side sheet is a different component rather
        than a variant — different entry axis, different gesture axis, different corner radius. What
        <i>was</i> wrong is that the sheet measured itself against <code class="text-xs bg-sd-bg-alt px-1 rounded">85vh</code>,
        the large viewport, so on a phone browser its footer slot — the primary action — sat behind
        the chrome. It now measures
        <code class="text-xs bg-sd-bg-alt px-1 rounded">{{ dvhDeclarations('max-height', 85) }}</code>.
      </p>
      <SdButton
        label="Open the account sheet"
        variant="secondary-outline"
        size="sm"
        @click="sheetOpen = true"
      />
      <SdBottomSheet
        :open="sheetOpen"
        title="Konto"
        @update:open="sheetOpen = $event"
      >
        <div class="space-y-2 pb-2 text-sm">
          <div class="rounded-sd-sm bg-sd-bg-surface px-3 py-3">
            <p class="text-[11.5px] font-semibold uppercase tracking-wide text-sd-text-secondary">
              Angemeldet als
            </p>
            <p class="mt-0.5 font-semibold">
              anna.meier@medusabar.ch
            </p>
          </div>
          <div class="rounded-sd-sm px-3 py-3">
            Postfach wechseln
          </div>
          <div class="rounded-sd-sm px-3 py-3">
            Einstellungen
          </div>
        </div>
        <template #footer>
          <SdButton
            label="Abmelden"
            variant="secondary-outline"
            block
          />
        </template>
      </SdBottomSheet>
    </section>
  </div>
</template>
