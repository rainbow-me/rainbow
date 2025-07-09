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
      const nonRemovedToasts = state.toasts.filter(t => !t.removed);
      return { toasts: [...state.toasts, { ...toast, index: nonRemovedToasts.length }] };
    });
  },

  updateToast: update => {
    set(state => ({
      toasts: state.toasts.map(toast => (toast.id === id ? { ...toast, ...update } : toast)),
    }));
  },

  startRemoveToast: id => {
    console.log('start');
    set(state => {
      const updatedToasts = state.toasts.map(toast => (toast.id === id ? { ...toast, removed: true } : toast));

      // Recalculate indices for non-removed toasts
      const reindexedToasts = updatedToasts.map((toast, originalIndex) => {
        if (toast.removed) return toast;
        const newIndex = updatedToasts.slice(0, originalIndex).filter(t => !t.removed).length;
        return { ...toast, index: newIndex };
      });

      return { toasts: reindexedToasts };
    });
  },

  removeToast: id => {
    set(state => ({
      toasts: state.toasts
        .filter(t => t.id !== id)
        .map((toast, index) => {
          const nonRemovedIndex = state.toasts.filter(t => !t.removed && t.id !== id).findIndex(t => t.id === toast.id);
          return {
            ...toast,
            index: nonRemovedIndex === -1 ? index : nonRemovedIndex,
          };
        }),
    }));
  },
}));

export const useRainbowToasts = () => useToastStore(state => state.toasts);

export const { showToast, updateToast, startRemoveToast, removeToast } = useToastStore.getState();
