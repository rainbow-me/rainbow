import { MinedTransaction } from '@/entities';
import { createRainbowStore } from '../internal/createRainbowStore';

export interface MinedTransactionWithPolling {
  transaction: MinedTransaction;
  pollingStartedAt: number;
}

interface MinedTransactionsState {
  minedTransactions: Record<string, MinedTransactionWithPolling[]>;
  addMinedTransactions: (params: { address: string; transactions: MinedTransaction[] }) => void;
  clearMinedTransactions: (address: string) => void;
}

const EMPTY_MINED_TRANSACTIONS: MinedTransactionWithPolling[] = [];

export const useMinedTransactionsStore = createRainbowStore<MinedTransactionsState>((set, get) => ({
  minedTransactions: {},

  addMinedTransactions: ({ address, transactions }) => {
    const current = get().minedTransactions[address] || [];
    const existingHashes = new Set(current.map(tx => tx.transaction.hash));
    const now = Date.now();

    const newTransactions = transactions
      .filter(tx => !existingHashes.has(tx.hash))
      .map(tx => {
        const existing = current.find(item => item.transaction.hash === tx.hash);
        return {
          transaction: tx,
          pollingStartedAt: existing?.pollingStartedAt || now,
        };
      });

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
    set(state => {
      if (state.minedTransactions[address] === EMPTY_MINED_TRANSACTIONS) return state;
      return {
        minedTransactions: {
          ...state.minedTransactions,
          [address]: EMPTY_MINED_TRANSACTIONS,
        },
      };
    });
  },
}));
