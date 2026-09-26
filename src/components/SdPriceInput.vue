<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { formatCents, readMoneyDraft, stripCurrencyPrefix } from '../utils/money';

export type PriceInputSize = 'sm' | 'md' | 'lg' | 'touch';

export interface SdPriceInputProps {
  /** Integer cents. Single source of truth -- never floats. */
  modelValue?: number;
  label?: string;
  /** Currency code shown as a fixed prefix (e.g. "CHF"). */
  currency?: string;
  size?: PriceInputSize;
  /** Inclusive lower bound in cents. Typing below this clamps to min. */
  min?: number;
  /** Inclusive upper bound in cents. Typing above this is rejected. */
  max?: number;
  error?: string;
  hint?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  /** Auto-focus on mount (useful inside the free-form modal). */
  autofocus?: boolean;
}

const props = withDefaults(defineProps<SdPriceInputProps>(), {
  modelValue: 0,
  currency: 'CHF',
  size: 'md',
  min: 0,
  max: 99999900, // CHF 999,999.00 ceiling
  disabled: false,
  readonly: false,
  required: false,
  autofocus: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

const inputRef = ref<HTMLInputElement | null>(null);

const sizeClasses: Record<PriceInputSize, { wrapper: string; input: string; label: string; affix: string }> = {
  sm:    { wrapper: 'h-8',       input: 'text-[13px] px-2.5', label: 'text-xs mb-1',     affix: 'text-[13px]' },
  md:    { wrapper: 'h-[38px]',  input: 'text-sm px-3',       label: 'text-[13px] mb-1.5', affix: 'text-sm' },
  lg:    { wrapper: 'h-[46px]',  input: 'text-[15px] px-3.5', label: 'text-sm mb-1.5',   affix: 'text-[15px]' },
  touch: { wrapper: 'h-14',      input: 'text-base px-4',     label: 'text-sm mb-2',     affix: 'text-base' },
};

/**
 * Entry model. The rule itself (digits only are Rappen, a separator or a
 * grouping mark means francs) lives in `utils/money.ts`, shared with
 * `parseMoneyToCents`, so the field and a paste parser cannot disagree.
 *
 * The field shows one of two things, decided by what has been typed:
 *
 *   - Digits only: the right-filled figure, exactly as this field always
 *     behaved. Typing 1, 9, 0, 0 walks 0.01 -> 0.19 -> 1.90 -> 19.00 and
 *     backspace drops the rightmost digit.
 *   - Once a `.`, `,`, `'` or space is typed: the text as typed (`19.`,
 *     `19.5`), never reformatted underneath the user.
 *
 * `buffer` is what the user has typed, in their notation. It is kept apart
 * from the display because the two differ while digits are right-filled:
 * after typing 1, 9 the field shows `0.19` but the typed francs are `19`, so
 * a `.` typed next makes `19.` and not `0.19.`.
 *
 * Blur and Enter show the canonical `X.YY` of `committed`, the value last
 * emitted (or received), so a field that has been left always shows exactly
 * what will be saved.
 */
const DIGITS_ONLY = /^\d*$/;

/** The digit buffer that stands for a stored value; empty for zero. */
function bufferFor(cents: number): string {
  return cents > 0 ? String(Math.floor(cents)) : '';
}

function figureFor(cents: number): string {
  return formatCents(Math.max(0, Math.floor(cents)));
}

let committed = props.modelValue;
let buffer = bufferFor(committed);
/** True while the field shows an untouched stored value (after mount, blur, Enter). */
let pristine = true;
/** Selection at `beforeinput`, so an edit is read exactly where the browser offers it. */
let pendingSelection: [number, number] | null = null;

/** What the <input> holds. Bound to :value so a re-render never overwrites typed text. */
const display = ref(figureFor(committed));
/** A paste that could not be read. Shown as the error state until the next edit or blur. */
const refused = ref(false);

const invalid = computed(() => Boolean(props.error) || refused.value);

const wrapperClasses = computed(() => [
  'flex items-center rounded-lg border bg-white transition-all duration-150',
  sizeClasses[props.size].wrapper,
  invalid.value
    ? 'border-sd-error focus-within:ring-2 focus-within:ring-sd-error/20'
    : 'border-sd-border focus-within:border-sd-orange focus-within:ring-2 focus-within:ring-sd-orange/10',
  props.disabled ? 'opacity-40 pointer-events-none bg-sd-bg-alt' : '',
]);

/** Back to the canonical figure of the stored value. */
function settle() {
  buffer = bufferFor(committed);
  pristine = true;
  refused.value = false;
  display.value = figureFor(committed);
  const el = inputRef.value;
  if (el && el.value !== display.value) el.value = display.value;
}

watch(
  () => props.modelValue,
  (value) => {
    // Our own emit coming back is not a change; anything else is the host
    // setting the value, and the field follows it.
    if (value === committed) return;
    committed = value;
    settle();
  },
);

interface Edit {
  /** Start of the replaced range in the text before the edit. */
  start: number;
  /** End of the replaced range in the text before the edit. */
  end: number;
  inserted: string;
}

/**
 * The edit that turned `before` into `after`. Taken from the selection seen at
 * `beforeinput` when it fits; otherwise (the on-screen keyboard writes
 * `.value` and fires a bare `input`) the longest common prefix and suffix.
 * Where that is ambiguous (typing a digit into a run of the same digit) every
 * reading produces the same text, so nothing downstream depends on which.
 */
function readEdit(before: string, after: string, selection: [number, number] | null): Edit {
  if (selection) {
    const [start, end] = selection;
    const tail = before.length - end;
    if (
      start <= end
      && end <= before.length
      && after.length >= start + tail
      && after.startsWith(before.slice(0, start))
      && after.endsWith(before.slice(end))
      && (start !== end || after.length > before.length)
    ) {
      return { start, end, inserted: after.slice(start, after.length - tail) };
    }
  }
  const limit = Math.min(before.length, after.length);
  let start = 0;
  while (start < limit && before[start] === after[start]) start++;
  let same = 0;
  while (same < limit - start && before[before.length - 1 - same] === after[after.length - 1 - same]) same++;
  return { start, end: before.length - same, inserted: after.slice(start, after.length - same) };
}

function countDigits(text: string): number {
  return text.replace(/\D/g, '').length;
}

/**
 * Applies an edit made to the right-filled figure to the digit buffer. The
 * figure's digits are the buffer's digits aligned to the right (plus pad
 * zeros), so a position is counted from the right. An edit that reaches into
 * the pad zeros (`0.19`, caret before the 0) pads the buffer first, which is
 * what reading every digit of the figure as cents always did.
 */
function spliceDigits(digits: string, figure: string, edit: Edit): string {
  const right = countDigits(figure.slice(edit.end));
  const removed = countDigits(figure.slice(edit.start, edit.end));
  const width = right + removed;
  const padded = digits.length < width ? digits.padStart(width, '0') : digits;
  const at = padded.length - width;
  return padded.slice(0, at) + edit.inserted + padded.slice(at + removed);
}

function candidateFor(before: string, after: string, edit: Edit): string {
  // Past a separator the field shows the typed text itself.
  if (!DIGITS_ONLY.test(buffer)) return after;
  // Digits and deletions on the right-filled figure: the arithmetic as before.
  if (!/\D/.test(edit.inserted)) return spliceDigits(buffer, before, edit);
  // A separator or pasted text arriving on a stored value nobody has touched
  // edits the figure as it reads. `19.00` plus `.` is `19.00.`, refused,
  // rather than the digits `1900` plus `.`, which would be CHF 1900.
  if (pristine && buffer !== '') return after;
  // Otherwise the typed digits are the francs: `0.19` after typing 1, 9,
  // then `.`, is `19.`.
  return spliceDigits(buffer, before, edit);
}

function refuse(el: HTMLInputElement, before: string, edit: Edit) {
  el.value = before;
  const [from, to] = edit.inserted === '' ? [edit.end, edit.end] : [edit.start, edit.end];
  try {
    el.setSelectionRange(from, to);
  } catch {
    /* not every input type supports a selection */
  }
}

function onBeforeInput(e: Event) {
  const el = e.target as HTMLInputElement;
  pendingSelection = el.selectionStart === null || el.selectionEnd === null
    ? null
    : [el.selectionStart, el.selectionEnd];
}

function onInput(e: Event) {
  const el = e.target as HTMLInputElement;
  const before = display.value;
  const after = el.value;
  const edit = readEdit(before, after, pendingSelection);
  pendingSelection = null;

  let candidate = candidateFor(before, after, edit);
  // Pasted text: surrounding whitespace and a currency prefix are not part of
  // the amount. A single typed space stays, it may be a thousands group.
  if (edit.inserted.length > 1) candidate = candidate.trim();
  candidate = stripCurrencyPrefix(candidate);
  if (DIGITS_ONLY.test(candidate)) candidate = candidate.replace(/^0+(?=\d)/, '');

  // Paste and drop. The on-screen keyboard sends no inputType, so its keys,
  // `00` included, are keystrokes.
  const pasted = ((e as Partial<InputEvent>).inputType ?? '').startsWith('insertFrom');
  const draft = readMoneyDraft(candidate);
  if (
    !draft.accepted
    || (draft.cents !== null && draft.cents > props.max)
    // A keystroke may leave `1'` standing on the way to `1'900`; a paste is
    // finished text and must be an amount (`12 50` and a bare `.` are not).
    || (pasted && (draft.cents === null || !/\d/.test(candidate)))
  ) {
    // Keep the last accepted text. A paste that cannot be read says so; a
    // refused keystroke (a third decimal, a letter) simply does not land.
    refuse(el, before, edit);
    if (pasted) refused.value = true;
    return;
  }

  buffer = candidate;
  pristine = false;
  refused.value = false;

  let cents = draft.cents;
  if (cents !== null && cents < props.min) {
    cents = props.min;
    // Right-filled digits snap to the floor, as they always did.
    if (DIGITS_ONLY.test(buffer)) buffer = bufferFor(cents);
  }

  display.value = DIGITS_ONLY.test(buffer) ? figureFor(cents ?? 0) : buffer;
  // Rewriting the value puts the caret at the end, which is where right-fill
  // wants it. Text that already reads right is left alone, caret included.
  if (el.value !== display.value) el.value = display.value;

  if (cents !== null) {
    committed = cents;
    emit('update:modelValue', cents);
  }
}

function onFocus(e: FocusEvent) {
  settle();
  (e.target as HTMLInputElement).select();
}

function onBlur() {
  pendingSelection = null;
  settle();
}

if (props.autofocus) {
  // Defer to next tick so the input is mounted.
  setTimeout(() => inputRef.value?.focus(), 0);
}

defineExpose({ focus: () => inputRef.value?.focus() });
</script>

<template>
  <div class="w-full min-w-0">
    <label
      v-if="label"
      class="block font-medium text-sd-text-muted"
      :class="sizeClasses[size].label"
    >
      {{ label }}
      <span
        v-if="required"
        class="text-sd-error"
      >*</span>
    </label>

    <div :class="wrapperClasses">
      <span
        class="pl-3 text-sd-text-muted font-medium shrink-0 select-none"
        :class="sizeClasses[size].affix"
      >
        {{ currency }}
      </span>

      <input
        ref="inputRef"
        type="text"
        inputmode="decimal"
        :value="display"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :aria-invalid="invalid || undefined"
        class="w-full h-full bg-transparent outline-none text-sd-text text-right tabular-nums"
        :class="[sizeClasses[size].input, 'pl-2 pr-3']"
        @beforeinput="onBeforeInput"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown.enter="settle"
      >
    </div>

    <p
      v-if="error"
      class="mt-1 text-xs text-sd-error font-medium"
    >
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      class="mt-1 text-xs text-sd-text-muted"
    >
      {{ hint }}
    </p>
  </div>
</template>
