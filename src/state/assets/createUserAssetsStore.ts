import { createQueryStore } from '@storesjs/stores';
import { type Address } from 'viem';

import { type UniqueId } from '@/__swaps__/types/assets';
import { getUniqueId } from '@/entities/assetId';
import { convertAmountToNativeDisplayWorklet } from '@/features/currency/utils/nativeDisplay';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { usePositionsStore } from '@/features/positions/stores/positionsStore';
import { time } from '@/framework/core/utils/time';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { type LiveTokensData } from '@/state/liveTokens/types';
import { toUnixTime } from '@/worklets/dates';

import { deserializeUserAssetsState, serializeUserAssetsState, type UserAssetsStateToPersist } from './persistence';
import { type FetchedUserAssetsData, type UserAssetsParams, type UserAssetsState, type UserAssetsStoreType } from './types';
import { userAssetsStoreManager } from './userAssetsStoreManager';
import {
  calculateHiddenAssetsBalance,
  fetchUserAssets,
  indexUserAssets,
  parsedSearchAssetToParsedAddressAsset,
  selectHighestValueAsset,
  setUserAssets,
} from './utils';

/** Creates the account-bound holdings store and its list/balance indexes. */
export const createUserAssetsStore = (address: Address | string): UserAssetsStoreType => {
  return createQueryStore<FetchedUserAssetsData, UserAssetsParams, UserAssetsState, FetchedUserAssetsData, UserAssetsStateToPersist>(
    {
      fetcher: fetchUserAssets,
      setData: ({ data, set }) => {
        const userAssets = data?.userAssets;
        if (!userAssets) return;
        const positionTokenAddresses = usePositionsStore.getState().getTokenAddresses(address);
        set(state => setUserAssets({ address, state, userAssets, positionTokenAddresses }));
      },
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
      filter: 'all',
      hiddenAssets: new Set<UniqueId>(),
      hiddenAssetsBalance: null,
      inputSearchQuery: '',
      listAssets: new Map(),
      userAssets: new Map(),

      getBalanceSortedChainList: () => Array.from(get().chainBalances.keys()),

      getChainsWithBalance: () => {
        const chains: ChainId[] = [];
        for (const [chain, balance] of get().chainBalances) {
          if (balance) chains.push(chain);
        }
        return chains;
      },

      getHighestValueAsset: options => selectHighestValueAsset(get().listAssets.values(), get().hiddenAssets, options),

      getNativeAssetForChain: (chainId: ChainId) => {
        const nativeAsset = useBackendNetworksStore.getState().getChainsNativeAsset()[chainId];
        if (!nativeAsset) return null;
        const nativeAssetUniqueId = getUniqueId(nativeAsset.address, chainId);
        return get().userAssets.get(nativeAssetUniqueId) || null;
      },

      getUserAsset: (uniqueId: UniqueId) => get().userAssets.get(uniqueId) || null,

      getLegacyUserAsset: (uniqueId: UniqueId) => {
        const asset = get().userAssets.get(uniqueId);
        if (!asset) return null;
        return parsedSearchAssetToParsedAddressAsset(asset);
      },

      getUserAssets: () => {
        const { listAssets, hiddenAssets } = get();
        return Array.from(listAssets.values()).filter(asset => !hiddenAssets.has(asset.uniqueId));
      },

      isHidden: uniqueId => get().hiddenAssets.has(uniqueId),
      isInitialLoad: () => !get().userAssets.size && get().getStatus('isInitialLoad'),

      setSearchQuery: query => {
        const inputSearchQuery = query.trim().toLowerCase();
        set(state => (state.inputSearchQuery === inputSearchQuery ? state : { inputSearchQuery }));
      },

      getHiddenAssetsIds: () => Array.from(get().hiddenAssets),

      getTotalBalance: () => {
        const chainBalances = get().chainBalances;
        if (!chainBalances.size) return 0;
        let total = 0;
        for (const balance of chainBalances.values()) {
          total += balance;
        }
        return total - Number(get().hiddenAssetsBalance ?? 0);
      },

      setHiddenAssets: (uniqueIds: UniqueId[]) => {
        set(state => {
          const hiddenAssets = new Set(state.hiddenAssets);
          uniqueIds.forEach(uniqueId => {
            if (hiddenAssets.has(uniqueId)) {
              hiddenAssets.delete(uniqueId);
            } else {
              hiddenAssets.add(uniqueId);
            }
          });

          const hiddenAssetsBalance = calculateHiddenAssetsBalance({
            address,
            hiddenAssets,
            listAssets: state.listAssets,
          });

          return { hiddenAssets, hiddenAssetsBalance };
        });
      },

      updateTokens: (tokens: LiveTokensData) => {
        set(state => {
          for (const [tokenId, token] of Object.entries(tokens)) {
            if (!token || token.reliability.status !== 'PRICE_RELIABILITY_STATUS_TRUSTED') continue;

            const asset = state.userAssets.get(tokenId);
            const currency = userAssetsStoreManager.getState().currency;

            if (!asset || (asset?.price?.changed_at && asset?.price?.changed_at > toUnixTime(token.updateTime))) continue;

            if (asset?.price) {
              asset.price = {
                value: Number(token.price),
                relative_change_24h: Number(token.change.change24hPct),
              };
            }
            if (asset?.native?.price) {
              asset.native.price = {
                change: token.change.change24hPct,
                amount: Number(token.price),
                display: convertAmountToNativeDisplayWorklet(token.price, currency),
              };
            }
          }
          // We return the same state object to skip triggering selectors
          return state;
        });
      },

      reprocessAssetsData: positions => {
        set(state => {
          const indexes = indexUserAssets(address, state.userAssets, state.hiddenAssets, positions);
          if (state.listAssets.size !== indexes.listAssets.size) return indexes;
          for (const [id, asset] of indexes.listAssets) {
            if (state.listAssets.get(id) !== asset) return indexes;
          }
          return state;
        });
      },
    }),

    address.length
      ? {
          deserializer: value => deserializeUserAssetsState(value, address),
          partialize: state =>
            ({
              filter: state.filter,
              hiddenAssets: state.hiddenAssets,
              userAssets: state.userAssets,
            }) satisfies Required<UserAssetsStateToPersist>,
          serializer: serializeUserAssetsState,
          storageKey: `userAssets_${address}`,
          version: 2,
        }
      : undefined
  );
};
