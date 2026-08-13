<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import type { CalendarEvent } from './calendar/types';
import { type AllDayColumn, packAllDayEvents } from './calendar/all-day-packer';
import { columnRegionTemplate } from './calendar/day-range';

export type AllDayBandSize = 'sm' | 'md' | 'touch';

export interface SdCalendarAllDayBandProps {
  /**
   * Band columns. One per day in week view, one per resource in day view.
   * Must line up with the grid the band is pinned above, which is why the
   * caller also supplies `columnTemplate`.
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
   * Inline style for the COLUMN REGION only, so the gutter label holds still.
   *
   * The band's gutter says `Ganztags`, which is a row name and is true of
   * every period; its columns say Monday, Tuesday, Wednesday, which are not.
   * A host paging the calendar by swiping hands the same object to every part
   * of the grid, and they travel together while each gutter stays. See
   * `SdCalendarWeekGrid`.
   */
  columnShift?: CSSProperties;
}

const props = withDefaults(defineProps<SdCalendarAllDayBandProps>(), {
  label: 'Ganztags',
  size: 'md',
  maxRows: 3,
});

const emit = defineEmits<{
  eventClick: [event: CalendarEvent];
  columnClick: [column: AllDayColumn];
}>();

const allDayEvents = computed(() => props.events.filter((e) => e.allDay));

const packed = computed(() => packAllDayEvents(allDayEvents.value, props.columns));

/** The band disappears entirely when nothing is all-day — so a caller that
 *  never sets `allDay` sees exactly the layout it saw before this existed. */
const hasContent = computed(() => packed.value.rowCount > 0);

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
 * `grid-template-columns` INSIDE the column region.
 *
 * The columns moved one level down so they could be shifted and clipped as a
 * unit (`columnShift`). The outer grid still carries `columnTemplate`, and the
 * region spans `2 / -1` of it, so the total width is unchanged and callers
 * pass exactly what they always passed.
 */
const innerTemplate = computed(() => columnRegionTemplate(props.columns.length));

const rowTemplate = computed(
  () => `repeat(${packed.value.rowCount}, ${cfg.value.rowHeight}px)`,
);

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
      <!-- Gutter label, spanning every row. Stays put under a `columnShift`:
           `Ganztags` names the row, and the row is the same row in every
           period. -->
      <div
        class="border-r border-sd-border flex items-start justify-end pr-2 select-none text-sd-text-secondary"
        :class="cfg.label"
        :style="{ gridColumn: '1', gridRow: `1 / span ${packed.rowCount}` }"
      >
        {{ label }}
      </div>

      <!-- The column region: one grid item spanning every column but the
           gutter, so a page turn can move and clip it as a unit. -->
      <div
        class="overflow-clip min-w-0"
        :style="{ gridColumn: '2 / -1', gridRow: `1 / span ${packed.rowCount}` }"
      >
        <div
          class="grid h-full"
          :style="[
            { gridTemplateColumns: innerTemplate, gridTemplateRows: rowTemplate },
            columnShift ?? {},
          ]"
        >
          <!-- Column backgrounds (also the click targets for creating) -->
          <div
            v-for="(col, ci) in columns"
            :key="`bg-${col.key}`"
            class="border-r border-sd-border last:border-r-0 cursor-pointer transition-colors hover:bg-sd-purple-subtle/30"
            :style="{ gridColumn: `${ci + 1}`, gridRow: `1 / span ${packed.rowCount}` }"
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
