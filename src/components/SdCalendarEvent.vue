<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { EventStatus } from './calendar/types';

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
const thresholds: Record<CalendarEventSize, { compact: number; medium: number }> = {
  sm: { compact: 32, medium: 50 },
  md: { compact: 34, medium: 58 },
  touch: { compact: 42, medium: 72 },
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

const statusStyles: Record<EventStatus, {
  bg: string;
  border: string;
  accent: string;
  text: string;
  titleDecoration: string;
}> = {
  confirmed: {
    bg: 'bg-sd-success-light',
    border: 'border-sd-success/30',
    accent: 'bg-sd-success',
    text: 'text-sd-success-text',
    titleDecoration: '',
  },
  pending: {
    bg: 'bg-sd-warning-light',
    border: 'border-sd-warning/30',
    accent: 'bg-sd-warning',
    text: 'text-sd-warning-text',
    titleDecoration: '',
  },
  tentative: {
    bg: 'bg-sd-purple-subtle/60',
    border: 'border-dashed border-sd-purple/40',
    accent: 'bg-sd-purple/50',
    text: 'text-sd-purple-dark',
    titleDecoration: '',
  },
  cancelled: {
    bg: 'bg-sd-error-light/60',
    border: 'border-sd-error/20',
    accent: 'bg-sd-error/40',
    text: 'text-sd-error-text',
    titleDecoration: 'line-through',
  },
};

const sizeMap: Record<CalendarEventSize, {
  padding: string;
  paddingCompact: string;
  title: string;
  subtitle: string;
  time: string;
  accentWidth: string;
  gap: string;
}> = {
  sm: {
    padding: 'px-2 py-1',
    paddingCompact: 'px-2 py-0.5',
    title: 'text-[11px] font-semibold leading-tight',
    subtitle: 'text-[10px] leading-tight',
    time: 'text-[10px]',
    accentWidth: 'w-[3px]',
    gap: 'gap-0.5',
  },
  md: {
    padding: 'px-2.5 py-1.5',
    paddingCompact: 'px-2.5 py-0.5',
    title: 'text-xs font-semibold leading-tight',
    subtitle: 'text-[11px] leading-tight',
    time: 'text-[11px]',
    accentWidth: 'w-1',
    gap: 'gap-0.5',
  },
  touch: {
    padding: 'px-3 py-2',
    paddingCompact: 'px-3 py-1',
    title: 'text-sm font-semibold leading-snug',
    subtitle: 'text-xs leading-snug',
    time: 'text-xs',
    accentWidth: 'w-1.5',
    gap: 'gap-0.5',
  },
};

const style = computed(() => statusStyles[props.status]);
const sz = computed(() => sizeMap[props.size]);

const customAccentStyle = computed(() => {
  if (!props.color) return undefined;
  return { backgroundColor: props.color };
});

const customBgStyle = computed(() => {
  if (!props.color) return undefined;
  return { backgroundColor: `${props.color}14` };
});

const customBorderStyle = computed(() => {
  if (!props.color) return undefined;
  return { borderColor: `${props.color}4D` };
});
</script>

<template>
  <!-- ════ HORIZONTAL: two-line bar (Gantt-style) ════ -->
  <div
    v-if="orientation === 'horizontal'"
    ref="rootEl"
    class="relative rounded-[5px] border cursor-pointer transition-all hover:shadow-sm active:scale-[0.98] select-none overflow-hidden flex flex-col justify-center h-full"
    :class="[!color ? [style.bg, style.border] : 'border']"
    :style="[color ? { ...customBgStyle, ...customBorderStyle } : {}]"
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
      :class="[!color ? style.accent : '']"
      :style="customAccentStyle"
    />
    <!-- Line 1: title -->
    <div class="pl-3 pr-2 overflow-hidden">
      <div
        class="truncate"
        :class="[sz.title, style.titleDecoration, !color ? style.text : '']"
        :style="color ? { color } : {}"
      >
        {{ title }}
      </div>
    </div>
    <!-- Line 2: time -->
    <div
      v-if="timeLabel"
      class="pl-3 pr-2 overflow-hidden"
    >
      <div
        class="truncate opacity-70"
        :class="[sz.time, !color ? style.text : '']"
        :style="color ? { color } : {}"
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
    :class="[!color ? [style.bg, style.border] : 'border']"
    :style="[color ? { ...customBgStyle, ...customBorderStyle } : {}]"
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
      :class="[sz.accentWidth, !color ? style.accent : '']"
      :style="customAccentStyle"
    />

    <!-- COMPACT: single line "09:00 Title" -->
    <div
      v-if="layoutMode === 'compact'"
      class="flex items-center min-w-0 overflow-hidden flex-1 whitespace-nowrap pl-4"
      :class="sz.paddingCompact"
    >
      <span
        v-if="timeLabel"
        class="shrink-0 mr-1.5"
        :class="[sz.time, !color ? style.text : '']"
        :style="color ? { color } : {}"
      >{{ shortTime }}</span>
      <span
        class="truncate"
        :class="[sz.title, style.titleDecoration, !color ? style.text : '']"
        :style="color ? { color } : {}"
      >{{ title }}</span>
    </div>

    <!-- MEDIUM: time + title (2 lines) -->
    <div
      v-else-if="layoutMode === 'medium'"
      class="flex flex-col min-w-0 overflow-hidden flex-1 pl-4"
      :class="[sz.paddingCompact, sz.gap]"
    >
      <div
        v-if="timeLabel"
        :class="[sz.time, !color ? style.text : '']"
        :style="color ? { color } : {}"
      >
        {{ timeLabel }}
      </div>
      <div
        :class="[sz.title, style.titleDecoration, !color ? style.text : '']"
        :style="color ? { color } : {}"
        class="truncate"
      >
        {{ title }}
      </div>
    </div>

    <!-- FULL: time + title + subtitle -->
    <div
      v-else
      class="flex flex-col min-w-0 overflow-hidden flex-1 pl-4"
      :class="[sz.padding, sz.gap]"
    >
      <div
        v-if="timeLabel"
        :class="[sz.time, !color ? style.text : '']"
        :style="color ? { color } : {}"
      >
        {{ timeLabel }}
      </div>
      <div
        :class="[sz.title, style.titleDecoration, !color ? style.text : '']"
        :style="color ? { color } : {}"
        class="truncate"
      >
        {{ title }}
      </div>
      <div
        v-if="subtitle"
        class="truncate opacity-70"
        :class="[sz.subtitle, !color ? style.text : '']"
        :style="color ? { color } : {}"
      >
        {{ subtitle }}
      </div>
    </div>
  </div>
</template>
