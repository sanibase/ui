import { computed, type ComputedRef, type Ref } from 'vue';

// Local business-type union. @sanibase is presentational-only and carries no
// domain dependency; this mirrors a product's business-type concept by shape
// only. If you add a vertical, keep this union in sync with the consuming app.
export type BusinessType = 'restaurant' | 'bar' | 'cafe' | 'retail' | 'salon' | 'gym' | 'generic';

const FOOD_VERTICALS: ReadonlySet<BusinessType> = new Set(['restaurant', 'bar', 'cafe']);

export type CatalogItemKind = 'dish' | 'product' | 'service';

export interface BusinessTypeHints {
  isFoodVertical: ComputedRef<boolean>;
  /** Which item kinds the catalog form should offer for this vertical. */
  availableItemTypes: ComputedRef<CatalogItemKind[]>;
  /** Tax category keys (consumer translates via i18n: t(`catalog.taxCategory.${key}`)). */
  taxCategoryKeys: ComputedRef<string[]>;
  /** Pre-suggested tags fed into SdTagInput's `suggestions` prop. */
  tagSuggestions: ComputedRef<string[]>;
  /** i18n key for the tag input placeholder, e.g. "businessHints.tagPlaceholder.restaurant". */
  tagPlaceholderKey: ComputedRef<string>;
  /** Default weight unit, or null if weight isn't relevant. */
  defaultWeightUnit: ComputedRef<string | null>;
  /** Whether to show alcohol/tobacco toggles. */
  showAlcoholTobacco: ComputedRef<boolean>;
  /** Whether food-specific fields (prep_time, calories, kitchen_notes, station) apply. */
  showFoodFields: ComputedRef<boolean>;
  /** Whether physical-good fields (sku, barcode, weight) apply. */
  showProductFields: ComputedRef<boolean>;
}

export function useBusinessTypeHints(
  businessType: Ref<BusinessType | null | undefined> | ComputedRef<BusinessType | null | undefined>,
): BusinessTypeHints {
  const bt = computed<BusinessType>(() => businessType.value ?? 'generic');

  const isFoodVertical = computed(() => FOOD_VERTICALS.has(bt.value));

  const availableItemTypes = computed<CatalogItemKind[]>(() => {
    if (FOOD_VERTICALS.has(bt.value)) return ['dish', 'product', 'service'];
    if (bt.value === 'retail') return ['product', 'service'];
    if (bt.value === 'salon') return ['service', 'product'];
    if (bt.value === 'gym') return ['service', 'product'];
    return ['dish', 'product', 'service'];
  });

  const taxCategoryKeys = computed<string[]>(() => {
    const base = ['standard', 'reduced', 'exempt'];
    if (FOOD_VERTICALS.has(bt.value)) {
      return ['food', ...base, 'lodging'];
    }
    if (bt.value === 'generic') {
      return [...base, 'lodging', 'food'];
    }
    return base;
  });

  const tagSuggestions = computed<string[]>(() => {
    if (FOOD_VERTICALS.has(bt.value)) {
      return ['vegan', 'vegetarian', 'gluten-free', 'spicy', 'house-favorite', 'seasonal', 'new'];
    }
    if (bt.value === 'salon') return ['popular', 'new', 'express', 'premium', 'bridal'];
    if (bt.value === 'retail') return ['new-arrival', 'sale', 'limited', 'eco', 'bestseller'];
    if (bt.value === 'gym') return ['beginner', 'advanced', 'group', 'personal', 'cardio', 'strength'];
    return [];
  });

  const tagPlaceholderKey = computed(() => `businessHints.tagPlaceholder.${bt.value}`);

  const defaultWeightUnit = computed<string | null>(() => {
    if (FOOD_VERTICALS.has(bt.value)) return 'g';
    if (bt.value === 'retail') return 'kg';
    if (bt.value === 'generic') return 'kg';
    return null;
  });

  const showAlcoholTobacco = computed(() => FOOD_VERTICALS.has(bt.value));
  const showFoodFields = computed(() => FOOD_VERTICALS.has(bt.value));
  const showProductFields = computed(() => bt.value !== 'salon' && bt.value !== 'gym');

  return {
    isFoodVertical,
    availableItemTypes,
    taxCategoryKeys,
    tagSuggestions,
    tagPlaceholderKey,
    defaultWeightUnit,
    showAlcoholTobacco,
    showFoodFields,
    showProductFields,
  };
}
