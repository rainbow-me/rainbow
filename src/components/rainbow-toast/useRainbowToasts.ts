import { RainbowToast } from '@/components/rainbow-toast/types';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export type ToastState = {
  toasts: (RainbowToast & { removed?: boolean })[];
  showToast: (toast: RainbowToast) => void;
  startRemoveToast: (id: string) => void;
  removeToast: (id: string) => void;
};

const useToastStore = createRainbowStore<ToastState>(set => ({
  toasts: [],

  showToast: toast => {
    set(state => {
      const nonRemovedToasts = state.toasts.filter(t => !t.removed);
      return { toasts: [...state.toasts, { ...toast, index: nonRemovedToasts.length }] };
    });
  },

  startRemoveToast: id => {
    set(state => ({
      toasts: state.toasts.map(toast => (toast.id === id ? { ...toast, removed: true } : toast)),
    }));
  },

  removeToast: id => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    }));
  },
}));

export const useRainbowToasts = () => useToastStore(state => state.toasts);

export const { showToast, startRemoveToast, removeToast } = useToastStore.getState();
