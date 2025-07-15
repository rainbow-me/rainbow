import { getToastFromTransaction } from '@/components/rainbow-toast/getToastFromTransaction';
import type { RainbowToastWithIndex } from '@/components/rainbow-toast/types';
import { RainbowTransaction } from '@/entities';
import { Mints } from '@/resources/mints';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export type ToastState = {
  toasts: RainbowToastWithIndex[];
  handleTransactions: (props: { pendingTransactions: RainbowTransaction[]; mints?: Mints }) => void;
  swipeRemoveToast: (id: string) => void;
  finishRemoveToast: (id: string) => void;
  hiddenToasts: Record<string, boolean>;
  showExpanded: boolean;
  setShowExpandedToasts: (show: boolean) => void;
};

export const useToastStore = createRainbowStore<ToastState>(set => ({
  toasts: [],
  // we're tracking hidden toasts here so even if transactions update while we're removing
  // we don't re-add them back into the toast stack
  hiddenToasts: {},
  showExpanded: false,

  setShowExpandedToasts: (show: boolean) => set({ showExpanded: show }),

  handleTransactions: ({ pendingTransactions, mints }) => {
    set(state => {
      const activeToastIds = new Set(state.toasts.map(t => t.id));
      const transactionToasts = pendingTransactions.map(tx => getToastFromTransaction(tx, mints)).filter(Boolean);
      const transactionToastsMap = new Map(transactionToasts.map(t => [t.id, t]));
      let newlyHiddenToasts: Record<string, boolean> | null = null;

      // handle updates:
      const updatedToasts = state.toasts.map(toast => {
        const newToast = transactionToastsMap.get(toast.id);
        if (newToast) {
          return { ...toast, ...newToast };
        }
        return toast;
      });

      // additions:
      const additions = transactionToasts.filter(t => !activeToastIds.has(t.id) && !state.hiddenToasts[t.id]);

      const toasts = [...additions, ...updatedToasts]
        .map((t, index) => ({ ...t, index }))
        .map(toast => {
          // removals:
          if (
            !transactionToastsMap.has(toast.id) &&
            // already being handled / or by swipe
            !toast.removing
          ) {
            console.warn('starting to remove', toast.id);
            newlyHiddenToasts ||= {};
            newlyHiddenToasts[toast.id] = true;
            return { ...toast, removing: true };
          }

          return toast;
        });

      return {
        toasts,
        // always accumulates, memory shouldn't be a problem
        ...(Boolean(newlyHiddenToasts) && {
          hiddenToasts: { ...state.hiddenToasts, ...newlyHiddenToasts! },
        }),
      };
    });
  },

  // split into starting to remove and then fully removing so we can animate out
  swipeRemoveToast: id => {
    set(state => {
      return {
        hiddenToasts: { ...state.hiddenToasts, [id]: true },
        toasts: state.toasts.map((toast, index) => (toast.id === id ? { ...toast, removing: 'swipe' } : { ...toast, index: index - 1 })),
      };
    });
  },

  finishRemoveToast: id => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id).map((t, index) => ({ ...t, index })),
    }));
  },
}));

export const { handleTransactions, swipeRemoveToast, finishRemoveToast, setShowExpandedToasts } = useToastStore.getState();
