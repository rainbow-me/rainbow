import { TOAST_CONFIRMED_HIDE_TIMEOUT_MS, TOAST_PENDING_HIDE_TIMEOUT_MS } from '@/components/rainbow-toast/constants';
import type { RainbowToast } from '@/components/rainbow-toast/types';
import { TransactionStatus, type RainbowTransaction } from '@/entities';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { useMemo } from 'react';

const toToastId = (tx: RainbowTransaction): string => `${tx.nonce ? tx.nonce : tx.hash}-${tx.chainId || tx.asset?.chainId}`;

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

export const useRainbowToastsStore = createRainbowStore<ToastState>((set, get) => ({
  toasts: {},
  // Tracks toasts that are pending removal while the expanded state is opened.
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
      // We're closing the expanded toast drawer, now we can clear completed toasts.
      if (show === false && state.pendingRemoveToastIds.length) {
        const nextState = { ...state };
        for (const pendingId of state.pendingRemoveToastIds) {
          Object.assign(nextState, getToastsStateForStartRemove(state, state.toasts[pendingId], 'finish'));
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

      const id = toToastId(transaction);

      let toast = state.toasts[id];
      if (toast) {
        // if already removing never update
        if (toast.isRemoving) return state;

        toast = {
          ...toast,
          updatedAt: Date.now(),
          transaction,
        };
      } else {
        toast = {
          id: toToastId(transaction),
          updatedAt: Date.now(),
          transaction,
          isRemoving: false,
        };
      }

      // Handle toast dismiss timer.
      if (toast.timeoutId != null) {
        clearTimeout(toast.timeoutId);
      }
      toast.timeoutId = setTimeout(
        () => {
          get().startRemoveToast(id, 'finish');
        },
        toast.transaction.status === TransactionStatus.pending ? TOAST_PENDING_HIDE_TIMEOUT_MS : TOAST_CONFIRMED_HIDE_TIMEOUT_MS
      );

      toasts[toast.id] = toast;

      return { toasts };
    });
  },

  // split into starting to remove and then fully removing so we can animate out
  startRemoveToast: (id, via) => {
    set(state => {
      const toast = state.toasts[id];
      if (toast?.timeoutId != null) {
        clearTimeout(toast.timeoutId);
      }
      // if we want to clear a completes toast while expanded, wait until expanded sheet closes
      if (via === 'finish' && state.showExpanded) {
        return {
          pendingRemoveToastIds: [...state.pendingRemoveToastIds, id],
        };
      }

      return getToastsStateForStartRemove(state, toast, via);
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

function getToastsStateForStartRemove(state: ToastState, toast: RainbowToast | undefined, via: 'swipe' | 'finish') {
  const toasts = { ...state.toasts };

  if (toast) {
    toasts[toast.id] = { ...toast, isRemoving: true, removalReason: via };
  }

  return { toasts };
}

export function useRainbowToasts() {
  const toasts = useRainbowToastsStore(state => state.toasts);
  return useMemo(() => {
    return Object.values(toasts).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [toasts]);
}
