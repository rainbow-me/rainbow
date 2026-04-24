import { useRainbowToastsStore } from '@/components/rainbow-toast/useRainbowToastsStore';
import { type NewTransaction, type RainbowTransaction } from '@/entities/transactions';
import { convertNewTransactionToRainbowTransaction } from '@/parsers/transactions';
import { type ChainId } from '@/state/backendNetworks/types';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { nonceActions } from '@/state/nonces';
import { shallowEqual } from '@/worklets/comparisons';

export type PendingTransactionsState = {
  pendingTransactions: Partial<Record<string, RainbowTransaction[]>>;
  addPendingTransaction: ({ address, pendingTransaction }: { address: string; pendingTransaction: RainbowTransaction }) => void;
  clearPendingTransactions: () => void;
  getPendingTransactionsInReverseOrder: (address: string) => RainbowTransaction[];
  setPendingTransactions: ({ address, pendingTransactions }: { address: string; pendingTransactions: RainbowTransaction[] }) => void;
};

const EMPTY_PENDING_TRANSACTIONS: Record<string, RainbowTransaction[]> = {};
const EMPTY_TRANSACTIONS: RainbowTransaction[] = [];

export const usePendingTransactionsStore = createRainbowStore<PendingTransactionsState>(
  (set, get) => ({
    pendingTransactions: EMPTY_PENDING_TRANSACTIONS,

    addPendingTransaction: ({ address, pendingTransaction }) => {
      set(state => {
        const existingTransactions = state.pendingTransactions[address] || [];
        const existingIndex = findPendingTransactionIndex(existingTransactions, pendingTransaction);

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

      useRainbowToastsStore.getState().handleTransaction(pendingTransaction);
    },

    clearPendingTransactions: () =>
      set({
        pendingTransactions: EMPTY_PENDING_TRANSACTIONS,
      }),

    getPendingTransactionsInReverseOrder: address => {
      const pendingTransactionsForAddress = get().pendingTransactions[address];
      if (!pendingTransactionsForAddress) return EMPTY_TRANSACTIONS;
      return [...pendingTransactionsForAddress].reverse();
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

export const addNewTransaction = ({
  address,
  chainId,
  transaction,
}: {
  address: string;
  chainId: ChainId;
  transaction: NewTransaction;
}) => {
  const parsedTransaction = convertNewTransactionToRainbowTransaction(transaction);
  pendingTransactionsActions.addPendingTransaction({ address, pendingTransaction: parsedTransaction });

  if (transaction.relayExecutionId) return;

  const localNonceData = nonceActions.getNonce({ address, chainId });
  const localNonce = localNonceData?.currentNonce || -1;
  if (transaction.nonce > localNonce) {
    nonceActions.setNonce({
      address,
      chainId,
      currentNonce: transaction.nonce,
    });
  }
};

export const updateTransaction = ({
  address,
  chainId,
  transaction,
}: {
  address: string;
  chainId: ChainId;
  transaction: NewTransaction;
}) => {
  addNewTransaction({
    address,
    chainId,
    transaction,
  });
};

function findPendingTransactionIndex(transactions: RainbowTransaction[], nextTransaction: RainbowTransaction): number {
  if (nextTransaction.relayExecutionId) {
    return transactions.findIndex(
      transaction => transaction.chainId === nextTransaction.chainId && transaction.relayExecutionId === nextTransaction.relayExecutionId
    );
  }

  return transactions.findIndex(
    transaction => transaction.chainId === nextTransaction.chainId && transaction.nonce === nextTransaction.nonce
  );
}
