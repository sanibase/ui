<script setup lang="ts">
import { computed } from 'vue';

export type ButtonVariant =
  | 'primary'
  | 'primary-outline'
  | 'secondary'
  | 'secondary-outline'
  | 'success'
  | 'success-outline'
  | 'warning'
  | 'warning-outline'
  | 'info'
  | 'info-outline'
  | 'danger'
  | 'danger-outline'
  | 'ghost'
  | 'hero-primary'
  | 'hero-secondary';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'touch';

/**
 * What a variant is *made of*, which is the only thing its disabled form needs
 * to know.
 *
 * Disabled removes the colour and keeps the shape. A filled button stays a
 * filled chip, an outline button keeps its outline, and a ghost button stays
 * chrome-free; they just stop being orange, purple or red. Collapsing all
 * fifteen variants to one grey block would be simpler, but it would turn a
 * disabled ghost icon button (a toolbar overflow control, a modal close) from
 * invisible chrome into a grey blob that is *louder* disabled than enabled.
 *
 * Losing the hue is deliberate and not a loss: nobody needs to be told that
 * the button they cannot press would have been destructive.
 *
 * This map is `Record<ButtonVariant, …>`, so adding a variant without deciding
 * how it disables is a type error rather than a washed-out surprise in prod.
 */
type ButtonShape = 'solid' | 'outline' | 'ghost' | 'hero';

export interface SdButtonProps {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
  icon?: boolean;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
}

const props = withDefaults(defineProps<SdButtonProps>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  block: false,
  icon: false,
  type: 'button',
});

const isDisabled = computed(() => props.disabled || props.loading);
const tag = computed(() => (props.href ? 'a' : 'button'));

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-[6px]',
  md: 'h-[38px] px-4 text-sm gap-2 rounded-lg',
  lg: 'h-[46px] px-6 text-[15px] gap-2 rounded-lg',
  touch: 'h-14 px-6 text-base gap-2.5 rounded-xl',
};

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: 'w-8 h-8 rounded-[6px]',
  md: 'w-[38px] h-[38px] rounded-lg',
  lg: 'w-[46px] h-[46px] rounded-lg',
  touch: 'w-14 h-14 rounded-xl',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'text-white font-semibold',
    'bg-sd-orange',
    'hover:bg-sd-orange-dark hover:shadow-sd-orange-sm',
    'active:scale-[0.97]',
  ].join(' '),
  'primary-outline': [
    'text-sd-orange font-semibold',
    'bg-white border border-sd-orange',
    'hover:bg-sd-orange hover:text-white',
    'active:scale-[0.97]',
  ].join(' '),
  secondary: [
    'text-white font-semibold',
    'bg-sd-purple',
    'hover:bg-sd-purple-dark hover:shadow-sd-purple-sm',
    'active:scale-[0.97]',
  ].join(' '),
  'secondary-outline': [
    'text-sd-purple font-semibold',
    'bg-white border border-sd-purple',
    'hover:bg-sd-purple hover:text-white',
    'active:scale-[0.97]',
  ].join(' '),
  success: [
    'text-white font-semibold',
    'bg-sd-success',
    'hover:bg-sd-success-dark',
    'active:scale-[0.97]',
  ].join(' '),
  'success-outline': [
    'text-sd-success font-semibold',
    'bg-white border border-sd-success',
    'hover:bg-sd-success hover:text-white',
    'active:scale-[0.97]',
  ].join(' '),
  warning: [
    'text-white font-semibold',
    'bg-sd-warning',
    'hover:bg-sd-warning-dark',
    'active:scale-[0.97]',
  ].join(' '),
  'warning-outline': [
    'text-sd-warning font-semibold',
    'bg-white border border-sd-warning',
    'hover:bg-sd-warning hover:text-white',
    'active:scale-[0.97]',
  ].join(' '),
  info: [
    'text-white font-semibold',
    'bg-sd-info',
    'hover:bg-sd-info-dark',
    'active:scale-[0.97]',
  ].join(' '),
  'info-outline': [
    'text-sd-info font-semibold',
    'bg-white border border-sd-info',
    'hover:bg-sd-info hover:text-white',
    'active:scale-[0.97]',
  ].join(' '),
  danger: [
    'text-white font-semibold',
    'bg-sd-error',
    'hover:bg-sd-error-dark',
    'active:scale-[0.97]',
  ].join(' '),
  'danger-outline': [
    'text-sd-error font-semibold',
    'bg-white border border-sd-error',
    'hover:bg-sd-error hover:text-white',
    'active:scale-[0.97]',
  ].join(' '),
  ghost: [
    'text-sd-text-secondary font-medium',
    'bg-transparent',
    'hover:bg-sd-bg-surface',
    'active:scale-[0.97]',
  ].join(' '),
  'hero-primary': [
    'text-white font-semibold',
    'sd-btn-hero-primary rounded-full',
    'hover:-translate-y-0.5',
    'active:scale-[0.97]',
  ].join(' '),
  'hero-secondary': [
    'text-white font-semibold',
    'sd-btn-hero-secondary rounded-full',
    'hover:-translate-y-0.5',
    'active:scale-[0.97]',
  ].join(' '),
};

const variantShapes: Record<ButtonVariant, ButtonShape> = {
  primary: 'solid',
  'primary-outline': 'outline',
  secondary: 'solid',
  'secondary-outline': 'outline',
  success: 'solid',
  'success-outline': 'outline',
  warning: 'solid',
  'warning-outline': 'outline',
  info: 'solid',
  'info-outline': 'outline',
  danger: 'solid',
  'danger-outline': 'outline',
  ghost: 'ghost',
  /*
   * The hero pair are filled, but they are also the only variants that carry
   * their own geometry: `rounded-full`, alongside the gradient and the coloured
   * drop shadow, lives on the variant class. Disabling them as plain `solid`
   * would drop the pill radius with the gradient and the button would change
   * *shape* on its way to disabled, not just colour. `hero` is `solid` that
   * remembers it is a pill.
   */
  'hero-primary': 'hero',
  'hero-secondary': 'hero',
};

const disabledShapeClasses: Record<ButtonShape, string> = {
  solid: 'sd-btn-disabled sd-btn-disabled-solid',
  outline: 'sd-btn-disabled sd-btn-disabled-outline',
  ghost: 'sd-btn-disabled sd-btn-disabled-ghost',
  hero: 'sd-btn-disabled sd-btn-disabled-solid sd-btn-disabled-hero',
};

/**
 * The disabled look is swapped **in place of** the variant classes, not layered
 * over them.
 *
 * Appending `bg-sd-disabled-surface` after `bg-sd-orange` would not win: two
 * Tailwind utilities have equal specificity, so the one that lands later in the
 * generated stylesheet wins, and the order of names in a `class` attribute has
 * no say in that at all. Which of the two ships last depends on the consumer's
 * build. Emitting only one of them removes the question.
 *
 * The colours themselves are real CSS in this component's `<style>` block
 * rather than `sd-disabled-*` utilities, for the reason the README gives for
 * `.sd-modal-close`: that block ships inside `dist/ui.css` and therefore
 * applies whether or not the consumer's Tailwind scans this package. And a
 * consumer still carrying a hardcoded `sd` palette has no `sd-disabled-*`
 * scale to compile, so the utility form would emit nothing and the button
 * would come out unstyled.
 */
const disabledClasses = computed(() => disabledShapeClasses[variantShapes[props.variant]]);

/**
 * Only a disabled `<a>` keeps `pointer-events-none`.
 *
 * An anchor has no native disabled state, so a `@click` bound at the call site
 * fires on it no matter how it is painted, and the href is dropped below so it
 * cannot be reached by keyboard either. A `<button>` needs none of that: the
 * native `disabled` attribute is the gate, and it is the *semantic* one, which
 * `pointer-events: none` is not.
 *
 * Dropping it from the button is a small behavioural change and deliberate.
 * `pointer-events: none` makes an element transparent to the pointer, so a
 * click on a disabled button used to pass *through* to whatever sits behind it
 * (a clickable card, a row) and it swallowed any `title` a call site set on the
 * button to explain why it is disabled. A disabled control should absorb the
 * click and be able to say why, not quietly hand it to its parent.
 */
const inertLink = computed(() => Boolean(props.href) && isDisabled.value);

const classes = computed(() => [
  'sd-btn',
  'inline-flex items-center justify-center no-underline whitespace-nowrap',
  'transition-all duration-150 select-none touch-manipulation',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sd-orange/30 focus-visible:ring-offset-2',
  props.icon ? iconSizeClasses[props.size] : sizeClasses[props.size],
  isDisabled.value ? disabledClasses.value : variantClasses[props.variant],
  props.block ? 'w-full' : '',
  isDisabled.value ? '' : 'cursor-pointer',
  inertLink.value ? 'pointer-events-none' : '',
]);
</script>

<template>
  <component
    :is="tag"
    :type="href ? undefined : type"
    :href="inertLink ? undefined : href"
    :disabled="!href && isDisabled ? true : undefined"
    :aria-disabled="inertLink ? 'true' : undefined"
    :class="classes"
  >
    <svg
      v-if="loading"
      class="animate-spin shrink-0"
      :class="size === 'sm' ? 'w-3.5 h-3.5' : size === 'touch' ? 'w-5 h-5' : 'w-4 h-4'"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        class="opacity-25"
      />
      <path
        d="M12 2a10 10 0 019.95 9"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        class="opacity-75"
      />
    </svg>
    <slot name="icon-left" />
    <span
      v-if="label || $slots.default"
      class="inline-flex items-center"
    >
      <slot>{{ label }}</slot>
    </span>
    <slot name="icon-right" />
  </component>
</template>

<style>
/*
 * Disabled.
 *
 * Real CSS rather than utility classes, so the rules ship in `dist/ui.css` and
 * land for every consumer regardless of what its own Tailwind scans or which
 * `sd` scale its config carries. See `disabledClasses` above.
 *
 * The weights match each shape's enabled counterpart (600 filled and outline,
 * 500 ghost) so that enabling a button re-colours it without re-flowing the
 * label. Same reason the outline shape keeps a 1px border: the box must not
 * change size when the form becomes valid.
 */
.sd-btn-disabled {
  color: var(--sd-disabled-text, #5f5f78);
  font-weight: 600;
  /*
   * Intent, not the signal. Blink forces `default` on a disabled form control
   * whatever this says (checked in the gallery: every disabled <button>
   * computes `cursor: default`, while the disabled <a> keeps `not-allowed`).
   * So the state has to be carried by the colour and the shape, which is what
   * the rest of this block does. The declaration stays for the anchor path and
   * for engines that honour it.
   */
  cursor: not-allowed;
  /* No brand shadow, no lift, no press. An inert control does not respond. */
  box-shadow: none;
  transform: none;
}

.sd-btn-disabled-solid {
  background: var(--sd-disabled-surface, #e4e4ec);
  border: none;
}

.sd-btn-disabled-outline {
  background: var(--sd-bg, #ffffff);
  border: 1px solid var(--sd-disabled-border, #c9c9d6);
}

.sd-btn-disabled-ghost {
  background: transparent;
  border: none;
  font-weight: 500;
}

/*
 * The pill radius, restored at two-class specificity.
 *
 * `sizeClasses` always contributes a `rounded-*` utility, and a single-class
 * rule here would tie with it, leaving the winner to whichever stylesheet the
 * consumer happens to load second. `.sd-btn.sd-btn-disabled-hero` is (0,2,0)
 * and settles it in this package, where the decision belongs.
 */
.sd-btn.sd-btn-disabled-hero {
  border-radius: 9999px;
}

.sd-btn-hero-primary {
  background: var(--sd-gradient-brand);
  box-shadow: var(--sd-shadow-orange);
}
.sd-btn-hero-primary:hover {
  box-shadow: var(--sd-shadow-orange-hover);
}
.sd-btn-hero-secondary {
  background: var(--sd-gradient-purple);
  box-shadow: var(--sd-shadow-purple);
}
.sd-btn-hero-secondary:hover {
  box-shadow: var(--sd-shadow-purple-hover);
}
</style>
