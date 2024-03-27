import create from 'zustand';

import {
  AVAX_AVALANCHE_ADDRESS,
  BNB_BSC_ADDRESS,
  DAI_ADDRESS,
  DAI_ARBITRUM_ADDRESS,
  DAI_AVALANCHE_ADDRESS,
  DAI_BASE_ADDRESS,
  DAI_BSC_ADDRESS,
  DAI_OPTIMISM_ADDRESS,
  DAI_POLYGON_ADDRESS,
  ETH_ADDRESS,
  ARBITRUM_ETH_ADDRESS,
  BASE_ETH_ADDRESS,
  OPTIMISM_ETH_ADDRESS,
  ZORA_ETH_ADDRESS,
  MATIC_POLYGON_ADDRESS,
  OP_ADDRESS,
  SOCKS_ADDRESS,
  SOCKS_ARBITRUM_ADDRESS,
  USDC_ADDRESS,
  USDC_ARBITRUM_ADDRESS,
  USDC_AVALANCHE_ADDRESS,
  USDC_BASE_ADDRESS,
  USDC_BSC_ADDRESS,
  USDC_OPTIMISM_ADDRESS,
  USDC_POLYGON_ADDRESS,
  WAVAX_AVALANCHE_ADDRESS,
  WBTC_ADDRESS,
  WBTC_ARBITRUM_ADDRESS,
  WBTC_AVALANCHE_ADDRESS,
  WBTC_OPTIMISM_ADDRESS,
  WBTC_POLYGON_ADDRESS,
  WETH_BASE_ADDRESS,
  WETH_OPTIMISM_ADDRESS,
  WETH_POLYGON_ADDRESS,
  WETH_ZORA_ADDRESS,
} from '@/references';
import { AddressOrEth } from '@/__swaps__/screens/Swap/types/assets';
import { ChainId } from '@/__swaps__/screens/Swap/types/chains';

import { createStore } from '../internal/createStore';

type UpdateFavoritesArgs = {
  address: AddressOrEth;
  chainId: ChainId;
};

type UpdateFavoritesFn = ({ address, chainId }: UpdateFavoritesArgs) => void;

export interface FavoritesState {
  favorites: Partial<Record<ChainId, AddressOrEth[]>>;
  addFavorite: UpdateFavoritesFn;
  removeFavorite: UpdateFavoritesFn;
}

const defaultFavorites = {
  [ChainId.mainnet]: [ETH_ADDRESS, DAI_ADDRESS, USDC_ADDRESS, WBTC_ADDRESS, SOCKS_ADDRESS],
  [ChainId.arbitrum]: [ARBITRUM_ETH_ADDRESS, DAI_ARBITRUM_ADDRESS, USDC_ARBITRUM_ADDRESS, WBTC_ARBITRUM_ADDRESS, SOCKS_ARBITRUM_ADDRESS],
  [ChainId.bsc]: [BNB_BSC_ADDRESS, DAI_BSC_ADDRESS, USDC_BSC_ADDRESS],
  [ChainId.polygon]: [MATIC_POLYGON_ADDRESS, WETH_POLYGON_ADDRESS, DAI_POLYGON_ADDRESS, USDC_POLYGON_ADDRESS, WBTC_POLYGON_ADDRESS],
  [ChainId.optimism]: [
    OPTIMISM_ETH_ADDRESS,
    OP_ADDRESS,
    WETH_OPTIMISM_ADDRESS,
    DAI_OPTIMISM_ADDRESS,
    USDC_OPTIMISM_ADDRESS,
    WBTC_OPTIMISM_ADDRESS,
  ],
  [ChainId.base]: [BASE_ETH_ADDRESS, WETH_BASE_ADDRESS, DAI_BASE_ADDRESS, USDC_BASE_ADDRESS],
  [ChainId.zora]: [ZORA_ETH_ADDRESS, WETH_ZORA_ADDRESS],
  [ChainId.avalanche]: [
    AVAX_AVALANCHE_ADDRESS,
    WAVAX_AVALANCHE_ADDRESS,
    DAI_AVALANCHE_ADDRESS,
    USDC_AVALANCHE_ADDRESS,
    WBTC_AVALANCHE_ADDRESS,
  ],
} satisfies FavoritesState['favorites'];

const mergeNewOfficiallySupportedChainsState = (state: FavoritesState, newChains: ChainId[]) => {
  for (const chainId of newChains) {
    const stateChainFavorites = state.favorites[chainId] || [];
    state.favorites[chainId] = [
      ...new Set(stateChainFavorites.concat(defaultFavorites[chainId])), // Set to remove duplicates if any
    ];
  }
  return state;
};

export const favoritesStore = createStore<FavoritesState>(
  (set, get) => ({
    favorites: defaultFavorites,
    addFavorite: ({ address, chainId }: UpdateFavoritesArgs) => {
      const { favorites } = get();
      const currentFavorites = favorites[chainId] || [];
      set({
        favorites: {
          ...favorites,
          [chainId]: [...currentFavorites, address],
        },
      });
    },
    removeFavorite: ({ address, chainId }: UpdateFavoritesArgs) => {
      const { favorites } = get();
      const currentFavorites = favorites[chainId] || [];
      set({
        favorites: {
          ...favorites,
          [chainId]: currentFavorites.filter(favoriteAddress => favoriteAddress !== address),
        },
      });
    },
  }),
  {
    persist: {
      name: 'favorites',
      version: 2,
      migrate(persistedState, version) {
        const state = persistedState as FavoritesState;
        if (version === 1) {
          // version 2 added support for Avalanche
          return mergeNewOfficiallySupportedChainsState(state, [ChainId.avalanche]);
        }
        return state;
      },
    },
  }
);

export const useFavoritesStore = create(favoritesStore);
