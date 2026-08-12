<script setup lang="ts">
import { computed, nextTick, onBeforeUpdate, ref, watch } from 'vue';
import type { CalendarEvent } from './calendar/types';
import { type AgendaDay, groupAgendaDays } from './calendar/agenda';
import SdEmptyState from './SdEmptyState.vue';

export type AgendaSize = 'sm' | 'md' | 'touch';

export interface SdCalendarAgendaProps {
  /** First day of the agenda window. */
  date: Date;
  events: CalendarEvent[];
  /** How many consecutive days the agenda covers. */
  days?: number;
  /** Show days that have no events. Off by default — agenda is a list. */
  includeEmptyDays?: boolean;
  size?: AgendaSize;
  /** Intl locale for the day headings. */
  locale?: string;
  /** Suffix appended to today's heading, e.g. "Mittwoch, 29. Juli, heute". */
  todayLabel?: string;
  /** Time-column text for an all-day row. */
  allDayLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Accessible name for the list. */
  ariaLabel?: string;
}

const props = withDefaults(defineProps<SdCalendarAgendaProps>(), {
  days: 30,
  includeEmptyDays: false,
  size: 'md',
  locale: 'de-CH',
  todayLabel: 'heute',
  allDayLabel: 'Ganztags',
  emptyTitle: 'Keine Termine',
  emptyDescription: 'In diesem Zeitraum sind keine Termine eingetragen.',
  ariaLabel: 'Agenda',
});

const emit = defineEmits<{
  eventClick: [event: CalendarEvent];
  dayClick: [date: Date];
}>();

const agendaDays = computed<AgendaDay[]>(() =>
  groupAgendaDays(props.events, {
    from: props.date,
    days: props.days,
    includeEmptyDays: props.includeEmptyDays,
  }),
);

/**
 * The day groups with each row's position in the flat list carried as data.
 *
 * The flat index used to be derived on demand by a `flatIndex(dayIdx, evIdx)`
 * helper called from the template, including from the per-row `:ref`
 * callback. That is unsafe: Vue invokes the *previous* render's ref function
 * (with `null`) while unmounting the rows that went away, so the callback ran
 * with an index from the old, longer list while reading the new, shorter
 * `agendaDays`. Toggling every calendar off shrank the groups and the lookup
 * fell off the end. Numbering the rows up front means the callback closes over
 * a plain number and reads no reactive state at all, so there is no window in
 * which the two can disagree.
 */
interface AgendaSection {
  day: AgendaDay;
  rows: { event: CalendarEvent; index: number }[];
}

const sections = computed<AgendaSection[]>(() => {
  let index = 0;
  return agendaDays.value.map((day) => ({
    day,
    rows: day.events.map((event) => ({ event, index: index++ })),
  }));
});

/** Flattened rows — the unit of keyboard navigation. */
const rows = computed(() =>
  sections.value.flatMap((s) => s.rows.map((r) => ({ event: r.event, date: s.day.date }))),
);

const isEmpty = computed(() => rows.value.length === 0);

// ── Roving tabindex ────────────────────────────────────────────────────────
// Rows carry no interactive descendants, so listbox/option is the correct
// pattern here (unlike the message list, where the star and checkbox force
// role="grid").

const activeIndex = ref(0);
const rowEls = ref<HTMLElement[]>([]);

watch(rows, () => {
  if (activeIndex.value > rows.value.length - 1) activeIndex.value = Math.max(0, rows.value.length - 1);
});

// Element refs collected from a v-for have to be dropped before every
// re-render, or a row that has been unmounted stays in the array and
// focusRow() sends focus to a detached node. Vue re-runs every inline ref
// callback on each patch, so the array refills in the same tick.
onBeforeUpdate(() => {
  rowEls.value = [];
});

function setRowEl(el: Element | ComponentPublicInstanceLike | null, index: number) {
  if (el instanceof HTMLElement) rowEls.value[index] = el;
}
type ComponentPublicInstanceLike = { $el?: unknown };

async function focusRow(index: number) {
  activeIndex.value = index;
  await nextTick();
  rowEls.value[index]?.focus();
}

function onKeydown(e: KeyboardEvent, index: number) {
  const last = rows.value.length - 1;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    void focusRow(Math.min(index + 1, last));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    void focusRow(Math.max(index - 1, 0));
  } else if (e.key === 'Home') {
    e.preventDefault();
    void focusRow(0);
  } else if (e.key === 'End') {
    e.preventDefault();
    void focusRow(last);
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const row = rows.value[index];
    if (row) emit('eventClick', row.event);
  }
}

// ── Formatting ─────────────────────────────────────────────────────────────

function dayHeading(day: AgendaDay): string {
  const base = day.date.toLocaleDateString(props.locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return day.isToday ? `${base}, ${props.todayLabel}` : base;
}

function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function rowAriaLabel(event: CalendarEvent): string {
  const time = event.allDay ? props.allDayLabel : `${hhmm(event.start)} bis ${hhmm(event.end)}`;
  return event.subtitle ? `${time}, ${event.title}, ${event.subtitle}` : `${time}, ${event.title}`;
}

const statusDot: Record<string, string> = {
  confirmed: 'var(--sd-success, #22c55e)',
  pending: 'var(--sd-warning, #f59e0b)',
  tentative: 'var(--sd-purple, #8B5A9F)',
  cancelled: 'var(--sd-error, #ef4444)',
};

function dotColor(event: CalendarEvent): string {
  return event.color ?? statusDot[event.status ?? 'confirmed'] ?? 'var(--sd-purple, #8B5A9F)';
}

const cfg = computed(() => {
  if (props.size === 'touch') {
    return {
      row: 'py-3 gap-3 min-h-[64px]',
      time: 'w-[64px] text-sm',
      title: 'text-base font-semibold',
      sub: 'text-sm',
      heading: 'text-sm px-4 pt-4 pb-2',
      pad: 'px-4',
    };
  }
  if (props.size === 'sm') {
    return {
      row: 'py-1.5 gap-2 min-h-[40px]',
      time: 'w-[46px] text-[11px]',
      title: 'text-[13px] font-semibold',
      sub: 'text-[11px]',
      heading: 'text-[11px] px-3 pt-3 pb-1',
      pad: 'px-3',
    };
  }
  return {
    row: 'py-2 gap-3 min-h-[48px]',
    time: 'w-[52px] text-[12.5px]',
    title: 'text-[14.5px] font-semibold',
    sub: 'text-[12.5px]',
    heading: 'text-xs px-3 pt-3.5 pb-1.5',
    pad: 'px-3',
  };
});
</script>

<template>
  <div class="h-full border border-sd-border rounded-sd-md bg-white overflow-y-auto">
    <SdEmptyState
      v-if="isEmpty"
      :title="emptyTitle"
      :description="emptyDescription"
    />

    <div
      v-else
      role="listbox"
      :aria-label="ariaLabel"
      class="pb-4"
    >
      <template
        v-for="section in sections"
        :key="section.day.date.getTime()"
      >
        <!-- Day separator. Presentational: the day is already spoken as part
             of each row's accessible name, so it must not be an option. -->
        <p
          class="font-semibold uppercase tracking-wide text-sd-text-secondary sticky top-0 bg-white z-10 border-b border-sd-border"
          :class="[cfg.heading, section.day.isToday ? 'text-sd-orange' : '']"
          role="presentation"
          @click="emit('dayClick', section.day.date)"
        >
          {{ dayHeading(section.day) }}
        </p>

        <div
          v-for="{ event, index } in section.rows"
          :key="event.id"
          :ref="(el) => setRowEl(el as Element | null, index)"
          role="option"
          :aria-selected="index === activeIndex"
          :aria-label="rowAriaLabel(event)"
          :tabindex="index === activeIndex ? 0 : -1"
          class="sd-focus-ring-always flex items-center cursor-pointer border-b border-sd-border/60
                 transition-colors hover:bg-sd-purple-subtle/50"
          :class="[cfg.row, cfg.pad]"
          @click="activeIndex = index; emit('eventClick', event)"
          @keydown="onKeydown($event, index)"
        >
          <!-- Time column: start over end, or the all-day word -->
          <span
            class="shrink-0 text-sd-text-secondary tabular-nums leading-tight"
            :class="cfg.time"
            aria-hidden="true"
          >
            <template v-if="event.allDay">{{ allDayLabel }}</template>
            <template v-else>
              {{ hhmm(event.start) }}<br>{{ hhmm(event.end) }}
            </template>
          </span>

          <span
            class="shrink-0 w-2 h-2 rounded-full"
            :style="{ backgroundColor: dotColor(event) }"
            aria-hidden="true"
          />

          <span class="flex-1 min-w-0">
            <span
              class="block truncate text-sd-text"
              :class="[cfg.title, event.status === 'cancelled' ? 'line-through' : '']"
            >{{ event.title }}</span>
            <span
              v-if="event.subtitle"
              class="block truncate text-sd-text-secondary"
              :class="cfg.sub"
            >{{ event.subtitle }}</span>
          </span>

          <slot
            name="row-meta"
            :event="event"
          />
        </div>
      </template>
    </div>
  </div>
</template>
