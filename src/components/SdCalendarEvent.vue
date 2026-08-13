<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { EventStatus } from './calendar/types';
import { eventPalette } from './calendar/event-colour';

export type CalendarEventSize = 'sm' | 'md' | 'touch';

export interface SdCalendarEventProps {
  title: string;
  subtitle?: string;
  /** Time label, e.g. "09:00 - 10:30" */
  timeLabel?: string;
  /** Short time label for compact mode, e.g. "09:00". Auto-derived from timeLabel if omitted. */
  timeLabelShort?: string;
  status?: EventStatus;
  /** Custom color override (CSS color value) */
  color?: string;
  /** Layout direction -- vertical means event grows downward, horizontal means rightward */
  orientation?: 'vertical' | 'horizontal';
  size?: CalendarEventSize;
  /** When true, the event becomes draggable (HTML5 native drag-and-drop). */
  draggable?: boolean;
}

const props = withDefaults(defineProps<SdCalendarEventProps>(), {
  status: 'confirmed',
  orientation: 'vertical',
  size: 'md',
  draggable: false,
});

const emit = defineEmits<{
  click: [e: MouseEvent];
  dragstart: [e: DragEvent];
  dragend: [e: DragEvent];
}>();

void props;

// ── Adaptive layout via ResizeObserver ──
// compact = single line: "09:00 Title"
// medium  = two lines: time range, then title
// full    = three lines: time range, title, subtitle

type LayoutMode = 'compact' | 'medium' | 'full';

const rootEl = ref<HTMLElement | null>(null);
const layoutMode = ref<LayoutMode>('full');
let observer: ResizeObserver | null = null;

// Thresholds per size (in px).
// compact: single inline line (time + title). Needs ~20-24px.
// medium: two lines (time range + title). Needs ~34-40px.
// full: three lines (time + title + subtitle). Needs ~60+ px.
//
// These came DOWN when the block's vertical padding did. They are the height at
// which the next line up stops fitting, so trimming 4px of padding off the top
// and 4px off the bottom means a block 8px shorter than before can still carry
// the same text. Leaving them where they were would have spent the reclaimed
// space on nothing: a 60px block would still have dropped its subtitle while
// holding an empty strip where the subtitle would have gone.
const thresholds: Record<CalendarEventSize, { compact: number; medium: number }> = {
  sm: { compact: 28, medium: 44 },
  md: { compact: 30, medium: 50 },
  touch: { compact: 36, medium: 62 },
};

function updateLayout(height: number) {
  const t = thresholds[props.size];
  if (height <= t.compact) {
    layoutMode.value = 'compact';
  } else if (height <= t.medium) {
    layoutMode.value = 'medium';
  } else {
    layoutMode.value = 'full';
  }
}

onMounted(() => {
  if (!rootEl.value) return;
  observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      updateLayout(entry.contentRect.height);
    }
  });
  observer.observe(rootEl.value);
  updateLayout(rootEl.value.offsetHeight);
});

onUnmounted(() => {
  observer?.disconnect();
});

const shortTime = computed(() => {
  if (props.timeLabelShort) return props.timeLabelShort;
  if (!props.timeLabel) return '';
  // Extract start time: "09:00 - 10:30" -> "09:00"
  return props.timeLabel.split(' ')[0] ?? props.timeLabel;
});

// ── Styles ──

// The status/colour palette is NOT decided here. It is `calendar/event-colour`,
// shared with SdCalendarMonth, which is what stops month view from having its
// own opinion about what colour an event is; see the header of that file.
const style = computed(() => eventPalette(props.color, props.status));

// ── Sizing ──
//
// PADDING IS THREE FIELDS, NOT ONE `px`, and that is load-bearing. The text
// wrapper has to clear the accent bar on its left, and the bar's width is a
// per-size number, so the left inset is a per-size number too. It used to be a
// flat `pl-4` in the template that quietly won over the `px-*` beside it by
// Tailwind's property ordering: 16px of inset over a 4px bar, so 12px of the
// block's width was dead space before the first letter. Now `inset` is the bar
// plus a 4px gutter and nothing overrides anything.
//
// The vertical and right padding came down with it. The complaint this answers
// is that a block was mostly margin: at `touch` it spent 8px above and 8px
// below a 20px line of text, which on a phone is a third of a 45-minute event
// given to empty space.
const sizeMap: Record<CalendarEventSize, {
  /** Vertical + right padding for the three-line layout. */
  padding: string;
  /** Vertical + right padding for the one- and two-line layouts. */
  paddingCompact: string;
  /** Left inset: clears the accent bar, plus a small gutter. */
  inset: string;
  title: string;
  subtitle: string;
  time: string;
  accentWidth: string;
  gap: string;
}> = {
  sm: {
    padding: 'py-0.5 pr-1.5',
    paddingCompact: 'py-0 pr-1.5',
    inset: 'pl-[7px]',
    title: 'text-[11px] font-semibold leading-tight',
    subtitle: 'text-[10px] leading-tight',
    time: 'text-[10px]',
    accentWidth: 'w-[3px]',
    gap: 'gap-0',
  },
  md: {
    padding: 'py-1 pr-2',
    paddingCompact: 'py-0.5 pr-2',
    inset: 'pl-2',
    title: 'text-xs font-semibold leading-tight',
    subtitle: 'text-[11px] leading-tight',
    time: 'text-[11px]',
    accentWidth: 'w-1',
    gap: 'gap-0',
  },
  touch: {
    padding: 'py-1 pr-2.5',
    paddingCompact: 'py-0.5 pr-2.5',
    inset: 'pl-[10px]',
    title: 'text-sm font-semibold leading-snug',
    subtitle: 'text-xs leading-snug',
    time: 'text-xs',
    accentWidth: 'w-1.5',
    gap: 'gap-0',
  },
};

const sz = computed(() => sizeMap[props.size]);

/**
 * How many lines the title may run to.
 *
 * IT FOLLOWS THE LAYOUT MODE, WHICH IS THE THING THAT KNOWS THE HEIGHT. Making
 * it a per-size number was wrong for the case that matters: the week grid draws
 * every block at `sm` whatever the calendar's own size, so a 96px three-hour
 * block and a 30px half-hour one would have got the same answer.
 *
 * The title was `truncate` in all three modes before, which is a ONE-LINE rule,
 * and in a tall narrow block that is the worst of both worlds: a 43px column at
 * 390px rendered "Workshop Roadmap" as "Work..." above 80px of empty colour.
 * The name of the appointment is the only text in the block that cannot be read
 * off the grid itself -- the position states the time, the column states the
 * day -- so it is what the spare room should go to.
 *
 * Bounded rather than "fill the block": clamping to the mode's own budget keeps
 * whole lines. Letting the text run and relying on the parent's `overflow:
 * hidden` would slice the last line through the middle of its letters.
 */
const titleLines = computed(() => {
  if (layoutMode.value === 'compact') return 'truncate';
  return layoutMode.value === 'medium' ? 'line-clamp-2 break-words' : 'line-clamp-3 break-words';
});
</script>

<template>
  <!-- ════ HORIZONTAL: two-line bar (Gantt-style) ════ -->
  <div
    v-if="orientation === 'horizontal'"
    ref="rootEl"
    class="relative rounded-[5px] border cursor-pointer transition-all hover:shadow-sm active:scale-[0.98] select-none overflow-hidden flex flex-col justify-center h-full"
    :class="style.surfaceClass"
    :style="style.surfaceStyle"
    role="button"
    tabindex="0"
    :draggable="draggable"
    @click="$emit('click', $event)"
    @keydown.enter="$emit('click', $event as unknown as MouseEvent)"
    @dragstart="(e) => emit('dragstart', e)"
    @dragend="(e) => emit('dragend', e)"
  >
    <!-- Left accent bar -->
    <div
      class="absolute top-0 left-0 bottom-0 w-1 rounded-l-[4px]"
      :class="style.accentClass"
      :style="style.accentStyle"
    />
    <!-- Line 1: title -->
    <div class="sd-cal-event-body overflow-hidden" :class="[sz.inset, sz.padding]">
      <div
        class="truncate"
        :class="[sz.title, style.titleDecoration, style.textClass]"
        :style="style.textStyle"
      >
        {{ title }}
      </div>
    </div>
    <!-- Line 2: time -->
    <div
      v-if="timeLabel"
      class="sd-cal-event-body overflow-hidden"
      :class="[sz.inset, sz.paddingCompact]"
    >
      <div
        class="sd-cal-event-time truncate opacity-70"
        :class="[sz.time, style.textClass]"
        :style="style.textStyle"
      >
        {{ timeLabel }}
      </div>
    </div>
  </div>

  <!-- ════ VERTICAL: adaptive multi-line card ════ -->
  <div
    v-else
    ref="rootEl"
    class="relative rounded-[6px] border cursor-pointer transition-all hover:shadow-sm active:scale-[0.98] select-none overflow-hidden flex flex-col"
    :class="style.surfaceClass"
    :style="style.surfaceStyle"
    role="button"
    tabindex="0"
    :draggable="draggable"
    @click="$emit('click', $event)"
    @keydown.enter="$emit('click', $event as unknown as MouseEvent)"
    @dragstart="(e) => emit('dragstart', e)"
    @dragend="(e) => emit('dragend', e)"
  >
    <!-- Left accent bar -->
    <div
      class="absolute top-0 left-0 bottom-0 rounded-l-[5px]"
      :class="[sz.accentWidth, style.accentClass]"
      :style="style.accentStyle"
    />

    <!-- COMPACT: single line "09:00 Title" -->
    <div
      v-if="layoutMode === 'compact'"
      class="sd-cal-event-body flex items-center min-w-0 overflow-hidden flex-1 whitespace-nowrap"
      :class="[sz.inset, sz.paddingCompact]"
    >
      <span
        v-if="timeLabel"
        class="sd-cal-event-time shrink-0 mr-1"
        :class="[sz.time, style.textClass]"
        :style="style.textStyle"
      >{{ shortTime }}</span>
      <span
        class="truncate"
        :class="[sz.title, style.titleDecoration, style.textClass]"
        :style="style.textStyle"
      >{{ title }}</span>
    </div>

    <!-- MEDIUM: time + title (2 lines) -->
    <div
      v-else-if="layoutMode === 'medium'"
      class="sd-cal-event-body flex flex-col justify-center min-w-0 overflow-hidden flex-1"
      :class="[sz.inset, sz.paddingCompact, sz.gap]"
    >
      <div
        v-if="timeLabel"
        class="sd-cal-event-time truncate"
        :class="[sz.time, style.textClass]"
        :style="style.textStyle"
      >
        {{ timeLabel }}
      </div>
      <div
        :class="[sz.title, titleLines, style.titleDecoration, style.textClass]"
        :style="style.textStyle"
      >
        {{ title }}
      </div>
    </div>

    <!-- FULL: time + title + subtitle -->
    <div
      v-else
      class="sd-cal-event-body flex flex-col min-w-0 overflow-hidden flex-1"
      :class="[sz.inset, sz.padding, sz.gap]"
    >
      <div
        v-if="timeLabel"
        class="sd-cal-event-time truncate"
        :class="[sz.time, style.textClass]"
        :style="style.textStyle"
      >
        {{ timeLabel }}
      </div>
      <div
        :class="[sz.title, titleLines, style.titleDecoration, style.textClass]"
        :style="style.textStyle"
      >
        {{ title }}
      </div>
      <div
        v-if="subtitle"
        class="sd-cal-event-subtitle truncate opacity-70"
        :class="[sz.subtitle, style.textClass]"
        :style="style.textStyle"
      >
        {{ subtitle }}
      </div>
    </div>
  </div>
</template>
