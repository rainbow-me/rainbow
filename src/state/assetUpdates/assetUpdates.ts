import type { Address } from 'viem';

import { type ParsedSearchAsset } from '@/__swaps__/types/assets';
import { type RainbowTransaction } from '@/entities/transactions';
import { convertAmountToRawAmount } from '@/helpers/utilities';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { getUniqueId } from '@/utils/ethereumUtils';

import { createRainbowStore } from '../internal/createRainbowStore';

// ============ Types ========================================================== //

export type AssetUpdateTransaction = Pick<RainbowTransaction, 'asset' | 'chainId' | 'changes' | 'hash' | 'minedAt' | 'type'>;

export type WatchedAssetUpdateTransaction = {
  baselineQuantitiesByAssetId: Readonly<Record<string, string>>;
  transaction: AssetUpdateTransaction;
  pollingStartedAt: number;
};

type AssetUpdatesStore = {
  watchedTransactions: Record<string, WatchedAssetUpdateTransaction[]>;
  addWatchedTransactions: (params: { address: Address; transactions: AssetUpdateTransaction[] }) => void;
  clearWatchedTransactions: (address: Address) => void;
  removeWatchedTransactions: (params: { address: Address; hashes: string[] }) => void;
};

type TrackedAsset = {
  address: string;
  balance?: { amount?: string } | null;
  chainId: number;
  decimals: number;
  uniqueId?: string;
};

// ============ Constants ====================================================== //

const EMPTY_WATCHED_TRANSACTIONS: WatchedAssetUpdateTransaction[] = [];

// ============ Asset Updates Store ============================================ //

export const useAssetUpdatesStore = createRainbowStore<AssetUpdatesStore>(set => ({
  watchedTransactions: {},

  addWatchedTransactions: ({ address, transactions }) => {
    if (!transactions.length) return;

    set(state => {
      const current = state.watchedTransactions[address] || EMPTY_WATCHED_TRANSACTIONS;
      const existingHashes = new Set(current.map(watch => watch.transaction.hash));

      let nextTransactions: WatchedAssetUpdateTransaction[] | undefined;
      let userAssets: Map<string, ParsedSearchAsset>;
      let pollingStartedAt: number;

      for (const transaction of transactions) {
        if (existingHashes.has(transaction.hash)) continue;

        existingHashes.add(transaction.hash);
        nextTransactions ??= [...current];
        userAssets ??= useUserAssetsStore.getState(address).userAssets;
        pollingStartedAt ??= Date.now();

        nextTransactions.push({
          baselineQuantitiesByAssetId: buildBaselineQuantitiesByAssetId(transaction, userAssets),
          transaction,
          pollingStartedAt,
        });
      }

      if (!nextTransactions) return state;

      return {
        watchedTransactions: {
          ...state.watchedTransactions,
          [address]: nextTransactions,
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

  removeWatchedTransactions: ({ address, hashes }) => {
    set(state => {
      const current = state.watchedTransactions[address];
      if (!current?.length || !hashes.length) return state;

      const hashesToRemove = new Set(hashes);
      const nextTransactions = current.filter(watch => !hashesToRemove.has(watch.transaction.hash));
      if (nextTransactions.length === current.length) return state;

      if (nextTransactions.length === 0) {
        const watchedTransactions = { ...state.watchedTransactions };
        delete watchedTransactions[address];
        return { watchedTransactions };
      }

      return {
        watchedTransactions: {
          ...state.watchedTransactions,
          [address]: nextTransactions,
        },
      };
    });
  },
}));

// ============ Utilities ====================================================== //

function buildBaselineQuantitiesByAssetId(transaction: AssetUpdateTransaction, userAssets: Map<string, ParsedSearchAsset>) {
  const baselineQuantitiesByAssetId: Record<string, string> = {};

  if (transaction.changes?.length) {
    for (const change of transaction.changes) {
      if (!change?.asset) continue;
      writeBaselineQuantity(change.asset, baselineQuantitiesByAssetId, userAssets);
    }
    return baselineQuantitiesByAssetId;
  }

  if (transaction.asset) writeBaselineQuantity(transaction.asset, baselineQuantitiesByAssetId, userAssets);

  return baselineQuantitiesByAssetId;
}

function writeBaselineQuantity(
  asset: TrackedAsset,
  baselineQuantitiesByAssetId: Record<string, string>,
  userAssets: Map<string, ParsedSearchAsset>
) {
  const assetId = asset.uniqueId ?? getUniqueId(asset.address, asset.chainId);
  const currentAsset = userAssets.get(assetId);
  const balanceAmount = asset.balance?.amount ?? currentAsset?.balance.amount ?? '0';

  baselineQuantitiesByAssetId[assetId] = convertAmountToRawAmount(balanceAmount, asset.decimals);
}
