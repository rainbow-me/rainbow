import { createBaseStore, createStoreActions } from '@storesjs/stores';

import { rainbowToastsActions } from '@/components/rainbow-toast/useRainbowToastsStore';
import { isPendingTransaction, type NewTransaction, type PendingTransaction, type RainbowTransaction } from '@/entities/transactions';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { convertNewTransactionToRainbowTransaction } from '@/parsers/transactions';
import { nonceActions } from '@/state/nonces';
import { shallowEqual } from '@/worklets/comparisons';

export type PendingTransactionsState = {
  pendingTransactions: Partial<Record<string, RainbowTransaction[]>>;
  addPendingTransaction: ({ address, pendingTransaction }: { address: string; pendingTransaction: RainbowTransaction }) => void;
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

/**
 * Create or replace a pending transaction.
 *
 * Handles both wallet transactions and managed relay executions,
 * and skips nonce advancement if a `relayExecutionId` exists in
 * the provided `transaction`.
 */
export function addNewTransaction({
  address,
  chainId,
  transaction,
}: {
  address: string;
  chainId: ChainId;
  transaction: NewTransaction;
}): void {
  const parsedTransaction = convertNewTransactionToRainbowTransaction(transaction);
  pendingTransactionsActions.addPendingTransaction({ address, pendingTransaction: parsedTransaction });

  const requiresNonceHandling = !transaction.relayExecutionId;
  if (!requiresNonceHandling) return;

  const localNonceData = nonceActions.getNonce({ address, chainId });
  const localNonce = localNonceData?.currentNonce || -1;

  if (transaction.nonce > localNonce) {
    nonceActions.setNonce({
      address,
      chainId,
      currentNonce: transaction.nonce,
    });
  }
}

function findTransactionIndex(transactions: RainbowTransaction[], nextTransaction: RainbowTransaction): number {
  if (nextTransaction.relayExecutionId) {
    return transactions.findIndex(
      transaction => transaction.chainId === nextTransaction.chainId && transaction.relayExecutionId === nextTransaction.relayExecutionId
    );
  }

  return transactions.findIndex(
    transaction => transaction.chainId === nextTransaction.chainId && transaction.nonce === nextTransaction.nonce
  );
}
