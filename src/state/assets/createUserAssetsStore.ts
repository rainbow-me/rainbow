import { createQueryStore } from '@storesjs/stores';
import { type Address } from 'viem';

import { type ParsedSearchAsset, type UniqueId } from '@/__swaps__/types/assets';
import { getUniqueId } from '@/entities/assetId';
import { type SupportedCurrencyKey } from '@/features/currency/supportedCurrencies';
import { convertAmountToNativeDisplayWorklet } from '@/features/currency/utils/nativeDisplay';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { memoizeState } from '@/state/internal/utils/memoizeState';
import { type LiveTokensData } from '@/state/liveTokens/types';
import { toUnixTime } from '@/worklets/dates';

import { deserializeUserAssetsState, serializeUserAssetsState, type UserAssetsStateToPersist } from './persistence';
import { type FetchedUserAssetsData, type UserAssetsParams, type UserAssetsState, type UserAssetsStoreType } from './types';
import { userAssetsStoreManager } from './userAssetsStoreManager';
import {
  fetchUserAssets,
  parsedSearchAssetToParsedAddressAsset,
  selectHighestValueAsset,
  setUserAssets,
  updateHiddenAssetsBalance,
} from './utils';

export function createUserAssetsStore(address: Address): UserAssetsStoreType {
  const store = createQueryStore<FetchedUserAssetsData, UserAssetsParams, UserAssetsState, FetchedUserAssetsData, UserAssetsStateToPersist>(
    {
      fetcher: fetchUserAssets,
      setData: ({ data, set }) => {
        if (!data) return;
        set(state => setUserAssets({ state, userAssets: data }));
      },
      onFetched: () => updateHiddenAssetsBalance(store.getState()),
      enabled: address.length > 0,
      keepPreviousData: true,
      params: {
        address,
        currency: $ => $(userAssetsStoreManager).currency,
        testnetMode: $ => $(useConnectedToAnvilStore).connectedToAnvil,
      },
      staleTime: time.minutes(1),
    },

    (set, get) => ({
      address,
      chainBalances: new Map(),
      hiddenAssets: new Set<UniqueId>(),
      userAssets: new Map(),

      getBalanceSortedChainList: memoizeState(get, 'chainBalances', state => Array.from(state.chainBalances.keys())),

      getChainsWithBalance: memoizeState(get, 'chainBalances', state => {
        const chains: ChainId[] = [];
        for (const [chain, balance] of state.chainBalances) if (balance) chains.push(chain);
        return chains;
      }),

      getHighestValueAsset: options => {
        const state = get();
        return selectHighestValueAsset(state.userAssets.values(), state.hiddenAssets, options);
      },

      getNativeAssetForChain: chainId => {
        const nativeAsset = useBackendNetworksStore.getState().getChainsNativeAsset()[chainId];
        if (!nativeAsset) return null;
        return get().userAssets.get(getUniqueId(nativeAsset.address, chainId)) || null;
      },

      getUserAsset: uniqueId => get().userAssets.get(uniqueId) || null,

      getLegacyUserAsset: uniqueId => {
        const asset = get().userAssets.get(uniqueId);
        if (!asset) return null;
        return parsedSearchAssetToParsedAddressAsset(asset);
      },

      getUserAssets: memoizeState(get, 'hiddenAssets', 'userAssets', state => {
        const assets: ParsedSearchAsset[] = [];
        for (const asset of state.userAssets.values()) if (!state.hiddenAssets.has(asset.uniqueId)) assets.push(asset);
        return assets;
      }),

      isHidden: uniqueId => get().hiddenAssets.has(uniqueId),

      isInitialLoad: () => {
        const state = get();
        return !state.userAssets.size && state.getStatus('isInitialLoad');
      },

      getHiddenAssetsIds: memoizeState(get, 'hiddenAssets', state => Array.from(state.hiddenAssets)),

      setHiddenAssets: uniqueIds => {
        set(state => {
          const hiddenAssets = new Set(state.hiddenAssets);
          for (const uniqueId of uniqueIds) {
            if (hiddenAssets.has(uniqueId)) hiddenAssets.delete(uniqueId);
            else hiddenAssets.add(uniqueId);
          }
          return { hiddenAssets };
        });

        updateHiddenAssetsBalance(get());
      },

      updateAssets: (userAssets, chainIdsToUpdate) => {
        set(state => setUserAssets({ state, userAssets, chainIdsToUpdate }));
        updateHiddenAssetsBalance(get());
      },

      mutatePrices: tokens =>
        set(state => {
          mutateAssetPrices(state.userAssets, tokens, userAssetsStoreManager.getState().currency);
          return state;
        }),
    }),

    address.length
      ? {
          deserializer: deserializeUserAssetsState,
          partialize: state =>
            ({
              chainBalances: state.chainBalances,
              hiddenAssets: state.hiddenAssets,
              userAssets: state.userAssets,
            }) satisfies UserAssetsStateToPersist,
          serializer: serializeUserAssetsState,
          storageKey: `userAssets_${address}`,
          version: 2,
        }
      : undefined
  );

  return store;
}

/**
 * Intentionally mutates held assets' fallback prices for subsequent reads.
 *
 * Live displays observe the live tokens store, so these updates need not
 * notify holdings subscribers or replace their asset objects.
 */
function mutateAssetPrices(assets: UserAssetsState['userAssets'], tokens: LiveTokensData, currency: SupportedCurrencyKey): void {
  for (const tokenId in tokens) {
    const token = tokens[tokenId];
    if (!token || token.reliability.status !== 'PRICE_RELIABILITY_STATUS_TRUSTED') continue;

    const asset = assets.get(tokenId);
    if (!asset) continue;

    const price = asset.price;
    const updatedAt = toUnixTime(token.updateTime);
    if (price?.changed_at && price.changed_at > updatedAt) continue;

    const value = Number(token.price);
    if (price) {
      price.value = value;
      price.relative_change_24h = Number(token.change.change24hPct);
      price.changed_at = updatedAt;
    }

    const nativePrice = asset.native.price;
    if (nativePrice) {
      nativePrice.change = token.change.change24hPct;
      nativePrice.amount = value;
      nativePrice.display = convertAmountToNativeDisplayWorklet(token.price, currency);
    }
  }
}
