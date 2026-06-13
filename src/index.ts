/** @sanibase/ui — SaniDesk design system */
export * from './tokens';
export { default as SdButton } from './components/SdButton.vue';
export type { SdButtonProps, ButtonVariant, ButtonSize } from './components/SdButton.vue';
export { default as SdInput } from './components/SdInput.vue';
export type { SdInputProps, InputSize } from './components/SdInput.vue';
export { default as SdPriceInput } from './components/SdPriceInput.vue';
export type { SdPriceInputProps, PriceInputSize } from './components/SdPriceInput.vue';
export { default as SdFreeFormItemModal } from './components/SdFreeFormItemModal.vue';
export type { SdFreeFormItemModalProps, FreeFormPricingMode } from './components/SdFreeFormItemModal.vue';
export { default as SdSelect } from './components/SdSelect.vue';
export type { SdSelectProps, SelectOption, SelectSize, SelectWidth, SelectPlacement } from './components/SdSelect.vue';
export { default as SdTextarea } from './components/SdTextarea.vue';
export type { SdTextareaProps, TextareaSize } from './components/SdTextarea.vue';
export { default as SdCheckbox } from './components/SdCheckbox.vue';
export type { SdCheckboxProps, CheckboxSize } from './components/SdCheckbox.vue';
export { default as SdToggle } from './components/SdToggle.vue';
export type { SdToggleProps, ToggleSize } from './components/SdToggle.vue';
export { default as SdRadio } from './components/SdRadio.vue';
export type { SdRadioProps, RadioOption, RadioSize } from './components/SdRadio.vue';
export { default as SdDatePicker } from './components/SdDatePicker.vue';
export type { SdDatePickerProps, DatePickerSize, DatePickerMode } from './components/SdDatePicker.vue';
export { default as SdBadge } from './components/SdBadge.vue';
export type { SdBadgeProps, BadgeVariant, BadgeSize } from './components/SdBadge.vue';
export { default as SdSpinner } from './components/SdSpinner.vue';
export type { SdSpinnerProps, SpinnerSize } from './components/SdSpinner.vue';
export { default as SdToast } from './components/SdToast.vue';
export type { SdToastProps, ToastVariant } from './components/SdToast.vue';
export { useToast } from './composables/use-toast';
export type { ToastItem } from './composables/use-toast';
export {
  useFormValidation,
  required,
  email,
  phone,
  slug,
  url,
  pattern,
  minLength,
  maxLength,
  minValue,
  maxValue,
  range,
  numeric,
  integer,
  EMAIL_RE,
  PHONE_RE,
  SLUG_RE,
  URL_RE,
} from './composables/use-form-validation';
export type { Validator, UseFormValidation } from './composables/use-form-validation';
export { useBusinessTypeHints } from './composables/use-business-type-hints';
export type { BusinessType, CatalogItemKind, BusinessTypeHints } from './composables/use-business-type-hints';
export { useVirtualKeyboard } from './composables/use-virtual-keyboard';
export { default as SdModal } from './components/SdModal.vue';
export type { SdModalProps, ModalSize } from './components/SdModal.vue';
export { default as SdConfirmDialog } from './components/SdConfirmDialog.vue';
export type { SdConfirmDialogProps, ConfirmDialogVariant } from './components/SdConfirmDialog.vue';
export { default as SdAccordion } from './components/SdAccordion.vue';
export type { SdAccordionProps, AccordionItem, AccordionSize } from './components/SdAccordion.vue';
export { default as SdToggleRow } from './components/SdToggleRow.vue';
export type { SdToggleRowProps, ToggleRowSize } from './components/SdToggleRow.vue';
export { default as SdImageUpload } from './components/SdImageUpload.vue';
export type { SdImageUploadProps, ImageUploadSize } from './components/SdImageUpload.vue';
export { default as SdTagInput } from './components/SdTagInput.vue';
export type { SdTagInputProps, TagInputSize } from './components/SdTagInput.vue';
export { default as SdAppShell } from './components/SdAppShell.vue';
export type { SdAppShellProps } from './components/SdAppShell.vue';
export { default as SdSidebar } from './components/SdSidebar.vue';
export type { SdSidebarProps, SidebarGroup, SidebarItem } from './components/SdSidebar.vue';
export { default as SdEmptyState } from './components/SdEmptyState.vue';
export type { SdEmptyStateProps } from './components/SdEmptyState.vue';
export { default as SdErrorState } from './components/SdErrorState.vue';
export type { SdErrorStateProps } from './components/SdErrorState.vue';
export { default as SdStatCard } from './components/SdStatCard.vue';
export type { SdStatCardProps, StatVariant } from './components/SdStatCard.vue';
export { default as SdDataTable } from './components/SdDataTable.vue';
export type { SdDataTableProps } from './components/SdDataTable.vue';
// SdColumn: re-export PrimeVue Column directly (not a wrapper component).
// PrimeVue DataTable identifies Column children by VNode type reference.
// Wrapping Column in a .vue component breaks this check.
// The SdColumn.vue file is kept for type reference only.
export { default as SdColumn } from 'primevue/column';
export type { SdColumnProps } from './components/SdColumn.vue';
export { default as SdCard } from './components/SdCard.vue';
export type { SdCardProps, CardPadding } from './components/SdCard.vue';
export { default as SdProductCard } from './components/SdProductCard.vue';
export type { SdProductCardProps, ProductCardSize } from './components/SdProductCard.vue';
export { default as SdRowList } from './components/SdRowList.vue';
export type { SdRowListProps, RowListSize } from './components/SdRowList.vue';
export { default as SdListItem } from './components/SdListItem.vue';
export type { SdListItemProps, ListItemSize } from './components/SdListItem.vue';
export { default as SdKeyValueList } from './components/SdKeyValueList.vue';
export type {
  SdKeyValueListProps,
  KeyValueRow,
  KeyValueSize,
  KeyValueTone,
} from './components/SdKeyValueList.vue';
export { default as SdViewToggle } from './components/SdViewToggle.vue';
export type { SdViewToggleProps, ViewMode } from './components/SdViewToggle.vue';
export { default as SdAutoGrid } from './components/SdAutoGrid.vue';
export type { SdAutoGridProps, AutoGridSize } from './components/SdAutoGrid.vue';
export { default as SdScrollPills } from './components/SdScrollPills.vue';
export type { SdScrollPillsProps, PillOption, ScrollPillSize } from './components/SdScrollPills.vue';
export { default as SdFilterBar } from './components/SdFilterBar.vue';
export type { SdFilterBarProps } from './components/SdFilterBar.vue';
export { default as SdBottomSheet } from './components/SdBottomSheet.vue';
export type { SdBottomSheetProps, BottomSheetHeight } from './components/SdBottomSheet.vue';
export { default as SdTabs } from './components/SdTabs.vue';
export type { SdTabsProps, TabItem, TabSize } from './components/SdTabs.vue';
export { default as SdPageHeader } from './components/SdPageHeader.vue';
export type { SdPageHeaderProps } from './components/SdPageHeader.vue';
export { default as SdColumnList } from './components/SdColumnList.vue';
export type { SdColumnListProps, ColumnListSize } from './components/SdColumnList.vue';
export { default as SdDateNav } from './components/SdDateNav.vue';
export type { SdDateNavProps, DateNavSize } from './components/SdDateNav.vue';
export { default as SdCalendarEvent } from './components/SdCalendarEvent.vue';
export type { SdCalendarEventProps, CalendarEventSize } from './components/SdCalendarEvent.vue';
export { default as SdCalendarDayGrid } from './components/SdCalendarDayGrid.vue';
export type { SdCalendarDayGridProps, DayGridSize } from './components/SdCalendarDayGrid.vue';
export { default as SdCalendarWeekGrid } from './components/SdCalendarWeekGrid.vue';
export type { SdCalendarWeekGridProps, WeekGridSize } from './components/SdCalendarWeekGrid.vue';
export { default as SdCalendarMonth } from './components/SdCalendarMonth.vue';
export type { SdCalendarMonthProps, MonthSize } from './components/SdCalendarMonth.vue';
export { default as SdCalendar } from './components/SdCalendar.vue';
export type { SdCalendarProps, CalendarSize } from './components/SdCalendar.vue';
export type {
  CalendarViewMode,
  TimeAxisOrientation,
  EventStatus,
  CalendarEvent,
  CalendarResource,
  TimeSlot,
} from './components/calendar/types';
export { default as SdCheckboxGrid } from './components/SdCheckboxGrid.vue';
export { default as SdPriceVariants } from './components/SdPriceVariants.vue';
export type { SdPriceVariantsProps, PriceVariant, PriceVariantSize } from './components/SdPriceVariants.vue';
export { default as SdHoursGrid } from './components/SdHoursGrid.vue';
export type { SdHoursGridProps, DaySchedule, TimePeriod, HoursGridSize } from './components/SdHoursGrid.vue';
export { default as SdBulkActionBar } from './components/SdBulkActionBar.vue';
export type { SdBulkActionBarProps, BulkAction, BulkActionBarSize } from './components/SdBulkActionBar.vue';
export { default as SdDetailPanel } from './components/SdDetailPanel.vue';
export type { SdDetailPanelProps, DetailPanelSize } from './components/SdDetailPanel.vue';
export { default as SdSplitPanel } from './components/SdSplitPanel.vue';
export type { SdSplitPanelProps, SplitRatio } from './components/SdSplitPanel.vue';
export { default as SdDraggableList } from './components/SdDraggableList.vue';
export type { SdDraggableListProps, DraggableListSize } from './components/SdDraggableList.vue';
export type { SdCheckboxGridProps, CheckboxGridOption, CheckboxGridSize } from './components/SdCheckboxGrid.vue';
export { default as SdBarChart } from './components/SdBarChart.vue';
export { default as SdColorPicker } from './components/SdColorPicker.vue';
export type { SdColorPickerProps, ColorPickerSize } from './components/SdColorPicker.vue';
export { default as SdModuleLocked } from './components/SdModuleLocked.vue';
export type { SdModuleLockedProps, ModuleLockedSize } from './components/SdModuleLocked.vue';
export { default as SdPendingBanner } from './components/SdPendingBanner.vue';
export type { SdPendingBannerProps, BannerAction, PendingBannerVariant, PendingBannerSize } from './components/SdPendingBanner.vue';
export { default as SdPrintOverlay } from './components/SdPrintOverlay.vue';
export type { SdPrintOverlayProps } from './components/SdPrintOverlay.vue';
export type { SdBarChartProps, BarChartItem, BarChartSize } from './components/SdBarChart.vue';
export { default as SdLineChart } from './components/SdLineChart.vue';
export type { SdLineChartProps, LineSeries } from './components/SdLineChart.vue';
export { default as SdSwissMap } from './components/SdSwissMap.vue';
export type { SdSwissMapProps, SwissMapPoint } from './components/SdSwissMap.vue';
export { default as SdGeoMap } from './components/SdGeoMap.vue';
export type { SdGeoMapProps, GeoMapPoint, GeoTopology } from './components/SdGeoMap.vue';
export { default as SdWordmark } from './components/SdWordmark.vue';
export type { SdWordmarkProps } from './components/SdWordmark.vue';
export { default as SdVirtualKeyboard } from './components/SdVirtualKeyboard.vue';
export type { SdVirtualKeyboardProps, VkbdLayout, VkbdLocale } from './components/SdVirtualKeyboard.vue';

// Utilities — pure functions, no component machinery.
export { normalizePhone, formatPhone } from './utils/phone';
