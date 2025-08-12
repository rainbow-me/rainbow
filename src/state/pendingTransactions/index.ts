import { RainbowTransaction, NewTransaction } from '@/entities/transactions';
import { createStore } from '../internal/createStore';
import create from 'zustand';
import { convertNewTransactionToRainbowTransaction } from '@/parsers/transactions';
import { nonceStore } from '../nonces';
import { ChainId } from '@/state/backendNetworks/types';

export interface PendingTransactionsState {
  pendingTransactions: Record<string, RainbowTransaction[]>;
  getPendingTransactionsInReverseOrder: (address: string) => RainbowTransaction[];
  addPendingTransaction: ({ address, pendingTransaction }: { address: string; pendingTransaction: RainbowTransaction }) => void;
  setPendingTransactions: ({ address, pendingTransactions }: { address: string; pendingTransactions: RainbowTransaction[] }) => void;
  clearPendingTransactions: () => void;
}

export const pendingTransactionsStore = createStore<PendingTransactionsState>(
  (set, get) => ({
    pendingTransactions: {},
    getPendingTransactionsInReverseOrder: address => {
      const { pendingTransactions } = get();
      const pendingTransactionsForAddress = pendingTransactions[address] || [];
      // returns pending txns for display from most recent to oldest
      const orderedPendingTransactions = [...pendingTransactionsForAddress].sort((a, b) => {
        return (b.nonce || 0) - (a.nonce || 0);
      });
      return orderedPendingTransactions;
    },
    addPendingTransaction: ({ address, pendingTransaction }) => {
      const { pendingTransactions: currentPendingTransactions } = get();
      const addressPendingTransactions = currentPendingTransactions[address] || [];
      const updatedPendingTransactions = [
        ...addressPendingTransactions.filter(tx => {
          if (tx.chainId === pendingTransaction.chainId) {
            return tx.nonce !== pendingTransaction.nonce;
          }
          return true;
        }),
        pendingTransaction,
      ];
      const orderedPendingTransactions = updatedPendingTransactions.sort((a, b) => {
        return (a.nonce || 0) - (b.nonce || 0);
      });
      set({
        pendingTransactions: {
          ...currentPendingTransactions,
          [address]: orderedPendingTransactions,
        },
      });
    },
    setPendingTransactions: ({ address, pendingTransactions }) => {
      const { pendingTransactions: currentPendingTransactions } = get();
      set({
        pendingTransactions: {
          ...currentPendingTransactions,
          [address]: [...pendingTransactions],
        },
      });
    },
    clearPendingTransactions: () => {
      set({ pendingTransactions: {} });
    },
  }),
  {
    persist: {
      name: 'pendingTransactions',
      version: 1,
    },
  }
);

export const usePendingTransactionsStore = create(pendingTransactionsStore);

export const addNewTransaction = ({
  address,
  chainId,
  transaction,
}: {
  address: string;
  chainId: ChainId;
  transaction: NewTransaction;
}) => {
  const { addPendingTransaction } = pendingTransactionsStore.getState();
  const { getNonce, setNonce } = nonceStore.getState();
  const parsedTransaction = convertNewTransactionToRainbowTransaction(transaction);
  addPendingTransaction({ address, pendingTransaction: parsedTransaction });
  const localNonceData = getNonce({ address, chainId });
  const localNonce = localNonceData?.currentNonce || -1;
  if (transaction.nonce > localNonce) {
    setNonce({
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
