import { ref, type Ref } from 'vue';
import type { ToastVariant } from '../components/SdToast.vue';

export interface ToastAction {
  /** Button text, e.g. "Rückgängig". The library carries no i18n. */
  label: string;
  /** Invoked when the button is pressed. The toast closes afterwards. */
  onAction: () => void;
}

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
  /**
   * Optional trailing action. Undo is a global primitive rather than a
   * per-feature one (SaniMail UX §6), so it belongs on the shared toast queue
   * rather than on each caller's own overlay.
   */
  action?: ToastAction;
  /** Hold the countdown while hovered — defaults on when an action exists. */
  pauseOnHover?: boolean;
}

export interface ToastOptions {
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
  pauseOnHover?: boolean;
}

let nextId = 0;

const toasts: Ref<ToastItem[]> = ref([]);

export function useToast() {
  /**
   * `add(message, variant?, duration?)` is the original signature and keeps
   * working verbatim. Passing an options object in the second position
   * unlocks the action button.
   */
  function add(
    message: string,
    variantOrOptions: ToastVariant | ToastOptions = 'success',
    duration = 3000,
  ): number {
    const id = nextId++;
    if (typeof variantOrOptions === 'string') {
      toasts.value.push({ id, message, variant: variantOrOptions, duration });
      return id;
    }
    const o = variantOrOptions;
    toasts.value.push({
      id,
      message,
      variant: o.variant ?? 'success',
      duration: o.duration ?? duration,
      action: o.action,
      // An action the user cannot reach before the toast leaves is not an
      // action, so hovering holds the countdown whenever one is present.
      pauseOnHover: o.pauseOnHover ?? Boolean(o.action),
    });
    return id;
  }

  function remove(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  /** Shorthand for the undo toast: a message plus a single revert action. */
  function undo(message: string, label: string, onUndo: () => void, duration = 8000): number {
    return add(message, { variant: 'info', duration, action: { label, onAction: onUndo } });
  }

  return {
    toasts,
    add,
    remove,
    undo,
    success: (msg: string) => add(msg, 'success'),
    error: (msg: string) => add(msg, 'error'),
    warning: (msg: string) => add(msg, 'warning'),
    info: (msg: string) => add(msg, 'info'),
  };
}
