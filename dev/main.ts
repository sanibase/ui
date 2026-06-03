import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';
import App from './App.vue';
import './style.css';

const SaniDeskPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f8f4fb',
      100: '#f0e8f5',
      200: '#dcc8e8',
      300: '#c4a3d8',
      400: '#a87dc4',
      500: '#8B5A9F',
      600: '#7a4e8c',
      700: '#6a3d82',
      800: '#4a2668',
      900: '#3a1d52',
      950: '#2a1440',
    },
  },
});

// ── Page imports ──
import IndexPage from './pages/IndexPage.vue';
import TokensPage from './pages/TokensPage.vue';
import AssetsPage from './pages/AssetsPage.vue';
import WordmarkPage from './pages/WordmarkPage.vue';

// Primitives
import ButtonPage from './pages/ButtonPage.vue';
import InputPage from './pages/InputPage.vue';
import SelectPage from './pages/SelectPage.vue';
import TextareaPage from './pages/TextareaPage.vue';
import CheckboxPage from './pages/CheckboxPage.vue';
import TogglePage from './pages/TogglePage.vue';
import RadioPage from './pages/RadioPage.vue';
import DatePickerPage from './pages/DatePickerPage.vue';
import BadgePage from './pages/BadgePage.vue';
import ToastPage from './pages/ToastPage.vue';
import SpinnerPage from './pages/SpinnerPage.vue';

// Layout
import AppShellPage from './pages/AppShellPage.vue';
import PageHeaderPage from './pages/PageHeaderPage.vue';
import FilterBarPage from './pages/FilterBarPage.vue';
import CardPage from './pages/CardPage.vue';
import AutoGridPage from './pages/AutoGridPage.vue';
import SplitPanelPage from './pages/SplitPanelPage.vue';

// Data Display
import StatCardPage from './pages/StatCardPage.vue';
import DataTablePage from './pages/DataTablePage.vue';
import RowListPage from './pages/RowListPage.vue';
import AccordionPage from './pages/AccordionPage.vue';
import DraggableListPage from './pages/DraggableListPage.vue';
import BarChartPage from './pages/BarChartPage.vue';
import LineChartPage from './pages/LineChartPage.vue';
import SwissMapPage from './pages/SwissMapPage.vue';
import GeoMapPage from './pages/GeoMapPage.vue';
import ColorPickerPage from './pages/ColorPickerPage.vue';

// Forms
import ModalPage from './pages/ModalPage.vue';
import ConfirmDialogPage from './pages/ConfirmDialogPage.vue';
import ToggleRowPage from './pages/ToggleRowPage.vue';
import ImageUploadPage from './pages/ImageUploadPage.vue';
import CheckboxGridPage from './pages/CheckboxGridPage.vue';
import PriceVariantsPage from './pages/PriceVariantsPage.vue';
import HoursGridPage from './pages/HoursGridPage.vue';

// Navigation
import TabsPage from './pages/TabsPage.vue';
import ScrollPillsPage from './pages/ScrollPillsPage.vue';
import DateNavPage from './pages/DateNavPage.vue';
import ColumnListPage from './pages/ColumnListPage.vue';
import BottomSheetPage from './pages/BottomSheetPage.vue';

// Feedback
import EmptyStatePage from './pages/EmptyStatePage.vue';
import ModuleLockedPage from './pages/ModuleLockedPage.vue';
import PendingBannerPage from './pages/PendingBannerPage.vue';

// Overlays
import BulkActionBarPage from './pages/BulkActionBarPage.vue';
import DetailPanelPage from './pages/DetailPanelPage.vue';
import PrintOverlayPage from './pages/PrintOverlayPage.vue';

// Data Display (extra)
import ListItemPage from './pages/ListItemPage.vue';

// Calendar
import CalendarPage from './pages/CalendarPage.vue';
import CalendarFullPage from './pages/CalendarFullPage.vue';

// Layouts
import KioskLayoutPage from './pages/KioskLayoutPage.vue';

const router = createRouter({
  history: createWebHistory('/sanidesk/ui/'),
  routes: [
    { path: '/', component: IndexPage },
    { path: '/tokens', component: TokensPage },
    { path: '/assets', component: AssetsPage },
    { path: '/wordmark', component: WordmarkPage },

    // Primitives
    { path: '/button', component: ButtonPage },
    { path: '/input', component: InputPage },
    { path: '/select', component: SelectPage },
    { path: '/textarea', component: TextareaPage },
    { path: '/checkbox', component: CheckboxPage },
    { path: '/toggle', component: TogglePage },
    { path: '/radio', component: RadioPage },
    { path: '/datepicker', component: DatePickerPage },
    { path: '/badge', component: BadgePage },
    { path: '/toast', component: ToastPage },
    { path: '/spinner', component: SpinnerPage },

    // Layout
    { path: '/app-shell', component: AppShellPage },
    { path: '/sidebar', component: AppShellPage },
    { path: '/page-header', component: PageHeaderPage },
    { path: '/filter-bar', component: FilterBarPage },
    { path: '/card', component: CardPage },
    { path: '/auto-grid', component: AutoGridPage },
    { path: '/split-panel', component: SplitPanelPage },

    // Data Display
    { path: '/stat-card', component: StatCardPage },
    { path: '/data-table', component: DataTablePage },
    { path: '/row-list', component: RowListPage },
    { path: '/accordion', component: AccordionPage },
    { path: '/draggable-list', component: DraggableListPage },
    { path: '/bar-chart', component: BarChartPage },
    { path: '/line-chart', component: LineChartPage },
    { path: '/swiss-map', component: SwissMapPage },
    { path: '/geo-map', component: GeoMapPage },
    { path: '/color-picker', component: ColorPickerPage },
    { path: '/list-item', component: ListItemPage },

    // Forms
    { path: '/modal', component: ModalPage },
    { path: '/confirm-dialog', component: ConfirmDialogPage },
    { path: '/toggle-row', component: ToggleRowPage },
    { path: '/image-upload', component: ImageUploadPage },
    { path: '/checkbox-grid', component: CheckboxGridPage },
    { path: '/price-variants', component: PriceVariantsPage },
    { path: '/hours-grid', component: HoursGridPage },

    // Navigation
    { path: '/tabs', component: TabsPage },
    { path: '/scroll-pills', component: ScrollPillsPage },
    { path: '/date-nav', component: DateNavPage },
    { path: '/column-list', component: ColumnListPage },
    { path: '/bottom-sheet', component: BottomSheetPage },

    // Feedback
    { path: '/empty-state', component: EmptyStatePage },
    { path: '/module-locked', component: ModuleLockedPage },
    { path: '/pending-banner', component: PendingBannerPage },

    // Overlays
    { path: '/bulk-action-bar', component: BulkActionBarPage },
    { path: '/detail-panel', component: DetailPanelPage },
    { path: '/print-overlay', component: PrintOverlayPage },

    // Calendar
    { path: '/calendar', component: CalendarPage },
    { path: '/calendar-full', component: CalendarFullPage },

    // Layouts
    { path: '/kiosk-layout', component: KioskLayoutPage },
  ],
});

const app = createApp(App);
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: SaniDeskPreset,
    options: {
      darkModeSelector: false,
      cssLayer: false,
    },
  },
});
app.mount('#app');
