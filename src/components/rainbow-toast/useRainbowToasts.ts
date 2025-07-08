import { getToastFromTransaction } from '@/components/rainbow-toast/getToastFromTransaction';
import type { RainbowToastWithIndex } from '@/components/rainbow-toast/types';
import { RainbowTransaction } from '@/entities';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export type ToastState = {
  toasts: RainbowToastWithIndex[];
  handleTransactions: (tx: RainbowTransaction[]) => void;
  startRemoveToast: (id: string) => void;
  removeToast: (id: string) => void;
  dismissedToasts: Record<string, boolean>;
  showExpanded: boolean;
  setShowExpanded: (show: boolean) => void;
};

export const useToastStore = createRainbowStore<ToastState>(set => ({
  toasts: [],
  dismissedToasts: {},
  showExpanded: false,
  setShowExpanded: (show: boolean) => set({ showExpanded: show }),

  handleTransactions: txs => {
    set(state => {
      const activeToastIds = new Set(state.toasts.map(t => t.id));
      const transactionToasts = txs.map(tx => getToastFromTransaction(tx)).filter(Boolean);
      const transactionToastsMap = new Map(transactionToasts.map(t => [t.id, t]));

      // handle updates:
      const updatedToasts = state.toasts.map(toast => {
        const newToast = transactionToastsMap.get(toast.id);
        if (newToast) {
          return { ...toast, ...newToast };
        }
        return toast;
      });

      // additions:
      const additions = transactionToasts.filter(t => !activeToastIds.has(t.id));

      // todo removals but have to be careful as could be swiping one away

      const toasts = [...additions, ...updatedToasts].map((t, index) => ({ ...t, index }));

      return {
        toasts,
      };
    });
  },

  startRemoveToast: id => {
    console.log('startRemoveToast', id);
    set(state => {
      return {
        dismissedToasts: { ...state.dismissedToasts, [id]: true },
        toasts: state.toasts.map((toast, index) => (toast.id === id ? { ...toast, removing: true } : { ...toast, index: index - 1 })),
      };
    });
  },

  removeToast: id => {
    console.log('removing toast', id);
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id).map((t, index) => ({ ...t, index })),
    }));
  },
}));

export const { handleTransactions, startRemoveToast, removeToast, setShowExpanded } = useToastStore.getState();
