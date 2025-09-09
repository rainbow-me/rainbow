import { RainbowTransaction, NewTransaction } from '@/entities/transactions';
import { convertNewTransactionToRainbowTransaction } from '@/parsers/transactions';
import { ChainId } from '@/state/backendNetworks/types';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { nonceActions } from '@/state/nonces';
import { useRainbowToastsStore } from '@/components/rainbow-toast/useRainbowToastsStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
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
        const existingPendingTransactions = state.pendingTransactions[address];
        const updatedPendingTransactions = existingPendingTransactions
          ? [
              ...existingPendingTransactions.filter(tx => {
                if (tx.chainId === pendingTransaction.chainId) {
                  return tx.nonce !== pendingTransaction.nonce;
                }
                return true;
              }),
              pendingTransaction,
            ]
          : [pendingTransaction];

        return {
          pendingTransactions: {
            ...state.pendingTransactions,
            [address]: updatedPendingTransactions,
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
      const pendingTransactionsForAddress = get().pendingTransactions[address] || EMPTY_TRANSACTIONS;
      const mostRecentToOldest = [...pendingTransactionsForAddress].sort((a, b) => (b.nonce ?? 0) - (a.nonce ?? 0));
      return mostRecentToOldest;
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

  { storageKey: 'pendingTransactions' }
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
