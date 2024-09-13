import { RainbowTransaction, NewTransaction } from '@/entities/transactions';
import { createStore } from '../internal/createStore';
import create from 'zustand';
import { parseNewTransaction } from '@/parsers/transactions';
import { nonceStore } from '../nonces';
import { ChainId } from '@/chains/types';

export interface PendingTransactionsState {
  pendingTransactions: Record<string, RainbowTransaction[]>;
  addPendingTransaction: ({ address, pendingTransaction }: { address: string; pendingTransaction: RainbowTransaction }) => void;
  updatePendingTransaction: ({ address, pendingTransaction }: { address: string; pendingTransaction: RainbowTransaction }) => void;
  setPendingTransactions: ({ address, pendingTransactions }: { address: string; pendingTransactions: RainbowTransaction[] }) => void;
  clearPendingTransactions: () => void;
}

export const pendingTransactionsStore = createStore<PendingTransactionsState>(
  (set, get) => ({
    pendingTransactions: {},
    addPendingTransaction: ({ address, pendingTransaction }) => {
      const { pendingTransactions: currentPendingTransactions } = get();
      const addressPendingTransactions = currentPendingTransactions[address] || [];
      set({
        pendingTransactions: {
          ...currentPendingTransactions,
          [address]: [...addressPendingTransactions, pendingTransaction],
        },
      });
    },
    updatePendingTransaction: ({ address, pendingTransaction }) => {
      const { pendingTransactions: currentPendingTransactions } = get();
      const addressPendingTransactions = currentPendingTransactions[address] || [];

      set({
        pendingTransactions: {
          ...currentPendingTransactions,
          [address]: [
            ...addressPendingTransactions.filter(tx => {
              if (tx.chainId === pendingTransaction.chainId) {
                return tx.nonce !== pendingTransaction.nonce;
              }
              return true;
            }),
            pendingTransaction,
          ],
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
  const { setNonce } = nonceStore.getState();
  const parsedTransaction = parseNewTransaction(transaction);
  addPendingTransaction({ address, pendingTransaction: parsedTransaction });
  setNonce({
    address,
    chainId,
    currentNonce: transaction.nonce,
  });
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
  const { updatePendingTransaction } = pendingTransactionsStore.getState();
  const { setNonce } = nonceStore.getState();
  const parsedTransaction = parseNewTransaction(transaction);
  updatePendingTransaction({ address, pendingTransaction: parsedTransaction });
  setNonce({
    address,
    chainId,
    currentNonce: transaction.nonce,
  });
};
