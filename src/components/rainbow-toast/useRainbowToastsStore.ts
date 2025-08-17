import { getToastFromTransaction, getToastUpdatedAt, txIdToToastId } from '@/components/rainbow-toast/getToastFromTransaction';
import type { RainbowToast } from '@/components/rainbow-toast/types';
import type { RainbowTransaction } from '@/entities';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { useMemo } from 'react';

// dev tool for seeing helpful formatted logs, only really useful for dev as they are large
const DEBUG_INCOMING = process.env.DEBUG_RAINBOW_TOASTS === '1';

export type ToastState = {
  isShowingTransactionDetails: boolean;
  setIsShowingTransactionDetails: (val: boolean) => void;
  toasts: Record<string, RainbowToast>;
  handleTransaction: (transaction: RainbowTransaction) => void;
  startRemoveToast: (id: string, via: 'swipe' | 'finish') => void;
  finishRemoveToast: (id: string) => void;
  removeAllToasts: () => void;
  showExpanded: boolean;
  setShowExpandedToasts: (show: boolean) => void;
  pendingRemoveToastIds: string[];
};

export const useRainbowToastsStore = createRainbowStore<ToastState>(set => ({
  toasts: {},
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

  handleTransaction: transaction => {
    set(state => {
      const toasts = { ...state.toasts };

      // we can have both pending + confirmed in transactions at the same time
      // pending store will have it still in there right after it confirms
      // pendingTransactions order from [oldest => newest] so our loop should update
      const id = txIdToToastId(transaction);

      const existingToast = state.toasts[id];

      if (existingToast) {
        // if already removing never update
        if (existingToast.isRemoving) return state;

        const updatedToast = {
          ...existingToast,
          updatedAt: getToastUpdatedAt(transaction),
          transaction,
        };
        toasts[existingToast.id] = updatedToast;

        if (DEBUG_INCOMING) {
          console.log('updating toast', JSON.stringify(updatedToast, null, 2));
        }
      } else {
        const toast = getToastFromTransaction(transaction);
        if (!toast) return state;

        toasts[toast.id] = toast;

        if (DEBUG_INCOMING) {
          console.log('adding toast', JSON.stringify(toast, null, 2));
        }
      }

      return { toasts };
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
    set(() => {
      return { toasts: {} };
    });
  },
}));

function getToastsStateForStartRemove(state: ToastState, id: string, via: 'swipe' | 'finish') {
  const toasts = { ...state.toasts };

  if (toasts[id]) {
    toasts[id] = { ...toasts[id], isRemoving: true, removalReason: via };
  }

  return { toasts } satisfies Partial<ToastState>;
}

export function useRainbowToasts() {
  const toasts = useRainbowToastsStore(state => state.toasts);
  return useMemo(() => {
    return Object.values(toasts).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [toasts]);
}
