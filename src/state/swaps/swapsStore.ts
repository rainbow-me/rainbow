import { create } from 'zustand';
import { Hex } from 'viem';

import { ParsedSearchAsset, UniqueId, UserAssetFilter } from '@/__swaps__/types/assets';
import { CrosschainQuote, Quote, QuoteError, Source } from '@rainbow-me/swaps';
import { deriveAddressAndChainWithUniqueId } from '@/__swaps__/utils/address';
import { getDefaultSlippage } from '@/__swaps__/utils/swaps';
import { ChainId } from '@/__swaps__/types/chains';
import { DEFAULT_CONFIG } from '@/model/remoteConfig';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export interface SwapsState {
  // assets
  inputAsset: ParsedSearchAsset | null;
  outputAsset: ParsedSearchAsset | null;

  // quote
  quote: Quote | CrosschainQuote | QuoteError | null;

  // settings
  flashbots: boolean;
  slippage: string;
  source: Source | 'auto';

  // user assets
  userAssetIds: UniqueId[];
  userAssets: ParsedSearchAsset[];
  filter: UserAssetFilter;
  searchQuery: string;
  favoriteAssetIds: Hex[]; // this is chain agnostic, so we don't want to store a UniqueId here

  // actions
  setSearchQuery: (searchQuery: string) => void;
  getFilteredUserAssetIds: () => UniqueId[];
  getUserAsset: (uniqueId: UniqueId) => ParsedSearchAsset | undefined;
  isFavorite: (uniqueId: UniqueId) => boolean;
}

export const swapsStore = createRainbowStore<SwapsState>(
  (set, get) => ({
    inputAsset: null, // TODO: Default to their largest balance asset (or ETH mainnet if user has no assets)
    outputAsset: null,

    quote: null,
    flashbots: false,
    slippage: getDefaultSlippage(ChainId.mainnet, DEFAULT_CONFIG),
    source: 'auto',

    userAssetIds: [],
    userAssets: [],
    filter: 'all',
    searchQuery: '',
    favoriteAssetIds: [],

    setSearchQuery: (searchQuery: string) => set({ searchQuery }),
    getFilteredUserAssetIds: () => {
      const { userAssets, searchQuery } = get();

      // NOTE: No search query let's just return the userAssetIds
      if (!searchQuery.trim()) {
        return userAssets.map(asset => asset.uniqueId);
      }

      // Otherwise, let's match against the name, symbol OR address
      const matchedAssets = userAssets.filter(({ name, symbol, address }) =>
        [name, symbol, address].reduce((res, param) => res || param.toLowerCase().startsWith(searchQuery.toLowerCase()), false)
      );

      // and return the uniqueIds of those assets
      return matchedAssets.map(asset => asset.uniqueId);
    },

    getUserAsset: (uniqueId: UniqueId) => {
      const { userAssets } = get();

      return userAssets.find(asset => asset.uniqueId === uniqueId);
    },

    isFavorite: (uniqueId: UniqueId) => {
      const { favoriteAssetIds } = get();

      const { address } = deriveAddressAndChainWithUniqueId(uniqueId);

      return favoriteAssetIds.includes(address);
    },
  }),
  {
    storageKey: 'swapsStorage',
    version: 1,
    // NOTE: Only persist the settings
    partialize(state) {
      return {
        flashbots: state.flashbots,
        source: state.source,
        slippage: state.slippage,
      };
    },
  }
);

export const useSwapsStore = create(swapsStore);
