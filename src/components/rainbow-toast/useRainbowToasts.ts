import { RainbowToast, RainbowToastWithIndex } from '@/components/rainbow-toast/types';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export type ToastState = {
  toasts: RainbowToastWithIndex[];
  showToast: <T extends RainbowToast>(toast: T) => void;
  updateToast: <T extends RainbowToast>(update: T) => void;
  startRemoveToast: (id: string) => void;
  removeToast: (id: string) => void;
};

const useToastStore = createRainbowStore<ToastState>(set => ({
  toasts: [],

  showToast: toast => {
    set(state => {
      const newToasts = [{ ...toast, index: 0 } as RainbowToastWithIndex, ...state.toasts].map((t, index) => ({
        ...t,
        index,
      }));
      return {
        toasts: newToasts,
      };
    });
  },

  updateToast: update => {
    set(state => ({
      toasts: state.toasts.map(toast => (toast.id === update.id ? { ...toast, ...update } : toast)),
    }));
  },

  startRemoveToast: id => {
    set(state => ({
      toasts: state.toasts.map(toast => (toast.id === id ? { ...toast, removing: true } : toast)),
    }));
  },

  removeToast: id => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id).map((t, index) => ({ ...t, index })),
    }));
  },
}));

export const useRainbowToasts = () => useToastStore(state => state.toasts.slice(0, 3)); // Show max 3 toasts

export const { showToast, updateToast, startRemoveToast, removeToast } = useToastStore.getState();
