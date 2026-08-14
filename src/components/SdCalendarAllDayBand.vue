<script setup lang="ts">
import { computed } from 'vue';
import type { CalendarEvent } from './calendar/types';
import { type AllDayColumn, packAllDayEvents } from './calendar/all-day-packer';
import { stripGeometry, type StripGeometry } from './calendar/strip';

export type AllDayBandSize = 'sm' | 'md' | 'touch';

export interface SdCalendarAllDayBandProps {
  /**
   * Band columns. One per day in week view, one per resource in day view.
   * Must line up with the grid the band is pinned above, which is why the
   * caller also supplies `columnTemplate`.
   *
   * Under `paging` this is the whole STRIP -- the lead and trail columns
   * included -- so an all-day chip is drawn across the days it actually covers
   * and travels with them instead of appearing when the page turn lands.
   */
  columns: AllDayColumn[];
  /** All-day events. Timed events are ignored, so callers may pass everything. */
  events: CalendarEvent[];
  /**
   * The parent grid's `grid-template-columns`, including the leading
   * time/label column, so the band's cells sit exactly under the day headers.
   */
  columnTemplate: string;
  /** Row label. The library carries no i18n; the host supplies the string. */
  label?: string;
  size?: AllDayBandSize;
  /** Rows shown before the band starts scrolling. */
  maxRows?: number;
  /**
   * The strip the band's columns belong to, ALREADY MEASURED by the grid above.
   *
   * Handed over rather than worked out again from `columns.length` and a step:
   * the band sits directly under the day headers and directly over the time
   * body, and a band that computed its own width could be off by a column at
   * exactly the moment all three are sliding. The gutter label is not part of
   * it -- `Ganztags` is a row name and is true of every period, so it stays
   * while the columns beside it travel.
   */
  strip?: StripGeometry;
  /**
   * Draw the band even when nothing in it is all-day.
   *
   * OFF BY DEFAULT, so a caller that never sets `allDay` keeps exactly the
   * layout it has always had -- no empty row appearing under its day headers.
   *
   * ON WHERE THE BAND IS A TARGET AND NOT ONLY A DISPLAY. A host that creates
   * events from a tap needs the all-day lane to exist BEFORE there is an
   * all-day event in it, or the one row that means "all day" is the one place
   * an all-day event cannot be started from. It is one row high when empty.
   */
  alwaysVisible?: boolean;
}

const props = withDefaults(defineProps<SdCalendarAllDayBandProps>(), {
  label: 'Ganztags',
  size: 'md',
  maxRows: 3,
  strip: undefined,
  alwaysVisible: false,
});

const emit = defineEmits<{
  eventClick: [event: CalendarEvent];
  columnClick: [column: AllDayColumn];
}>();

const allDayEvents = computed(() => props.events.filter((e) => e.allDay));

const packed = computed(() => packAllDayEvents(allDayEvents.value, props.columns));

/** The band disappears entirely when nothing is all-day — so a caller that
 *  never sets `allDay` sees exactly the layout it saw before this existed.
 *  `alwaysVisible` is for the host that taps it to create one. */
const hasContent = computed(() => packed.value.rowCount > 0 || props.alwaysVisible);

const cfg = computed(() => {
  if (props.size === 'touch') {
    return { rowHeight: 28, chip: 'text-xs px-2 py-0.5', label: 'text-xs' };
  }
  if (props.size === 'sm') {
    return { rowHeight: 20, chip: 'text-[10px] px-1.5 py-0', label: 'text-[10px]' };
  }
  return { rowHeight: 22, chip: 'text-[11px] px-2 py-0', label: 'text-[10px]' };
});

const maxHeight = computed(() => `${props.maxRows * cfg.value.rowHeight + 8}px`);

/**
 * The strip inside the column region.
 *
 * The columns moved one level down so they could be slid and clipped as a unit.
 * The outer grid still carries `columnTemplate`, and the region spans `2 / -1`
 * of it, so the total width is unchanged and callers pass exactly what they
 * always passed.
 */
/**
 * Named apart from the `strip` PROP on purpose. A setup binding and a prop with
 * one name resolve to the setup binding in the template, which works and is
 * exactly the kind of thing that stops working when somebody deletes what looks
 * like a duplicate.
 */
const geo = computed(() => props.strip ?? stripGeometry(props.columns.length, 0));

/** How many rows the band draws. At least one where it is always visible. */
const rowCount = computed(() => Math.max(packed.value.rowCount, props.alwaysVisible ? 1 : 0));

const rowTemplate = computed(() => `repeat(${rowCount.value}, ${cfg.value.rowHeight}px)`);

/**
 * Whether a chip lies wholly outside the window, and so is painted but not
 * offered. One that straddles the edge is half on screen and stays live.
 */
function chipOutside(colStart: number, colEnd: number): boolean {
  const first = geo.value.lead;
  const last = geo.value.total - geo.value.trail - 1;
  return colEnd < first || colStart > last;
}

function chipStyle(colStart: number, colEnd: number, row: number) {
  // +1 because CSS grid is 1-based. The gutter is no longer a column of this
  // grid — it is the outer one's — so there is no second offset any more.
  return {
    gridColumn: `${colStart + 1} / span ${colEnd - colStart + 1}`,
    gridRow: `${row + 1}`,
  };
}

function chipColors(event: CalendarEvent) {
  if (!event.color) return undefined;
  return {
    backgroundColor: `${event.color}1F`,
    borderColor: `${event.color}59`,
    color: event.color,
  };
}

function chipLabel(event: CalendarEvent): string {
  return `${props.label}: ${event.title}`;
}
</script>

<template>
  <div
    v-if="hasContent"
    class="shrink-0 border-b border-sd-border bg-white overflow-y-auto"
    :style="{ maxHeight }"
  >
    <div
      class="grid py-1"
      :style="{
        gridTemplateColumns: columnTemplate,
        gridTemplateRows: rowTemplate,
      }"
    >
      <!-- Gutter label, spanning every row. Stays put while the columns
           travel: `Ganztags` names the row, and the row is the same row in
           every period. -->
      <div
        class="border-r border-sd-border flex items-start justify-end pr-2 select-none text-sd-text-secondary"
        :class="cfg.label"
        :style="{ gridColumn: '1', gridRow: `1 / span ${rowCount}` }"
      >
        {{ label }}
      </div>

      <!-- The column region: one grid item spanning every column but the
           gutter, holding the strip so a page turn moves and clips it whole. -->
      <div
        class="overflow-clip min-w-0"
        :style="{ gridColumn: '2 / -1', gridRow: `1 / span ${rowCount}` }"
      >
        <div
          class="grid h-full"
          :style="[
            { gridTemplateColumns: geo.template, gridTemplateRows: rowTemplate },
            geo.style ?? {},
          ]"
        >
          <!-- Column backgrounds (also the click targets for creating). The
               lead and trail columns are `inert`: painted, never clickable,
               never a tab stop, because they are off screen. -->
          <div
            v-for="(col, ci) in columns"
            :key="`bg-${col.key}`"
            class="border-r border-sd-border last:border-r-0 cursor-pointer transition-colors hover:bg-sd-purple-subtle/30"
            :style="{ gridColumn: `${ci + 1}`, gridRow: `1 / span ${rowCount}` }"
            :inert="ci >= geo.lead && ci < geo.total - geo.trail ? undefined : true"
            @click="emit('columnClick', col)"
          />

          <!-- Event chips, drawn over the backgrounds -->
          <button
            v-for="item in packed.items"
            :key="item.event.id"
            type="button"
            class="sd-focus-ring relative z-10 mx-1 rounded-[5px] border truncate text-left font-semibold
                   bg-sd-purple-subtle border-sd-purple/40 text-sd-purple-dark
                   hover:brightness-95 transition-[filter]"
            :class="[
              cfg.chip,
              item.clippedStart ? 'rounded-l-none' : '',
              item.clippedEnd ? 'rounded-r-none' : '',
            ]"
            :style="[chipStyle(item.colStart, item.colEnd, item.row), chipColors(item.event) ?? {}]"
            :aria-label="chipLabel(item.event)"
            :inert="chipOutside(item.colStart, item.colEnd) ? true : undefined"
            @click="emit('eventClick', item.event)"
          >
            <span
              v-if="item.clippedStart"
              aria-hidden="true"
            >&lsaquo; </span>{{ item.event.title }}<span
              v-if="item.clippedEnd"
              aria-hidden="true"
            > &rsaquo;</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
