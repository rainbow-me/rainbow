import { createBaseStore, createStoreActions } from '@storesjs/stores';

import { rainbowToastsActions } from '@/components/rainbow-toast/useRainbowToastsStore';
import { hasConfirmedOnchainHash, isPendingTransaction, type PendingTransaction, type RainbowTransaction } from '@/entities/transactions';
import { shallowEqual } from '@/worklets/comparisons';

export type PendingTransactionsState = {
  pendingTransactions: Partial<Record<string, RainbowTransaction[]>>;
  addPendingTransaction: ({ address, pendingTransaction }: { address: string; pendingTransaction: RainbowTransaction }) => void;
  applyTransactionResolution: ({
    address,
    pendingTransaction,
    resolvedTransaction,
  }: {
    address: string;
    pendingTransaction: PendingTransaction;
    resolvedTransaction: RainbowTransaction;
  }) => void;
  clearPendingTransactions: () => void;
  getPendingTransactions: (address: string) => PendingTransaction[];
  getTransactionsInReverseOrder: (address: string) => RainbowTransaction[];
  setPendingTransactions: ({ address, pendingTransactions }: { address: string; pendingTransactions: RainbowTransaction[] }) => void;
};

const EMPTY_PENDING_TRANSACTIONS_BY_ADDRESS: Record<string, RainbowTransaction[]> = {};
const EMPTY_TRANSACTIONS: RainbowTransaction[] = [];
const EMPTY_PENDING_TRANSACTIONS: PendingTransaction[] = [];

export const usePendingTransactionsStore = createBaseStore<PendingTransactionsState>(
  (set, get) => ({
    pendingTransactions: EMPTY_PENDING_TRANSACTIONS_BY_ADDRESS,

    addPendingTransaction: ({ address, pendingTransaction }) => {
      set(state => {
        const existingTransactions = state.pendingTransactions[address] || [];
        const existingIndex = findTransactionIndex(existingTransactions, pendingTransaction);

        let updatedTransactions: RainbowTransaction[];
        if (existingIndex >= 0) {
          updatedTransactions = [...existingTransactions];
          updatedTransactions[existingIndex] = pendingTransaction;
        } else {
          updatedTransactions = existingTransactions.length ? [...existingTransactions, pendingTransaction] : [pendingTransaction];
        }

        return {
          pendingTransactions: {
            ...state.pendingTransactions,
            [address]: updatedTransactions,
          },
        };
      });

      rainbowToastsActions.handleTransaction(pendingTransaction);
    },

    applyTransactionResolution: ({ address, pendingTransaction, resolvedTransaction }) =>
      set(state => {
        const transactions = state.pendingTransactions[address];
        if (!transactions) return state;

        const index = transactions.indexOf(pendingTransaction);
        if (index === -1 || shallowEqual(transactions[index], resolvedTransaction)) return state;

        const nextTransactions = [...transactions];
        const shouldRetain = isPendingTransaction(resolvedTransaction) || hasConfirmedOnchainHash(resolvedTransaction);

        if (shouldRetain) nextTransactions[index] = resolvedTransaction;
        else nextTransactions.splice(index, 1);

        return {
          pendingTransactions: { ...state.pendingTransactions, [address]: nextTransactions },
        };
      }),

    clearPendingTransactions: () =>
      set({
        pendingTransactions: EMPTY_PENDING_TRANSACTIONS_BY_ADDRESS,
      }),

    getPendingTransactions: address => {
      const transactionsForAddress = get().pendingTransactions[address];
      if (!transactionsForAddress) return EMPTY_PENDING_TRANSACTIONS;

      return transactionsForAddress.filter(isPendingTransaction);
    },

    getTransactionsInReverseOrder: address => {
      const transactionsForAddress = get().pendingTransactions[address];
      if (!transactionsForAddress) return EMPTY_TRANSACTIONS;
      return [...transactionsForAddress].reverse();
    },

    setPendingTransactions: ({ address, pendingTransactions }) =>
      set(state => {
        if (shallowEqual(state.pendingTransactions[address], pendingTransactions)) {
          return state;
        }
        return {
          pendingTransactions: {
            ...state.pendingTransactions,
            [address]: [...pendingTransactions],
          },
        };
      }),
  }),

  { storageKey: 'pendingTransactions', version: 1 }
);

export const pendingTransactionsActions = createStoreActions(usePendingTransactionsStore);

function findTransactionIndex(transactions: RainbowTransaction[], nextTransaction: RainbowTransaction): number {
  if (nextTransaction.relayExecutionId) {
    return transactions.findIndex(
      transaction => transaction.chainId === nextTransaction.chainId && transaction.relayExecutionId === nextTransaction.relayExecutionId
    );
  }

  // no `relayExecutionId` and no `nonce` means an incoming tx (like in add cash flow)
  if (nextTransaction.nonce == null) {
    return transactions.findIndex(
      transaction =>
        transaction.chainId === nextTransaction.chainId &&
        !transaction.relayExecutionId &&
        transaction.nonce == null &&
        transaction.hash === nextTransaction.hash
    );
  }

  return transactions.findIndex(
    transaction => transaction.chainId === nextTransaction.chainId && transaction.nonce === nextTransaction.nonce
  );
}
