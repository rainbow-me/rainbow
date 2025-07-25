import { getToastFromTransaction } from '@/components/rainbow-toast/getToastFromTransaction';
import type { RainbowToast, RainbowToastWithIndex } from '@/components/rainbow-toast/types';
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
        const activeToasts = new Map<string, RainbowToast>(state.toasts.map(t => [t.id, t]));
        const nextActiveToastIds = new Set<string>();
        const additions: RainbowToast[] = [];

        // we can have both pending + confirmed in transactions at the same time
        // pending store will have it still in there right after it confirms
        // pending will always be before the confirmed so lets grab the last of each
        for (const tx of transactions) {
          const toast = getToastFromTransaction(tx, mints);
          if (!toast) continue;
          if (state.dismissedToasts.has(toast.id)) continue;

          const currentToast = activeToasts.get(toast.id);
          // if already removing never update
          if (currentToast?.isRemoving) continue;

          if (currentToast) {
            // update
            activeToasts.set(toast.id, { ...currentToast, ...toast });
          } else {
            // we only add if it's pending or contract_interaction
            if (tx.status === TransactionStatus.pending || tx.status === TransactionStatus.contract_interaction) {
              nextActiveToastIds.add(toast.id);
              additions.push(toast);
            }
          }
        }

        // just some garbage collection, we only need to track dismissed for current transactions
        let dismissedToasts = state.dismissedToasts;
        if (dismissedToasts.size > 20) {
          dismissedToasts = new Set([...dismissedToasts].filter(id => nextActiveToastIds.has(id)));
        }

        // we always put additions at top, and update index based on current order
        const toasts = [...additions, ...Object.values(activeToasts)].map((toast, index) => ({ ...toast, index }));

        console.log('update toasts', JSON.stringify({ transactions, toasts }, null, 2));

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
