import { getToastFromTransaction } from '@/components/rainbow-toast/getToastFromTransaction';
import type { RainbowToastWithIndex } from '@/components/rainbow-toast/types';
import { RainbowTransaction, TransactionStatus } from '@/entities';
import { Mints } from '@/resources/mints';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export type ToastState = {
  isShowingTransactionDetails: boolean;
  setIsShowingTransactionDetails: (val: boolean) => void;
  toasts: RainbowToastWithIndex[];
  handleTransactions: (props: { transactions: RainbowTransaction[]; mints?: Mints }) => void;
  startRemoveToast: (id: string, via: 'swipe' | 'finish') => void;
  finishRemoveToast: (id: string) => void;
  dismissedToasts: Set<string>;
  showExpanded: boolean;
  setShowExpandedToasts: (show: boolean) => void;
};

export const useToastStore = createRainbowStore<ToastState>(
  set => ({
    toasts: [],
    // we're tracking dismissed toasts here so even if transactions update while we're removing
    // we don't re-add them back into the toast stack
    dismissedToasts: new Set<string>(),
    showExpanded: false,
    isShowingTransactionDetails: false,

    setIsShowingTransactionDetails: isShowingTransactionDetails => {
      set({
        isShowingTransactionDetails,
      });
    },

    setShowExpandedToasts: (show: boolean) => set({ showExpanded: show }),

    handleTransactions: ({ transactions, mints }) => {
      set(state => {
        const activeToastIds = new Set(state.toasts.map(t => t.id));
        const transactionToasts = transactions.map(tx => getToastFromTransaction(tx, mints)).filter(Boolean);
        const transactionToastsMap = new Map(transactionToasts.map(t => [t.id, t]));
        const newDismissedToasts = new Set<string>();

        // updates:
        const updatedToasts = state.toasts.map(toast => {
          const existing = transactionToastsMap.get(toast.id);
          if (existing) {
            return { ...toast, ...existing };
          }
          return toast;
        });

        // additions:
        const additions = transactionToasts.filter(
          t =>
            !activeToastIds.has(t.id) &&
            !state.dismissedToasts.has(t.id) &&
            // all transactions start as pending, we only add if we start from pending
            t.status === TransactionStatus.pending
        );

        const toasts = [...additions, ...updatedToasts]
          .map((t, index) => ({ ...t, index }))
          .map(toast => {
            // removals:
            if (
              !transactionToastsMap.has(toast.id) &&
              // already being handled / or by swipe
              !toast.isRemoving
            ) {
              newDismissedToasts.add(toast.id);
              return { ...toast, isRemoving: true };
            }

            return toast;
          });

        let dismissedToasts = state.dismissedToasts;

        if (newDismissedToasts.size > 0) {
          // ensure we don't accumulate too many, keep only the recent 20
          const oldDismissedToasts = [...state.dismissedToasts].slice(-20);
          dismissedToasts = new Set([...oldDismissedToasts, ...newDismissedToasts]);
        }

        return {
          toasts,
          dismissedToasts,
        };
      });
    },

    // split into starting to remove and then fully removing so we can animate out
    startRemoveToast: (id, via) => {
      set(state => {
        const toasts: RainbowToastWithIndex[] = [];

        let currentIndex = 0;
        for (const toast of state.toasts) {
          if (toast.id === id) {
            toasts.push({ ...toast, isRemoving: true, removalReason: via });
          } else {
            toasts.push({ ...toast, index: currentIndex });
            currentIndex += 1;
          }
        }

        return {
          dismissedToasts: new Set([...state.dismissedToasts, id]),
          toasts,
        };
      });
    },

    finishRemoveToast: id => {
      set(state => ({
        toasts: state.toasts.filter(t => t.id !== id).map((t, index) => ({ ...t, index })),
      }));
    },
  }),
  {
    storageKey: `rainbow-toasts`,
  }
);

export const { handleTransactions, startRemoveToast, finishRemoveToast, setShowExpandedToasts, setIsShowingTransactionDetails } =
  useToastStore.getState();
