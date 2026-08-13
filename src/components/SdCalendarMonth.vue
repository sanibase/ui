<script setup lang="ts">
import { computed } from 'vue';
import type { CalendarEvent } from './calendar/types';
// SHARED WITH SdCalendarEvent ON PURPOSE. This grid used to paint from
// `event.status` alone and never read `event.color`, so an event in a blue
// calendar drew blue in day/week and green in month, green being the
// `confirmed` token. `calendar/event-colour` is now the only place that
// decides, and both components ask it.
import { eventPalette, type EventPalette } from './calendar/event-colour';

export type MonthSize = 'sm' | 'md' | 'touch';

export interface SdCalendarMonthProps {
  /** Any date within the month to display */
  date: Date;
  /** Events to display */
  events: CalendarEvent[];
  /** Max events to show per day before "+N more" */
  maxVisible?: number;
  /** Component size */
  size?: MonthSize;
  /** Trailing word of the "+N more" overflow link. */
  moreLabel?: string;
}

const props = withDefaults(defineProps<SdCalendarMonthProps>(), {
  maxVisible: 3,
  size: 'md',
  moreLabel: 'more',
});

const emit = defineEmits<{
  dayClick: [date: Date];
  eventClick: [event: CalendarEvent];
}>();

// ── Calendar grid (6 weeks x 7 days) ──

const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

interface CalendarDay {
  date: Date;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

const calendarDays = computed((): CalendarDay[] => {
  const year = props.date.getFullYear();
  const month = props.date.getMonth();

  // First day of month
  const first = new Date(year, month, 1);
  // Day of week (0=Sun) -> shift to Monday-start
  let startDow = first.getDay();
  if (startDow === 0) startDow = 7;
  startDow -= 1; // 0=Mon

  // Roll back to fill the first week
  const startDate = new Date(first);
  startDate.setDate(startDate.getDate() - startDow);

  const today = new Date();
  const days: CalendarDay[] = [];

  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push({
      date: d,
      dayNum: d.getDate(),
      isCurrentMonth: d.getMonth() === month,
      isToday:
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate(),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    });
  }

  // Trim to 5 rows if 6th row is entirely next month
  if (days.slice(35).every((d) => !d.isCurrentMonth)) {
    return days.slice(0, 35);
  }
  return days;
});

const weekCount = computed(() => calendarDays.value.length / 7);

// ── Events per day ──

function eventsForDay(date: Date): CalendarEvent[] {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return props.events
    .filter((ev) => {
      // Multi-day events (typically all-day) show on every day they cover, so
      // a week of holiday is not a single chip on its first Monday. Timed
      // events are unaffected: they start and end inside one day, so the
      // window test picks exactly the day their start falls on.
      if (ev.allDay || ev.end.getTime() - ev.start.getTime() > 86_400_000) {
        const s = ev.start.getTime();
        const e = ev.end.getTime() > s ? ev.end.getTime() : s + 1;
        return s < dayEnd.getTime() && e > dayStart.getTime();
      }
      const s = ev.start;
      return (
        s.getFullYear() === date.getFullYear() &&
        s.getMonth() === date.getMonth() &&
        s.getDate() === date.getDate()
      );
    })
    .sort((a, b) => {
      const ad = (a.allDay ? 0 : 1) - (b.allDay ? 0 : 1);
      if (ad !== 0) return ad;
      return a.start.getTime() - b.start.getTime();
    });
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** One chip, with its colour already resolved. */
interface DayChip {
  event: CalendarEvent;
  palette: EventPalette;
  time: string;
}

/**
 * Chips per day, resolved ONCE per render rather than per binding.
 *
 * The template used to call `eventsForDay` three times for every cell (the
 * slice, the overflow test, the overflow count) and would now call the palette
 * for every class binding on top of that, which on a six-week grid is a
 * four-figure number of scans of the whole event list to draw one month.
 */
const dayChips = computed((): { visible: DayChip[]; overflow: number }[] =>
  calendarDays.value.map((day) => {
    const all = eventsForDay(day.date);
    return {
      visible: all.slice(0, props.maxVisible).map((event) => ({
        event,
        palette: eventPalette(event.color, event.status ?? 'confirmed'),
        time: event.allDay ? '' : formatTime(event.start),
      })),
      overflow: Math.max(0, all.length - props.maxVisible),
    };
  }),
);

// ── Sizing ──
//
// A MONTH CELL IS ~52px WIDE ON A PHONE and almost all of it used to go to
// something other than the event's name: cell padding, then chip padding, then
// a dot. The dot is gone (the chip is already the event's colour, so it said
// nothing the background did not) and both paddings are down to what keeps the
// chips off the cell borders. The day-number circle shrank with them: it is a
// label, not a control -- the whole cell is the tap target -- and at `touch` it
// was a 36px disc above a 12px line of text.

const sizeConfig: Record<MonthSize, {
  headerHeight: string;
  dayNameFont: string;
  dayNumFont: string;
  dayNumSize: string;
  eventFont: string;
  timeFont: string;
  eventPadding: string;
  eventGap: string;
  cellPadding: string;
}> = {
  sm: {
    headerHeight: '28px',
    dayNameFont: 'text-[10px] font-medium uppercase tracking-wider',
    dayNumFont: 'text-xs font-semibold',
    dayNumSize: 'w-5 h-5',
    eventFont: 'text-[10px] font-medium',
    timeFont: 'text-[9px]',
    eventPadding: 'px-1 py-0',
    eventGap: 'gap-0.5',
    cellPadding: 'p-0.5',
  },
  md: {
    headerHeight: '32px',
    dayNameFont: 'text-[11px] font-medium uppercase tracking-wider',
    dayNumFont: 'text-sm font-semibold',
    dayNumSize: 'w-6 h-6',
    eventFont: 'text-[11px] font-medium',
    timeFont: 'text-[10px]',
    eventPadding: 'px-1 py-0',
    eventGap: 'gap-0.5',
    cellPadding: 'p-1',
  },
  touch: {
    headerHeight: '36px',
    dayNameFont: 'text-xs font-medium uppercase tracking-wider',
    dayNumFont: 'text-sm font-semibold',
    dayNumSize: 'w-7 h-7',
    eventFont: 'text-xs font-medium',
    timeFont: 'text-[11px]',
    eventPadding: 'px-1 py-0.5',
    eventGap: 'gap-0.5',
    cellPadding: 'p-0.5',
  },
};

const cfg = computed(() => sizeConfig[props.size]);
</script>

<template>
  <div class="flex flex-col h-full border border-sd-border rounded-sd-md bg-white overflow-hidden">
    <!-- ── Day name header ── -->
    <div class="grid grid-cols-7 shrink-0 border-b border-sd-border">
      <div
        v-for="name in dayNames"
        :key="name"
        class="flex items-center justify-center text-sd-text-muted border-r border-sd-border last:border-r-0"
        :class="cfg.dayNameFont"
        :style="{ height: cfg.headerHeight }"
      >
        {{ name }}
      </div>
    </div>

    <!-- ── Month grid ── -->
    <div
      class="grid grid-cols-7 flex-1 min-h-0"
      :style="{ gridTemplateRows: `repeat(${weekCount}, 1fr)` }"
    >
      <div
        v-for="(day, i) in calendarDays"
        :key="i"
        class="border-r border-b border-sd-border last-of-type:border-r-0 flex flex-col overflow-hidden cursor-pointer transition-colors hover:bg-sd-purple-subtle/20"
        :class="[
          cfg.cellPadding,
          day.isWeekend && day.isCurrentMonth ? 'bg-sd-bg-alt/30' : '',
          !day.isCurrentMonth ? 'bg-sd-bg-alt/50' : '',
        ]"
        @click="emit('dayClick', day.date)"
      >
        <!-- Day number -->
        <div class="flex justify-end mb-0.5">
          <span
            class="flex items-center justify-center rounded-full"
            :class="[
              cfg.dayNumFont,
              cfg.dayNumSize,
              day.isToday
                ? 'bg-sd-orange text-white'
                : day.isCurrentMonth
                  ? 'text-sd-text'
                  : 'text-sd-text-muted/40',
            ]"
          >{{ day.dayNum }}</span>
        </div>

        <!-- Event pills -->
        <div
          class="flex flex-col min-h-0 overflow-hidden"
          :class="cfg.eventGap"
        >
          <div
            v-for="chip in dayChips[i]?.visible ?? []"
            :key="chip.event.id"
            class="sd-cal-month-chip flex items-center rounded truncate cursor-pointer transition-colors hover:opacity-80"
            :class="[
              cfg.eventPadding,
              cfg.eventFont,
              chip.palette.surfaceClass,
              chip.palette.textClass,
              chip.palette.titleDecoration,
            ]"
            :style="{ ...chip.palette.surfaceStyle, ...chip.palette.textStyle }"
            @click.stop="emit('eventClick', chip.event)"
          >
            <span
              v-if="chip.time"
              :class="cfg.timeFont"
              class="sd-cal-month-time shrink-0 mr-1 opacity-70"
            >{{ chip.time }}</span>
            <span class="truncate">{{ chip.event.title }}</span>
          </div>

          <!-- "+N more" -->
          <div
            v-if="(dayChips[i]?.overflow ?? 0) > 0"
            class="text-sd-text-muted cursor-pointer hover:text-sd-purple"
            :class="cfg.timeFont"
            @click.stop="emit('dayClick', day.date)"
          >
            +{{ dayChips[i]?.overflow }} {{ moreLabel }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
