<script setup lang="ts">
// SdKeyValueList — semantic description list (<dl>) for labelled field pairs.
// Label sits left, value right-aligned with tabular figures (money, counts).
// Per-row tone/strike/emphasis cover voided lines, refunds and totals without
// the consumer re-styling raw rows. Compose with SdBadge in the #value slot for
// payment methods / statuses.

export type KeyValueSize = 'sm' | 'md';
export type KeyValueTone = 'default' | 'muted' | 'negative' | 'positive';

export interface KeyValueRow {
  /** Left-hand label (the <dt>) */
  label: string;
  /** Right-hand value (the <dd>); omit to render via the #value slot */
  value?: string | number;
  /** Stable v-for key; falls back to the label */
  key?: string;
  /** Bolder label + value, e.g. the Total row */
  emphasis?: boolean;
  /** Strike through the value, e.g. a voided line */
  strike?: boolean;
  /** Value colour: negative = error/red (refunds), positive = success/green */
  tone?: KeyValueTone;
  /** Secondary muted line under the value, e.g. "kassiert 12:48 von Beat M." */
  hint?: string;
}

export interface SdKeyValueListProps {
  /** Rows to render */
  items: KeyValueRow[];
  /** Size variant */
  size?: KeyValueSize;
  /** Hairline divider between rows */
  dividers?: boolean;
  /** Min width of the label column */
  labelWidth?: string;
}

withDefaults(defineProps<SdKeyValueListProps>(), {
  size: 'md',
  dividers: false,
  labelWidth: '40%',
});

const sizeClasses: Record<KeyValueSize, { row: string; text: string; hint: string }> = {
  sm: { row: 'py-1', text: 'text-[13px]', hint: 'text-[11px]' },
  md: { row: 'py-1.5', text: 'text-sm', hint: 'text-xs' },
};

const toneClasses: Record<KeyValueTone, string> = {
  default: 'text-sd-text',
  muted: 'text-sd-text-muted',
  negative: 'text-sd-error',
  positive: 'text-sd-success',
};

function rowKey(row: KeyValueRow, index: number): string {
  return row.key ?? `${row.label}-${index}`;
}
</script>

<template>
  <dl class="flex flex-col">
    <div
      v-for="(row, index) in items"
      :key="rowKey(row, index)"
      class="flex items-start justify-between gap-4"
      :class="[
        sizeClasses[size].row,
        dividers && index > 0 ? 'border-t border-sd-border' : '',
      ]"
    >
      <!-- Label -->
      <dt
        class="shrink-0"
        :class="[
          sizeClasses[size].text,
          row.emphasis ? 'font-semibold text-sd-text' : 'text-sd-text-muted',
        ]"
        :style="{ flexBasis: labelWidth }"
      >
        <slot
          name="label"
          :row="row"
          :index="index"
        >
          {{ row.label }}
        </slot>
      </dt>

      <!-- Value -->
      <dd class="min-w-0 flex-1 text-right">
        <div
          class="tabular-nums"
          :class="[
            sizeClasses[size].text,
            row.emphasis ? 'font-semibold' : 'font-medium',
            row.strike ? 'line-through' : '',
            toneClasses[row.tone ?? 'default'],
          ]"
        >
          <slot
            name="value"
            :row="row"
            :index="index"
          >
            {{ row.value }}
          </slot>
        </div>
        <div
          v-if="row.hint"
          class="text-sd-text-muted"
          :class="sizeClasses[size].hint"
        >
          {{ row.hint }}
        </div>
      </dd>
    </div>
  </dl>
</template>
