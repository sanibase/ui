import { readonly, ref } from 'vue';

/**
 * Module-level singletons that mirror SdVirtualKeyboard's render state.
 *
 * The keyboard is a single global Teleport — there's only ever one of
 * it on screen — so module refs are fine and avoid a provide/inject
 * round-trip. SdVirtualKeyboard writes via the internal setter; any
 * consumer (e.g. SdModal) reads the readonly view.
 *
 * Why this exists: SdModal needs to shift its position upward when the
 * keyboard is visible so the focused input doesn't end up underneath
 * it. Reading `height` lets the modal compute exact bottom-padding
 * instead of a magic constant.
 */
const _visible = ref(false);
const _height = ref(0);

export function _setVirtualKeyboardState(visible: boolean, height: number): void {
  _visible.value = visible;
  _height.value = height;
}

export function useVirtualKeyboard(): {
  visible: Readonly<typeof _visible>;
  height: Readonly<typeof _height>;
} {
  return {
    visible: readonly(_visible),
    height: readonly(_height),
  };
}
