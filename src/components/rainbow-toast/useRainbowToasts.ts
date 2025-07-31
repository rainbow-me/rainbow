import { getToastFromTransaction, txIdToToastId } from '@/components/rainbow-toast/getToastFromTransaction';
import type { RainbowToast, RainbowToastWithIndex } from '@/components/rainbow-toast/types';
import { RainbowTransaction, TransactionStatus } from '@/entities';
import { Mints } from '@/resources/mints';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { skaleTitanTestnet } from 'viem/chains';

export type ToastState = {
  isShowingTransactionDetails: boolean;
  setIsShowingTransactionDetails: (val: boolean) => void;
  toasts: RainbowToastWithIndex[];
  handleTransactions: (props: { transactions: RainbowTransaction[]; mints?: Mints }) => void;
  startRemoveToast: (id: string, via: 'swipe' | 'finish') => void;
  finishRemoveToast: (id: string) => void;
  dismissedToasts: Record<string, boolean>;
  showExpanded: boolean;
  setShowExpandedToasts: (show: boolean) => void;
  pendingRemoveToastIds: string[];
};

export const useToastStore = createRainbowStore<ToastState>(
  set => ({
    toasts: [],
    // we're tracking dismissed toasts here so if transactions update while we're removing
    // we don't re-add them back into the toast stack
    dismissedToasts: {},
    // an edge case where you open expanded sheet on a confirmed toast before we hide it
    // we need to keep that toast around until you close expanded toast, then remove it
    // this tracks pending removes when you open expanded and then is used to remove on close
    pendingRemoveToastIds: [],
    showExpanded: false,
    isShowingTransactionDetails: false,

    setIsShowingTransactionDetails: isShowingTransactionDetails => {
      set({
        isShowingTransactionDetails,
      });
    },

    setShowExpandedToasts: (show: boolean) => {
      set(state => {
        // were closing the expanded toast drawer, now we can clear completed toasts
        if (show === false && state.pendingRemoveToastIds.length) {
          const nextState = { ...state };
          for (const pendingId of state.pendingRemoveToastIds) {
            Object.assign(nextState, getToastsStateForStartRemove(state, pendingId, 'finish'));
          }
          return {
            ...nextState,
            showExpanded: false,
          };
        }

        return { showExpanded: show };
      });
    },

    handleTransactions: ({ transactions, mints }) => {
      set(state => {
        const activeToasts = new Map<string, RainbowToast>(state.toasts.map(t => [t.id, t]));
        const allToastIds = new Set<string>();
        const additions: RainbowToast[] = [];

        // we can have both pending + confirmed in transactions at the same time
        // pending store will have it still in there right after it confirms
        // pending will always occur in the array before the confirmed so lets
        // grab the last of each
        for (const tx of transactions) {
          const id = txIdToToastId(tx);
          allToastIds.add(id);
          if (state.dismissedToasts[id]) continue;

          const existingToast = activeToasts.get(id);

          if (existingToast) {
            // if already removing never update
            if (existingToast.isRemoving) continue;

            // update - in the case of updates we only ever update the transaction and status
            // this is because you can have contract-type toasts that change to swap on confirmation
            // but we want to always display them as contract-type, we also want to keep their icon and name
            // the same, but they often don't have icon/name information in the confirmed states we get
            const updatedToast = { ...existingToast, status: tx.status, transaction: tx };
            if (updatedToast.type === 'contract') {
              updatedToast.subType = tx.type;
            }
            activeToasts.set(existingToast.id, updatedToast);
          } else {
            const toast = getToastFromTransaction({ transaction: tx, mints });
            if (!toast) continue;
            // we only add if it's pending or contract_interaction
            if (tx.status === TransactionStatus.pending || tx.status === TransactionStatus.contract_interaction) {
              additions.push(toast);
            }
          }
        }

        // garbage collection, we only need to track dismissed for current transactions
        let dismissedToasts = state.dismissedToasts;
        const dismissedIds = Object.keys(dismissedToasts);
        if (dismissedIds.length > 20) {
          dismissedToasts = Object.fromEntries(dismissedIds.filter(id => allToastIds.has(id)).map(id => [id, true]));
        }

        // always put additions at top, and update index based on current order
        const toasts = [...additions, ...activeToasts.values()].map((toast, index) => ({ ...toast, index }));

        return {
          toasts,
          dismissedToasts,
        };
      });
    },

    // split into starting to remove and then fully removing so we can animate out
    startRemoveToast: (id, via) => {
      set(state => {
        // if we want to clear a completes toast while expanded, wait until expanded sheet closes
        if (via === 'finish' && state.showExpanded) {
          return {
            pendingRemoveToastIds: [...state.pendingRemoveToastIds, id],
          };
        }

        return getToastsStateForStartRemove(state, id, via);
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

function getToastsStateForStartRemove(state: ToastState, id: string, via: 'swipe' | 'finish') {
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
    dismissedToasts: {
      ...state.dismissedToasts,
      [id]: true,
    },
    toasts,
  } satisfies Partial<ToastState>;
}

export const { handleTransactions, startRemoveToast, finishRemoveToast, setShowExpandedToasts, setIsShowingTransactionDetails } =
  useToastStore.getState();
