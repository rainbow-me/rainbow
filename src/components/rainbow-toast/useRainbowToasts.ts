import { RainbowToast } from '@/components/rainbow-toast/types';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export type ToastState = {
  toasts: RainbowToast[];
  showToast: (toast: RainbowToast) => void;
  removeToast: (id: string) => void;
};

const useToastStore = createRainbowStore<ToastState>(set => ({
  toasts: [],

  showToast: toast => {
    set(state => ({ toasts: [...state.toasts, { ...toast, index: state.toasts.length - 1 }] }));
  },

  removeToast: id => {
    set(state => ({
      toasts: state.toasts
        .filter(t => t.id !== id)
        .map((toast, index) => ({
          ...toast,
          index,
        })),
    }));
  },
}));

export const useRainbowToasts = () => useToastStore(state => state.toasts);

export const { showToast, removeToast } = useToastStore.getState();
