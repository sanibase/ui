<script setup lang="ts">
import { ref, computed } from 'vue';
import { SdCalendar } from '@sanibase/ui';
import type { CalendarViewMode, CalendarEvent, CalendarResource } from '@sanibase/ui';
import {
  PhCalendarBlank,
  PhClipboardText,
  PhUsers,
  PhGear,
  PhScissors,
  PhStorefront,
  PhChartBar,
  PhChatCircle,
} from '@phosphor-icons/vue';

const currentDate = ref(new Date());
const viewMode = ref<CalendarViewMode>('week');

// ── Resources for day view ──

const staff: CalendarResource[] = [
  { id: 'anna', label: 'Anna M.', subtitle: 'Senior Stylist' },
  { id: 'luca', label: 'Luca B.', subtitle: 'Junior Stylist' },
  { id: 'nina', label: 'Nina K.', subtitle: 'Colorist' },
];

// ── Events (spread across the month for all views) ──

function dayAt(dayOffset: number, h: number, m: number): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday of current week
  const target = new Date(d);
  target.setDate(d.getDate() + diff + dayOffset);
  target.setHours(h, m, 0, 0);
  return target;
}

function monthDay(day: number, h: number, m: number): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), day, h, m, 0, 0);
}

// Week events (with resourceId for day view)
const weekEvents: CalendarEvent[] = [
  // Monday
  { id: '1', resourceId: 'anna', start: dayAt(0, 9, 0), end: dayAt(0, 10, 0), title: 'Team Standup', status: 'confirmed' },
  { id: '2', resourceId: 'anna', start: dayAt(0, 10, 30), end: dayAt(0, 11, 30), title: 'Haircut - Maria S.', subtitle: 'Wash + Cut', status: 'confirmed' },
  { id: '3', resourceId: 'anna', start: dayAt(0, 14, 0), end: dayAt(0, 15, 30), title: 'Client Review', subtitle: 'Zoom call', status: 'confirmed' },
  { id: '4', resourceId: 'luca', start: dayAt(0, 9, 0), end: dayAt(0, 9, 30), title: 'Beard Trim', status: 'confirmed' },
  // Tuesday
  { id: '5', resourceId: 'nina', start: dayAt(1, 8, 30), end: dayAt(1, 10, 0), title: 'Balayage - Lea F.', subtitle: 'Blonde tones', status: 'confirmed' },
  { id: '6', resourceId: 'luca', start: dayAt(1, 10, 0), end: dayAt(1, 11, 0), title: 'Walk-in Trim', status: 'confirmed' },
  { id: '7', resourceId: 'anna', start: dayAt(1, 12, 0), end: dayAt(1, 13, 30), title: 'Lunch Meeting', subtitle: 'With supplier', status: 'pending' },
  { id: '8', resourceId: 'luca', start: dayAt(1, 16, 0), end: dayAt(1, 17, 0), title: 'Yoga Class', subtitle: 'Studio B', status: 'tentative' },
  // Wednesday
  { id: '9', resourceId: 'nina', start: dayAt(2, 8, 0), end: dayAt(2, 10, 0), title: 'Color - Julia W.', subtitle: 'Full highlights', status: 'confirmed' },
  { id: '10', resourceId: 'luca', start: dayAt(2, 11, 0), end: dayAt(2, 12, 0), title: 'Beard Trim - Marco', status: 'confirmed' },
  { id: '11', resourceId: 'anna', start: dayAt(2, 14, 0), end: dayAt(2, 15, 0), title: 'Inventory Check', status: 'confirmed' },
  // Thursday
  { id: '12', resourceId: 'anna', start: dayAt(3, 9, 0), end: dayAt(3, 10, 30), title: 'Wedding Style', subtitle: 'Bride trial', status: 'confirmed' },
  { id: '13', resourceId: 'nina', start: dayAt(3, 10, 30), end: dayAt(3, 11, 0), title: 'Toner Refresh', status: 'confirmed' },
  { id: '14', resourceId: 'luca', start: dayAt(3, 15, 0), end: dayAt(3, 16, 0), title: 'Cancelled - Peter', status: 'cancelled' },
  // Friday
  { id: '15', resourceId: 'luca', start: dayAt(4, 9, 0), end: dayAt(4, 10, 0), title: 'Kids Cut - Emil', status: 'confirmed' },
  { id: '16', resourceId: 'nina', start: dayAt(4, 10, 30), end: dayAt(4, 12, 0), title: 'Full Color - Petra', subtitle: 'Root touch-up + gloss', status: 'pending' },
  { id: '17', resourceId: 'anna', start: dayAt(4, 13, 0), end: dayAt(4, 14, 0), title: 'Team Lunch', status: 'confirmed' },
  { id: '18', resourceId: 'anna', start: dayAt(4, 16, 0), end: dayAt(4, 17, 0), title: 'Weekly Wrap-up', status: 'confirmed' },
  // Saturday
  { id: '19', resourceId: 'anna', start: dayAt(5, 10, 0), end: dayAt(5, 12, 0), title: 'Birthday Prep', subtitle: 'Keller party', status: 'pending' },
  { id: '20', resourceId: 'luca', start: dayAt(5, 13, 0), end: dayAt(5, 14, 0), title: 'Walk-in', status: 'confirmed' },
];

// Additional month events (for days not in current week)
const extraMonthEvents: CalendarEvent[] = [
  { id: 'm1', resourceId: '', start: monthDay(1, 9, 0), end: monthDay(1, 10, 0), title: 'Month Kickoff', status: 'confirmed' },
  { id: 'm2', resourceId: '', start: monthDay(3, 14, 0), end: monthDay(3, 15, 0), title: 'Planning Session', status: 'confirmed' },
  { id: 'm3', resourceId: '', start: monthDay(15, 10, 0), end: monthDay(15, 11, 0), title: 'Supplier Visit', status: 'pending' },
  { id: 'm4', resourceId: '', start: monthDay(18, 9, 0), end: monthDay(18, 10, 0), title: 'Staff Training', status: 'confirmed' },
  { id: 'm5', resourceId: '', start: monthDay(22, 14, 0), end: monthDay(22, 15, 0), title: 'Deep Clean', status: 'confirmed' },
  { id: 'm6', resourceId: '', start: monthDay(25, 10, 0), end: monthDay(25, 11, 30), title: 'Color Workshop', status: 'tentative' },
  { id: 'm7', resourceId: '', start: monthDay(28, 9, 0), end: monthDay(28, 10, 0), title: 'Month Review', status: 'confirmed' },
];

const allEvents = computed(() => [...weekEvents, ...extraMonthEvents]);

// ── Nav ──

const navItems = [
  { icon: PhChartBar, label: 'Dashboard' },
  { icon: PhCalendarBlank, label: 'Calendar', active: true },
  { icon: PhClipboardText, label: 'Bookings' },
  { icon: PhUsers, label: 'Customers' },
  { icon: PhScissors, label: 'Services' },
  { icon: PhStorefront, label: 'Shop' },
  { icon: PhChatCircle, label: 'Messages' },
  { icon: PhGear, label: 'Settings' },
];
</script>

<template>
  <div class="fixed inset-0 flex bg-sd-bg-alt" style="top: 56px">
    <!-- ── Sidebar ── -->
    <aside class="w-56 shrink-0 bg-white border-r border-sd-border flex flex-col">
      <div class="p-4 border-b border-sd-border">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style="background: linear-gradient(135deg, #8B5A9F, #6a3d82)">Sd</div>
          <div>
            <div class="text-sm font-bold text-sd-text">Salon Mia</div>
            <div class="text-[10px] text-sd-text-muted">sanidesk.ch/mia</div>
          </div>
        </div>
      </div>
      <nav class="flex-1 py-2 px-2">
        <button
          v-for="item in navItems"
          :key="item.label"
          type="button"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 cursor-pointer"
          :class="item.active
            ? 'bg-sd-purple-subtle text-sd-purple'
            : 'text-sd-text-secondary hover:bg-sd-bg-alt'"
        >
          <component :is="item.icon" :size="20" :weight="item.active ? 'fill' : 'regular'" />
          {{ item.label }}
        </button>
      </nav>
    </aside>

    <!-- ── Main content ── -->
    <main class="flex-1 min-w-0 p-4">
      <SdCalendar
        v-model:date="currentDate"
        v-model:view-mode="viewMode"
        :resources="staff"
        :events="allEvents"
        :start-hour="7"
        :end-hour="21"
        class="h-full"
      />
    </main>
  </div>
</template>
