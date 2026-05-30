import { ref, type Ref } from 'vue';
import type { ToastVariant } from '../components/SdToast.vue';

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

let nextId = 0;

const toasts: Ref<ToastItem[]> = ref([]);

export function useToast() {
  function add(message: string, variant: ToastVariant = 'success', duration = 3000) {
    const id = nextId++;
    toasts.value.push({ id, message, variant, duration });
  }

  function remove(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return {
    toasts,
    add,
    remove,
    success: (msg: string) => add(msg, 'success'),
    error: (msg: string) => add(msg, 'error'),
    warning: (msg: string) => add(msg, 'warning'),
    info: (msg: string) => add(msg, 'info'),
  };
}
