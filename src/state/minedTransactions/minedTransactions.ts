import { MinedTransaction } from '@/entities';
import { createRainbowStore } from '../internal/createRainbowStore';

interface MinedTransactionsState {
  minedTransactions: Record<string, MinedTransaction[]>;
  addMinedTransactions: (params: { address: string; transactions: MinedTransaction[] }) => void;
  clearMinedTransactions: (address: string) => void;
}

export const useMinedTransactionsStore = createRainbowStore<MinedTransactionsState>((set, get) => ({
  minedTransactions: {},

  addMinedTransactions: ({ address, transactions }) => {
    const current = get().minedTransactions[address] || [];
    const existingHashes = new Set(current.map(tx => tx.hash));
    const newTransactions = transactions.filter(tx => !existingHashes.has(tx.hash));

    if (newTransactions.length > 0) {
      set(state => ({
        minedTransactions: {
          ...state.minedTransactions,
          [address]: [...current, ...newTransactions],
        },
      }));
    }
  },

  clearMinedTransactions: (address: string) => {
    set(state => ({
      minedTransactions: {
        ...state.minedTransactions,
        [address]: [],
      },
    }));
  },
}));
