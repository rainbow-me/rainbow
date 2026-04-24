import { type RainbowTransaction } from '@/entities/transactions';

import { createRainbowStore } from '../internal/createRainbowStore';

export type AssetUpdateTransaction = Pick<RainbowTransaction, 'asset' | 'chainId' | 'changes' | 'hash' | 'type'> & {
  minedAt: number | undefined;
};

export type WatchedAssetUpdateTransaction = {
  transaction: AssetUpdateTransaction;
  pollingStartedAt: number;
};

type AssetUpdatesStore = {
  watchedTransactions: Record<string, WatchedAssetUpdateTransaction[]>;
  addWatchedTransactions: (params: { address: string; transactions: AssetUpdateTransaction[] }) => void;
  clearWatchedTransactions: (address: string) => void;
};

const EMPTY_WATCHED_TRANSACTIONS: WatchedAssetUpdateTransaction[] = [];

export const useAssetUpdatesStore = createRainbowStore<AssetUpdatesStore>(set => ({
  watchedTransactions: {},

  addWatchedTransactions: ({ address, transactions }) => {
    set(state => {
      const current = state.watchedTransactions[address] || EMPTY_WATCHED_TRANSACTIONS;
      const existingHashes = new Set(current.map(tx => tx.transaction.hash));
      const now = Date.now();

      const newTransactions = transactions
        .filter(tx => !existingHashes.has(tx.hash))
        .map(transaction => ({
          transaction,
          pollingStartedAt: now,
        }));

      if (!newTransactions.length) return state;

      return {
        watchedTransactions: {
          ...state.watchedTransactions,
          [address]: [...current, ...newTransactions],
        },
      };
    });
  },

  clearWatchedTransactions: address => {
    set(state => {
      if (!state.watchedTransactions[address]) return state;

      const newTransactions = { ...state.watchedTransactions };
      delete newTransactions[address];

      return { watchedTransactions: newTransactions };
    });
  },
}));
