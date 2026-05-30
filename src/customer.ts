/**
 * @sanibase/ui/customer — customer-facing PWA subset.
 *
 * Hard-curated re-export of every PrimeVue-free component + composable so
 * customer surfaces (/order/*, /app/*, /q/*, /beleg/*, /r/*) get a lean
 * chunk that excludes the heavy admin components (DataTable, DatePicker,
 * Paginator, Column, HoursGrid).
 *
 * Rules:
 *   - Re-export DIRECTLY from each `.vue` / `.ts` file. Never re-export
 *     via `./index` — that would pull the full barrel and its
 *     `primevue/datatable` / `primevue/datepicker` / `primevue/column`
 *     static imports back into the customer chunk graph.
 *   - Adding an entry here is a deliberate decision. The component must
 *     not transitively import any PrimeVue surface.
 *   - The boundary is enforced at lint time by
 *     `apps/web/eslint.config.js` (customer surfaces can only import
 *     from `@sanibase/ui/customer`, never `@sanibase/ui`).
 *
 * If a new component is needed on a customer surface:
 *   1. Verify it has no `primevue/*` import (direct or transitive).
 *   2. Add the re-export here.
 *   3. Rebuild and grep `dist/customer.js` for `primevue/` — must be 0.
 */

// Tokens (design tokens, no JS runtime cost)
export * from './tokens';

// Form primitives
export { default as SdButton } from './components/SdButton.vue';
export type { SdButtonProps, ButtonVariant, ButtonSize } from './components/SdButton.vue';
export { default as SdInput } from './components/SdInput.vue';
export type { SdInputProps, InputSize } from './components/SdInput.vue';
export { default as SdTextarea } from './components/SdTextarea.vue';
export type { SdTextareaProps, TextareaSize } from './components/SdTextarea.vue';
export { default as SdPriceInput } from './components/SdPriceInput.vue';
export type { SdPriceInputProps, PriceInputSize } from './components/SdPriceInput.vue';
export { default as SdSelect } from './components/SdSelect.vue';
export type { SdSelectProps, SelectOption, SelectSize, SelectWidth, SelectPlacement } from './components/SdSelect.vue';
export { default as SdCheckbox } from './components/SdCheckbox.vue';
export type { SdCheckboxProps, CheckboxSize } from './components/SdCheckbox.vue';
export { default as SdRadio } from './components/SdRadio.vue';
export type { SdRadioProps, RadioOption, RadioSize } from './components/SdRadio.vue';
export { default as SdToggle } from './components/SdToggle.vue';
export type { SdToggleProps, ToggleSize } from './components/SdToggle.vue';
export { default as SdToggleRow } from './components/SdToggleRow.vue';
export type { SdToggleRowProps, ToggleRowSize } from './components/SdToggleRow.vue';

// Feedback / status
export { default as SdToast } from './components/SdToast.vue';
export type { SdToastProps, ToastVariant } from './components/SdToast.vue';
export { default as SdSpinner } from './components/SdSpinner.vue';
export type { SdSpinnerProps, SpinnerSize } from './components/SdSpinner.vue';
export { default as SdBadge } from './components/SdBadge.vue';
export type { SdBadgeProps, BadgeVariant, BadgeSize } from './components/SdBadge.vue';
export { default as SdEmptyState } from './components/SdEmptyState.vue';
export type { SdEmptyStateProps } from './components/SdEmptyState.vue';
export { default as SdErrorState } from './components/SdErrorState.vue';
export type { SdErrorStateProps } from './components/SdErrorState.vue';

// Layout / containers
export { default as SdCard } from './components/SdCard.vue';
export type { SdCardProps, CardPadding } from './components/SdCard.vue';
export { default as SdListItem } from './components/SdListItem.vue';
export type { SdListItemProps, ListItemSize } from './components/SdListItem.vue';
export { default as SdAccordion } from './components/SdAccordion.vue';
export type { SdAccordionProps, AccordionItem, AccordionSize } from './components/SdAccordion.vue';
export { default as SdTabs } from './components/SdTabs.vue';
export type { SdTabsProps, TabItem, TabSize } from './components/SdTabs.vue';
export { default as SdViewToggle } from './components/SdViewToggle.vue';
export type { SdViewToggleProps, ViewMode } from './components/SdViewToggle.vue';
export { default as SdAutoGrid } from './components/SdAutoGrid.vue';
export type { SdAutoGridProps, AutoGridSize } from './components/SdAutoGrid.vue';
export { default as SdScrollPills } from './components/SdScrollPills.vue';
export type { SdScrollPillsProps, PillOption, ScrollPillSize } from './components/SdScrollPills.vue';
export { default as SdBottomSheet } from './components/SdBottomSheet.vue';
export type { SdBottomSheetProps, BottomSheetHeight } from './components/SdBottomSheet.vue';

// Overlays
export { default as SdModal } from './components/SdModal.vue';
export type { SdModalProps, ModalSize } from './components/SdModal.vue';
export { default as SdConfirmDialog } from './components/SdConfirmDialog.vue';
export type { SdConfirmDialogProps, ConfirmDialogVariant } from './components/SdConfirmDialog.vue';

// Media
export { default as SdImageUpload } from './components/SdImageUpload.vue';
export type { SdImageUploadProps, ImageUploadSize } from './components/SdImageUpload.vue';

// Composables
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
