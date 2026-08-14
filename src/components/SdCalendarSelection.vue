<script setup lang="ts">
// ---------------------------------------------------------------------------
// The proposed range on a time grid: a bordered box with a handle at each end.
//
// WHAT IT IS FOR. Tapping an empty slot in a calendar should say WHEN, on the
// grid, in the place the finger landed, and let that be adjusted before
// anything is created. Google Calendar's phone app does exactly this and it is
// what the SaniMail owner asked to be copied: the tap proposes 12:00 to 13:00,
// the handles move it, and only the form on top of it decides whether an event
// is ever written.
//
// IT DRAWS AND IT REPORTS, AND IT DECIDES NOTHING. The box is positioned from
// the `top`/`height` the grid computed, and a handle press is handed straight
// back out. Where the range then goes is `useGridResize`'s arithmetic and the
// host's answer, the same pair that already move an event's edges — one snap
// rule, one minimum length, one Escape, for both.
//
// THE HANDLES ARE 44px AND LOOK 14. The circle is what the eye needs; the
// touch target is what the thumb needs, and the two are different numbers on a
// phone. The transparent padding around each circle is the difference.
//
// `data-sd-resize-handle` IS ON THEM DELIBERATELY. A host with its own swipe
// gesture over the grid (SaniMail pages the calendar by swiping it) already
// stands down on that attribute; a selection handle is the same kind of thing
// as an event's resize handle, and dragging one must never also turn the page.
// The more specific `data-sd-selection-handle` is there to be asserted on.
// ---------------------------------------------------------------------------

export type SelectionEdge = 'start' | 'end';

export interface SdCalendarSelectionProps {
  /** Where the box sits in its day column, as CSS lengths. */
  top: string;
  height: string;
  /** Read out to a screen reader. The host owns the words. */
  label?: string;
  /** Accessible names for the two handles. */
  startHandleLabel?: string;
  endHandleLabel?: string;
}

withDefaults(defineProps<SdCalendarSelectionProps>(), {
  label: '',
  startHandleLabel: 'Start',
  endHandleLabel: 'End',
});

const emit = defineEmits<{
  handleDown: [payload: { edge: SelectionEdge; event: PointerEvent }];
  /** Keyboard equivalent: one step in the given direction. */
  handleStep: [payload: { edge: SelectionEdge; direction: -1 | 1 }];
}>();

function onKeydown(edge: SelectionEdge, event: KeyboardEvent): void {
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    emit('handleStep', { edge, direction: -1 });
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    emit('handleStep', { edge, direction: 1 });
  }
}
</script>

<template>
  <div
    class="sd-cal-selection absolute left-0.5 right-0.5 z-20 rounded-md border-2 border-sd-text/55
           bg-sd-text/5 pointer-events-none"
    data-sd-selection
    role="status"
    :aria-label="label"
    :style="{ top, height }"
  >
    <!-- Top-left and bottom-right, which is where Google puts them: two
         opposite corners read as one diagonal grab rather than as a pair of
         buttons the user has to tell apart. -->
    <button
      type="button"
      data-sd-resize-handle
      data-sd-selection-handle="start"
      class="sd-cal-selection-handle absolute -top-5 -left-5 p-5 pointer-events-auto touch-none
             cursor-ns-resize"
      :aria-label="startHandleLabel"
      @pointerdown="emit('handleDown', { edge: 'start', event: $event })"
      @keydown="onKeydown('start', $event)"
      @dragstart.prevent
    >
      <span class="block w-3.5 h-3.5 rounded-full bg-sd-text/70 ring-2 ring-white" />
    </button>
    <button
      type="button"
      data-sd-resize-handle
      data-sd-selection-handle="end"
      class="sd-cal-selection-handle absolute -bottom-5 -right-5 p-5 pointer-events-auto touch-none
             cursor-ns-resize"
      :aria-label="endHandleLabel"
      @pointerdown="emit('handleDown', { edge: 'end', event: $event })"
      @keydown="onKeydown('end', $event)"
      @dragstart.prevent
    >
      <span class="block w-3.5 h-3.5 rounded-full bg-sd-text/70 ring-2 ring-white" />
    </button>
  </div>
</template>
