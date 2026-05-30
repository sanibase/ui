<script setup lang="ts">
import { ref } from 'vue';
import { SdDateNav, SdCalendarEvent, SdCalendarDayGrid, SdCalendarWeekGrid, SdCalendarMonth } from '@sanibase/ui';
import type { CalendarViewMode, EventStatus, CalendarResource, CalendarEvent } from '@sanibase/ui';

const currentDate = ref(new Date());
const viewMode = ref<CalendarViewMode>('day');

const currentDateTouch = ref(new Date());
const viewModeTouch = ref<CalendarViewMode>('week');

const statuses: { status: EventStatus; title: string; subtitle: string; time: string }[] = [
  { status: 'confirmed', title: 'Haircut - Maria S.', subtitle: 'Stylist: Anna', time: '09:00 - 09:45' },
  { status: 'pending', title: 'Table 5 - Walk-in', subtitle: '4 guests', time: '12:00 - 13:30' },
  { status: 'tentative', title: 'Yoga Class', subtitle: 'Studio B - maybe', time: '14:00 - 15:00' },
  { status: 'cancelled', title: 'Massage - Peter K.', subtitle: 'Cancelled by client', time: '16:00 - 17:00' },
];

const customColors = [
  { title: 'Team Meeting', time: '10:00 - 11:00', color: '#3b82f6' },
  { title: 'Client Call', time: '13:00 - 13:30', color: '#8B5A9F' },
  { title: 'Lunch Break', time: '12:00 - 13:00', color: '#f97316' },
];

// ── Day Grid data ──

const dayGridDate = ref(new Date());
const dayGridViewMode = ref<CalendarViewMode>('day');

const salonStaff: CalendarResource[] = [
  { id: 'anna', label: 'Anna M.', subtitle: 'Senior Stylist' },
  { id: 'luca', label: 'Luca B.', subtitle: 'Junior Stylist' },
  { id: 'nina', label: 'Nina K.', subtitle: 'Colorist' },
];

function todayAt(h: number, m: number): Date {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

const salonEvents: CalendarEvent[] = [
  { id: '1', resourceId: 'anna', start: todayAt(9, 0), end: todayAt(10, 0), title: 'Haircut - Maria S.', subtitle: 'Wash + Cut + Style', status: 'confirmed' },
  { id: '2', resourceId: 'anna', start: todayAt(10, 30), end: todayAt(11, 30), title: 'Color - Julia W.', subtitle: 'Full highlights', status: 'confirmed' },
  { id: '3', resourceId: 'anna', start: todayAt(14, 0), end: todayAt(15, 0), title: 'Trim - Thomas R.', status: 'pending' },
  { id: '4', resourceId: 'luca', start: todayAt(9, 0), end: todayAt(9, 30), title: 'Beard Trim - Marco D.', status: 'confirmed' },
  { id: '5', resourceId: 'luca', start: todayAt(11, 0), end: todayAt(12, 30), title: 'Wedding Style - Sara L.', subtitle: 'Trial run', status: 'tentative' },
  { id: '6', resourceId: 'luca', start: todayAt(15, 0), end: todayAt(16, 0), title: 'Kids Cut - Emil', status: 'cancelled' },
  { id: '7', resourceId: 'nina', start: todayAt(8, 0), end: todayAt(10, 0), title: 'Balayage - Lea F.', subtitle: 'Blonde tones', status: 'confirmed' },
  { id: '8', resourceId: 'nina', start: todayAt(10, 30), end: todayAt(11, 0), title: 'Toner Refresh', status: 'confirmed' },
  { id: '9', resourceId: 'nina', start: todayAt(13, 0), end: todayAt(14, 30), title: 'Full Color - Petra M.', subtitle: 'Root touch-up + gloss', status: 'pending' },
];

const restaurantTables: CalendarResource[] = [
  { id: 't1', label: 'Table 1', subtitle: '2 seats' },
  { id: 't2', label: 'Table 2', subtitle: '4 seats' },
  { id: 't3', label: 'Table 3', subtitle: '6 seats' },
  { id: 't4', label: 'Table 4', subtitle: '4 seats' },
  { id: 't5', label: 'Table 5', subtitle: '8 seats' },
];

const restaurantEvents: CalendarEvent[] = [
  { id: 'r1', resourceId: 't1', start: todayAt(12, 0), end: todayAt(13, 30), title: 'Meier, 2 Pers.', status: 'confirmed' },
  { id: 'r2', resourceId: 't2', start: todayAt(12, 0), end: todayAt(13, 0), title: 'Walk-in', subtitle: '3 guests', status: 'confirmed' },
  { id: 'r3', resourceId: 't3', start: todayAt(12, 30), end: todayAt(14, 0), title: 'Schmidt Party', subtitle: '5 guests', status: 'pending' },
  { id: 'r4', resourceId: 't5', start: todayAt(19, 0), end: todayAt(21, 0), title: 'Birthday - Keller', subtitle: '8 guests, cake', status: 'confirmed' },
  { id: 'r5', resourceId: 't1', start: todayAt(18, 30), end: todayAt(20, 0), title: 'Weber, 2 Pers.', status: 'tentative' },
  { id: 'r6', resourceId: 't4', start: todayAt(19, 30), end: todayAt(21, 0), title: 'Cancelled - Huber', status: 'cancelled' },
];

const lastSlotClick = ref('');
function onSlotClick(payload: { resourceId: string; start: Date; end: Date }) {
  const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  lastSlotClick.value = `${payload.resourceId} @ ${fmt(payload.start)} - ${fmt(payload.end)}`;
}

const lastEventClick = ref('');
function onEventClick(event: CalendarEvent) {
  lastEventClick.value = `${event.title} (${event.status})`;
}

// ── Week Grid data ──

const weekDate = ref(new Date());
const weekViewMode = ref<CalendarViewMode>('week');

function weekDay(dayOffset: number, h: number, m: number): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff + dayOffset);
  monday.setHours(h, m, 0, 0);
  return monday;
}

const weekEvents: CalendarEvent[] = [
  // Monday
  { id: 'w1', resourceId: '', start: weekDay(0, 9, 0), end: weekDay(0, 10, 0), title: 'Team Standup', status: 'confirmed' },
  { id: 'w2', resourceId: '', start: weekDay(0, 14, 0), end: weekDay(0, 15, 30), title: 'Client Review', subtitle: 'Zoom call', status: 'confirmed' },
  // Tuesday
  { id: 'w3', resourceId: '', start: weekDay(1, 9, 0), end: weekDay(1, 9, 45), title: 'Haircut - Maria S.', subtitle: 'Stylist: Anna', status: 'confirmed' },
  { id: 'w4', resourceId: '', start: weekDay(1, 12, 0), end: weekDay(1, 13, 30), title: 'Lunch Meeting', status: 'pending' },
  { id: 'w5', resourceId: '', start: weekDay(1, 16, 0), end: weekDay(1, 17, 0), title: 'Yoga Class', subtitle: 'Studio B', status: 'tentative' },
  // Wednesday
  { id: 'w6', resourceId: '', start: weekDay(2, 8, 0), end: weekDay(2, 10, 0), title: 'Balayage - Lea F.', subtitle: 'Blonde tones', status: 'confirmed' },
  { id: 'w7', resourceId: '', start: weekDay(2, 11, 0), end: weekDay(2, 12, 0), title: 'Walk-in', subtitle: '2 guests', status: 'confirmed' },
  // Thursday
  { id: 'w8', resourceId: '', start: weekDay(3, 10, 0), end: weekDay(3, 11, 0), title: 'Color - Julia W.', subtitle: 'Full highlights', status: 'confirmed' },
  { id: 'w9', resourceId: '', start: weekDay(3, 15, 0), end: weekDay(3, 16, 0), title: 'Cancelled - Peter K.', status: 'cancelled' },
  // Friday
  { id: 'w10', resourceId: '', start: weekDay(4, 9, 0), end: weekDay(4, 10, 30), title: 'Wedding Style', subtitle: 'Bride trial', status: 'confirmed' },
  { id: 'w11', resourceId: '', start: weekDay(4, 13, 0), end: weekDay(4, 14, 0), title: 'Team Lunch', status: 'confirmed' },
  { id: 'w12', resourceId: '', start: weekDay(4, 16, 0), end: weekDay(4, 17, 0), title: 'Wrap-up', status: 'confirmed' },
  // Saturday
  { id: 'w13', resourceId: '', start: weekDay(5, 10, 0), end: weekDay(5, 12, 0), title: 'Birthday Prep', subtitle: 'Keller party', status: 'pending' },
  // Sunday - empty
];

// ── Month Grid data ──

const monthDate = ref(new Date());
const monthViewMode = ref<CalendarViewMode>('month');

function monthDay(day: number, h: number, m: number): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), day, h, m, 0, 0);
}

const monthEvents: CalendarEvent[] = [
  { id: 'm1', resourceId: '', start: monthDay(1, 9, 0), end: monthDay(1, 10, 0), title: 'Team Standup', status: 'confirmed' },
  { id: 'm2', resourceId: '', start: monthDay(2, 14, 0), end: monthDay(2, 15, 0), title: 'Client Call', status: 'confirmed' },
  { id: 'm3', resourceId: '', start: monthDay(3, 10, 0), end: monthDay(3, 11, 0), title: 'Haircut - Maria', status: 'confirmed' },
  { id: 'm4', resourceId: '', start: monthDay(5, 9, 0), end: monthDay(5, 10, 0), title: 'Color - Julia', subtitle: 'Highlights', status: 'confirmed' },
  { id: 'm5', resourceId: '', start: monthDay(7, 12, 0), end: monthDay(7, 13, 0), title: 'Lunch Meeting', status: 'pending' },
  { id: 'm6', resourceId: '', start: monthDay(7, 16, 0), end: monthDay(7, 17, 0), title: 'Yoga Class', status: 'tentative' },
  { id: 'm7', resourceId: '', start: monthDay(8, 9, 0), end: monthDay(8, 10, 30), title: 'Wedding Style', status: 'confirmed' },
  { id: 'm8', resourceId: '', start: monthDay(10, 11, 0), end: monthDay(10, 12, 0), title: 'Inventory Check', status: 'confirmed' },
  { id: 'm9', resourceId: '', start: monthDay(12, 10, 0), end: monthDay(12, 12, 0), title: 'Birthday - Keller', subtitle: '8 guests', status: 'pending' },
  { id: 'm10', resourceId: '', start: monthDay(14, 9, 0), end: monthDay(14, 10, 0), title: 'Balayage - Lea', status: 'confirmed' },
  { id: 'm11', resourceId: '', start: monthDay(14, 14, 0), end: monthDay(14, 15, 0), title: 'Staff Meeting', status: 'confirmed' },
  { id: 'm12', resourceId: '', start: monthDay(15, 10, 0), end: monthDay(15, 11, 0), title: 'Walk-in', status: 'confirmed' },
  { id: 'm13', resourceId: '', start: monthDay(15, 15, 0), end: monthDay(15, 16, 0), title: 'Cancelled - Peter', status: 'cancelled' },
  { id: 'm14', resourceId: '', start: monthDay(18, 9, 0), end: monthDay(18, 10, 0), title: 'Trim - Thomas', status: 'confirmed' },
  { id: 'm15', resourceId: '', start: monthDay(20, 10, 0), end: monthDay(20, 11, 0), title: 'Color Refresh', status: 'confirmed' },
  { id: 'm16', resourceId: '', start: monthDay(20, 14, 0), end: monthDay(20, 15, 0), title: 'Supplier Visit', status: 'pending' },
  { id: 'm17', resourceId: '', start: monthDay(20, 16, 0), end: monthDay(20, 17, 0), title: 'Deep Clean', status: 'confirmed' },
  { id: 'm18', resourceId: '', start: monthDay(20, 17, 30), end: monthDay(20, 18, 30), title: 'Team Drinks', status: 'tentative' },
  { id: 'm19', resourceId: '', start: monthDay(22, 9, 0), end: monthDay(22, 10, 0), title: 'Kids Cut', status: 'confirmed' },
  { id: 'm20', resourceId: '', start: monthDay(25, 10, 0), end: monthDay(25, 11, 30), title: 'Full Color - Sara', status: 'confirmed' },
  { id: 'm21', resourceId: '', start: monthDay(28, 9, 0), end: monthDay(28, 10, 0), title: 'Beard Trim', status: 'confirmed' },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">Calendar Components</h1>
    <p class="text-sd-text-secondary text-sm mb-8">
      SdDateNav for navigation, SdCalendarEvent for event blocks. Building towards full SdCalendar.
    </p>

    <!-- ── SD DATE NAV ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">SdDateNav</h2>

    <!-- Desktop (md) -->
    <section class="mb-8">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">Desktop (md)</h3>
      <div class="bg-white rounded-sd-md border border-sd-border p-5">
        <SdDateNav v-model="currentDate" v-model:view-mode="viewMode" />
        <p class="text-xs text-sd-text-muted mt-3">
          Mode: {{ viewMode }} | Date: {{ currentDate.toLocaleDateString('de-CH') }}
        </p>
      </div>
    </section>

    <!-- Small (sm) -->
    <section class="mb-8">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">Small (sm)</h3>
      <div class="bg-white rounded-sd-md border border-sd-border p-5">
        <SdDateNav v-model="currentDate" v-model:view-mode="viewMode" size="sm" />
      </div>
    </section>

    <!-- Touch -->
    <section class="mb-8">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">POS Touch</h3>
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
        <SdDateNav v-model="currentDateTouch" v-model:view-mode="viewModeTouch" size="touch" />
      </div>
    </section>

    <!-- Without view toggle -->
    <section class="mb-10">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">Without view toggle</h3>
      <div class="bg-white rounded-sd-md border border-sd-border p-5">
        <SdDateNav v-model="currentDate" :show-view-toggle="false" />
      </div>
    </section>

    <!-- ── SD CALENDAR EVENT ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 mt-12 border-b border-sd-border pb-2">SdCalendarEvent</h2>

    <!-- Status variants -->
    <section class="mb-8">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">Status Variants (vertical orientation)</h3>
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="s in statuses" :key="s.status">
            <p class="text-[11px] font-semibold text-sd-text-muted uppercase tracking-wide mb-2">{{ s.status }}</p>
            <SdCalendarEvent
              :title="s.title"
              :subtitle="s.subtitle"
              :time-label="s.time"
              :status="s.status"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Horizontal orientation -->
    <section class="mb-8">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">Horizontal Orientation (Gantt-style)</h3>
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="s in statuses" :key="s.status" class="h-16">
            <SdCalendarEvent
              :title="s.title"
              :subtitle="s.subtitle"
              :time-label="s.time"
              :status="s.status"
              orientation="horizontal"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Sizes -->
    <section class="mb-8">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">Sizes</h3>
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p class="text-[11px] font-semibold text-sd-text-muted uppercase tracking-wide mb-2">sm</p>
            <SdCalendarEvent
              title="Quick Meeting"
              time-label="09:00 - 09:15"
              status="confirmed"
              size="sm"
            />
          </div>
          <div>
            <p class="text-[11px] font-semibold text-sd-text-muted uppercase tracking-wide mb-2">md (default)</p>
            <SdCalendarEvent
              title="Team Standup"
              subtitle="Room A"
              time-label="09:30 - 10:00"
              status="confirmed"
            />
          </div>
          <div>
            <p class="text-[11px] font-semibold text-sd-text-muted uppercase tracking-wide mb-2">touch</p>
            <SdCalendarEvent
              title="Client Appointment"
              subtitle="VIP Lounge"
              time-label="11:00 - 12:00"
              status="confirmed"
              size="touch"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Custom colors -->
    <section class="mb-8">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">Custom Colors</h3>
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SdCalendarEvent
            v-for="ev in customColors"
            :key="ev.title"
            :title="ev.title"
            :time-label="ev.time"
            :color="ev.color"
          />
        </div>
      </div>
    </section>

    <!-- In-context: day schedule strip -->
    <section class="mb-10">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">In Context -- Day Schedule Strip</h3>
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
        <SdDateNav v-model="currentDate" v-model:view-mode="viewMode" class="mb-5" />
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SdCalendarEvent
            v-for="s in statuses"
            :key="s.status"
            :title="s.title"
            :subtitle="s.subtitle"
            :time-label="s.time"
            :status="s.status"
          />
        </div>
      </div>
    </section>

    <!-- ── SD CALENDAR DAY GRID ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 mt-12 border-b border-sd-border pb-2">SdCalendarDayGrid</h2>

    <!-- Salon day view -->
    <section class="mb-10">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">Salon -- Staff Schedule (md, 15min slots, 08:00-18:00)</h3>
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
        <SdDateNav v-model="dayGridDate" v-model:view-mode="dayGridViewMode" class="mb-4" />
        <div class="h-[600px]">
          <SdCalendarDayGrid
            :date="dayGridDate"
            :resources="salonStaff"
            :events="salonEvents"
            :start-hour="8"
            :end-hour="18"
            @slot-click="onSlotClick"
            @event-click="onEventClick"
          />
        </div>
        <div class="flex gap-6 mt-3 text-xs text-sd-text-muted">
          <span v-if="lastSlotClick">Slot clicked: {{ lastSlotClick }}</span>
          <span v-if="lastEventClick">Event clicked: {{ lastEventClick }}</span>
        </div>
      </div>
    </section>

    <!-- Restaurant reservation view -->
    <section class="mb-10">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">Restaurant -- Table Reservations (md, 15min slots, 11:00-22:00)</h3>
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
        <div class="h-[600px]">
          <SdCalendarDayGrid
            :date="dayGridDate"
            :resources="restaurantTables"
            :events="restaurantEvents"
            :start-hour="11"
            :end-hour="22"
            @slot-click="onSlotClick"
            @event-click="onEventClick"
          />
        </div>
      </div>
    </section>

    <!-- Compact (sm) -->
    <section class="mb-10">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">Compact (sm, 15min slots, 08:00-14:00)</h3>
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
        <div class="h-[400px]">
          <SdCalendarDayGrid
            :date="dayGridDate"
            :resources="salonStaff"
            :events="salonEvents"
            :start-hour="8"
            :end-hour="14"
            size="sm"
            @slot-click="onSlotClick"
            @event-click="onEventClick"
          />
        </div>
      </div>
    </section>

    <!-- Touch -->
    <section class="mb-10">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">POS Touch (touch, 15min slots, 08:00-16:00)</h3>
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
        <div class="h-[600px]">
          <SdCalendarDayGrid
            :date="dayGridDate"
            :resources="salonStaff.slice(0, 2)"
            :events="salonEvents"
            :start-hour="8"
            :end-hour="16"
            size="touch"
            @slot-click="onSlotClick"
            @event-click="onEventClick"
          />
        </div>
      </div>
    </section>

    <!-- ── HORIZONTAL ORIENTATION ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 mt-12 border-b border-sd-border pb-2">SdCalendarDayGrid -- Horizontal (Gantt-style)</h2>

    <!-- Salon horizontal -->
    <section class="mb-10">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">Salon -- Staff Schedule (horizontal, md)</h3>
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
        <SdDateNav v-model="dayGridDate" v-model:view-mode="dayGridViewMode" class="mb-4" />
        <SdCalendarDayGrid
          :date="dayGridDate"
          :resources="salonStaff"
          :events="salonEvents"
          :start-hour="8"
          :end-hour="18"
          orientation="horizontal"
          @slot-click="onSlotClick"
          @event-click="onEventClick"
        />
      </div>
    </section>

    <!-- Restaurant horizontal -->
    <section class="mb-10">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">Restaurant -- Table Reservations (horizontal, md)</h3>
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
        <SdCalendarDayGrid
          :date="dayGridDate"
          :resources="restaurantTables"
          :events="restaurantEvents"
          :start-hour="11"
          :end-hour="22"
          orientation="horizontal"
          @slot-click="onSlotClick"
          @event-click="onEventClick"
        />
      </div>
    </section>

    <!-- Touch horizontal -->
    <section class="mb-10">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">POS Touch (horizontal, touch)</h3>
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
        <SdCalendarDayGrid
          :date="dayGridDate"
          :resources="salonStaff.slice(0, 2)"
          :events="salonEvents"
          :start-hour="8"
          :end-hour="16"
          orientation="horizontal"
          size="touch"
          @slot-click="onSlotClick"
          @event-click="onEventClick"
        />
      </div>
    </section>

    <!-- ── SD CALENDAR WEEK GRID ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 mt-12 border-b border-sd-border pb-2">SdCalendarWeekGrid</h2>

    <!-- Desktop (md) -->
    <section class="mb-10">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">Week View (md)</h3>
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
        <SdDateNav v-model="weekDate" v-model:view-mode="weekViewMode" class="mb-4" />
        <div class="h-[420px]">
          <SdCalendarWeekGrid
            :date="weekDate"
            :events="weekEvents"
            @event-click="onEventClick"
          />
        </div>
      </div>
    </section>

    <!-- Compact (sm) -->
    <section class="mb-10">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">Compact (sm)</h3>
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
        <div class="h-[350px]">
          <SdCalendarWeekGrid
            :date="weekDate"
            :events="weekEvents"
            size="sm"
            @event-click="onEventClick"
          />
        </div>
      </div>
    </section>

    <!-- Touch -->
    <section class="mb-10">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">POS Touch</h3>
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
        <div class="h-[480px]">
          <SdCalendarWeekGrid
            :date="weekDate"
            :events="weekEvents"
            size="touch"
            @event-click="onEventClick"
          />
        </div>
      </div>
    </section>

    <!-- ── SD CALENDAR MONTH ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 mt-12 border-b border-sd-border pb-2">SdCalendarMonth</h2>

    <!-- Desktop (md) -->
    <section class="mb-10">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">Month View (md)</h3>
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
        <SdDateNav v-model="monthDate" v-model:view-mode="monthViewMode" class="mb-4" />
        <div class="h-[600px]">
          <SdCalendarMonth
            :date="monthDate"
            :events="monthEvents"
            @event-click="onEventClick"
          />
        </div>
      </div>
    </section>

    <!-- Compact (sm) -->
    <section class="mb-10">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">Compact (sm)</h3>
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
        <div class="h-[400px]">
          <SdCalendarMonth
            :date="monthDate"
            :events="monthEvents"
            size="sm"
            :max-visible="2"
            @event-click="onEventClick"
          />
        </div>
      </div>
    </section>

    <!-- Touch -->
    <section class="mb-10">
      <h3 class="font-heading text-lg font-semibold text-sd-text mb-4">POS Touch</h3>
      <div class="bg-sd-bg-alt rounded-sd-md border border-sd-border p-5">
        <div class="h-[700px]">
          <SdCalendarMonth
            :date="monthDate"
            :events="monthEvents"
            size="touch"
            @event-click="onEventClick"
          />
        </div>
      </div>
    </section>
  </div>
</template>
