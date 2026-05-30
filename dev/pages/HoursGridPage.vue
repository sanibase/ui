<script setup lang="ts">
import { ref } from 'vue';
import { SdHoursGrid } from '@sanibase/ui';
import type { DaySchedule } from '@sanibase/ui';

function makeWeek(overrides?: Partial<Record<string, { enabled: boolean; periods: { open: string; close: string }[] }>>): DaySchedule[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => {
    const o = overrides?.[day];
    return {
      day,
      enabled: o?.enabled ?? (day !== 'Sun'),
      periods: o?.periods ?? [{ open: '09:00', close: '18:00' }],
    };
  });
}

const restaurant = ref<DaySchedule[]>(makeWeek({
  Mon: { enabled: true, periods: [{ open: '11:00', close: '14:00' }, { open: '17:00', close: '22:00' }] },
  Tue: { enabled: true, periods: [{ open: '11:00', close: '14:00' }, { open: '17:00', close: '22:00' }] },
  Wed: { enabled: true, periods: [{ open: '11:00', close: '14:00' }, { open: '17:00', close: '22:00' }] },
  Thu: { enabled: true, periods: [{ open: '11:00', close: '14:00' }, { open: '17:00', close: '23:00' }] },
  Fri: { enabled: true, periods: [{ open: '11:00', close: '23:00' }] },
  Sat: { enabled: true, periods: [{ open: '10:00', close: '23:00' }] },
  Sun: { enabled: false, periods: [] },
}));

const staff = ref<DaySchedule[]>(makeWeek({
  Mon: { enabled: true, periods: [{ open: '08:00', close: '12:00' }, { open: '13:00', close: '17:00' }] },
  Tue: { enabled: true, periods: [{ open: '08:00', close: '12:00' }, { open: '13:00', close: '17:00' }] },
  Wed: { enabled: false, periods: [] },
  Thu: { enabled: true, periods: [{ open: '08:00', close: '17:00' }] },
  Fri: { enabled: true, periods: [{ open: '08:00', close: '14:00' }] },
  Sat: { enabled: false, periods: [] },
  Sun: { enabled: false, periods: [] },
}));

const simple = ref<DaySchedule[]>(makeWeek());

const smHours = ref<DaySchedule[]>(makeWeek());
const mdHours = ref<DaySchedule[]>(makeWeek({
  Mon: { enabled: true, periods: [{ open: '08:00', close: '12:00' }, { open: '13:00', close: '18:00' }] },
}));
const touchHours = ref<DaySchedule[]>(makeWeek({
  Mon: { enabled: true, periods: [{ open: '08:00', close: '12:00' }, { open: '13:00', close: '18:00' }] },
}));

const disabledHours = ref<DaySchedule[]>(makeWeek());
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdHoursGrid</h1>
    <p class="text-sd-text-secondary text-sm mb-8">7-day schedule editor with toggle and time ranges per day. Supports multiple periods (e.g., lunch break split).</p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Restaurant Hours (split lunch/dinner)</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-lg">
        <SdHoursGrid v-model="restaurant" label="Opening hours" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Staff Availability (with lunch break)</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-lg">
        <SdHoursGrid v-model="staff" label="Working hours" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Simple (single period per day)</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-md">
        <SdHoursGrid v-model="simple" label="Business hours" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Sizes</h2>
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="bg-white rounded-sd-md border border-sd-border p-5">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">sm</h3>
          <SdHoursGrid v-model="smHours" size="sm" />
        </div>
        <div class="bg-white rounded-sd-md border border-sd-border p-5">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">md (default)</h3>
          <SdHoursGrid v-model="mdHours" size="md" />
        </div>
        <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-4">touch</h3>
          <SdHoursGrid v-model="touchHours" size="touch" />
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Disabled</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 max-w-md">
        <SdHoursGrid v-model="disabledHours" label="Cannot edit" disabled />
      </div>
    </section>
  </div>
</template>
