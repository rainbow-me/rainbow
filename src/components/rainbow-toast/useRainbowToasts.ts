import { getToastFromTransaction, getToastUpdatedAt, txIdToToastId } from '@/components/rainbow-toast/getToastFromTransaction';
import type { RainbowToast } from '@/components/rainbow-toast/types';
import { RainbowTransaction, TransactionStatus } from '@/entities';
import { Mints } from '@/resources/mints';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { isEmpty, mapValues } from 'lodash';
import { useMemo } from 'react';

// dev tool for seeing helpful formatted logs, only really useful for dev as they are large
const DEBUG_INCOMING = process.env.DEBUG_RAINBOW_TOASTS === '1';

export type ToastState = {
  isShowingTransactionDetails: boolean;
  setIsShowingTransactionDetails: (val: boolean) => void;
  toasts: Record<string, RainbowToast>;
  handleTransactions: (props: { transactions: RainbowTransaction[]; mints?: Mints }) => void;
  startRemoveToast: (id: string, via: 'swipe' | 'finish') => void;
  finishRemoveToast: (id: string) => void;
  removeAllToasts: () => void;
  dismissedToasts: Record<string, boolean>;
  showExpanded: boolean;
  setShowExpandedToasts: (show: boolean) => void;
  pendingRemoveToastIds: string[];
};

export const useToastStore = createRainbowStore<ToastState>(
  set => ({
    toasts: {},
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
        const toasts: Record<string, RainbowToast> = {};

        // we can have both pending + confirmed in transactions at the same time
        // pending store will have it still in there right after it confirms
        // pendingTransactions order from [oldest => newest] so our loop should update
        for (const tx of transactions) {
          const id = txIdToToastId(tx);
          if (state.dismissedToasts[id]) continue;

          const existingToast = state.toasts[id];

          if (existingToast) {
            // if already removing never update
            if (existingToast.isRemoving) continue;

            // update - in the case of updates we only ever update the transaction, updatedAt, status and subType
            const updatedToast = {
              ...existingToast,
              status: tx.status,
              transaction: tx,
              currentType: tx.type,
              updatedAt: getToastUpdatedAt(tx),
            };
            toasts[existingToast.id] = updatedToast;

            if (DEBUG_INCOMING) {
              console.log('updating toast', JSON.stringify(updatedToast, null, 2));
            }
          } else {
            const toast = getToastFromTransaction({ transaction: tx, mints });
            if (!toast) continue;
            // we only add if it's pending
            if (tx.status === TransactionStatus.pending) {
              toasts[toast.id] = toast;

              if (DEBUG_INCOMING) {
                console.log('adding toast', JSON.stringify(toast, null, 2));
              }
            }
          }
        }

        // garbage collection, we only need to track dismissed for current transactions
        let dismissedToasts = state.dismissedToasts;
        const dismissedIds = Object.keys(dismissedToasts);
        if (dismissedIds.length > 20) {
          dismissedToasts = Object.fromEntries(dismissedIds.filter(id => toasts[id]).map(id => [id, true]));
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
      set(state => {
        const toasts = { ...state.toasts };
        delete toasts[id];
        return { toasts };
      });
    },

    removeAllToasts: () => {
      set(state => {
        if (isEmpty(state.toasts)) return state;

        return {
          toasts: {},
          dismissedToasts: {
            ...state.dismissedToasts,
            ...mapValues(state.toasts, () => true),
          },
        };
      });
    },
  }),
  {
    storageKey: `rainbow-toasts`,
    partialize: state => ({
      // Only persist dismissed toasts.
      dismissedToasts: state.dismissedToasts,
    }),
  }
);

function getToastsStateForStartRemove(state: ToastState, id: string, via: 'swipe' | 'finish') {
  const toasts = { ...state.toasts };

  if (toasts[id]) {
    toasts[id] = { ...toasts[id], isRemoving: true, removalReason: via };
  }

  return {
    toasts,
    dismissedToasts: {
      ...state.dismissedToasts,
      [id]: true,
    },
  } satisfies Partial<ToastState>;
}

export const {
  handleTransactions,
  startRemoveToast,
  finishRemoveToast,
  removeAllToasts,
  setShowExpandedToasts,
  setIsShowingTransactionDetails,
} = useToastStore.getState();

export function useToasts() {
  const toasts = useToastStore(state => state.toasts);
  return useMemo(() => {
    return Object.values(toasts).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [toasts]);
}
