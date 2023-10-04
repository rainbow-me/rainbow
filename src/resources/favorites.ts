import { UniswapFavoriteTokenData } from '@/entities';
import { getUniswapV2Tokens } from '@/handlers/dispersion';
import { createQueryKey, queryClient } from '@/react-query';
import { useCallback } from 'react';
import {
  DAI_ADDRESS,
  ETH_ADDRESS,
  SOCKS_ADDRESS,
  WBTC_ADDRESS,
  WETH_ADDRESS,
} from '@/references';
import { useQuery } from '@tanstack/react-query';
import { uniq, without } from 'lodash';

export const favoritesQueryKey = createQueryKey(
  'favorites',
  {},
  { persisterVersion: 1 }
);

export const favoritesMetadataQueryKey = createQueryKey(
  'favoritesMetadata',
  {},
  { persisterVersion: 1 }
);

const FAVORITES_METADATA_DEFAULT: UniswapFavoriteTokenData = {
  [DAI_ADDRESS]: {
    address: DAI_ADDRESS,
    color: '#F0B340',
    decimals: 18,
    favorite: true,
    highLiquidity: true,
    isRainbowCurated: true,
    isVerified: true,
    name: 'Dai',
    symbol: 'DAI',
    type: 'token',
    uniqueId: DAI_ADDRESS,
  },
  [ETH_ADDRESS]: {
    address: ETH_ADDRESS,
    color: '#25292E',
    decimals: 18,
    favorite: true,
    highLiquidity: true,
    isVerified: true,
    name: 'Ethereum',
    symbol: 'ETH',
    type: 'token',
    uniqueId: ETH_ADDRESS,
  },
  [SOCKS_ADDRESS]: {
    address: SOCKS_ADDRESS,
    color: '#E15EE5',
    decimals: 18,
    favorite: true,
    highLiquidity: true,
    isRainbowCurated: true,
    isVerified: true,
    name: 'Unisocks',
    symbol: 'SOCKS',
    type: 'token',
    uniqueId: SOCKS_ADDRESS,
  },
  [WBTC_ADDRESS]: {
    address: WBTC_ADDRESS,
    color: '#FF9900',
    decimals: 8,
    favorite: true,
    highLiquidity: true,
    isRainbowCurated: true,
    isVerified: true,
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    type: 'token',
    uniqueId: WBTC_ADDRESS,
  },
};

const FAVORITES_DEFAULT = Object.keys(FAVORITES_METADATA_DEFAULT);

const x = async (addresses: string[]) => {
  const favoritesMetadata: UniswapFavoriteTokenData = {};
  const newFavoritesMeta = await getUniswapV2Tokens(
    addresses.map(address => {
      return address === ETH_ADDRESS ? WETH_ADDRESS : address.toLowerCase();
    })
  );
  const ethIsFavorited = addresses.includes(ETH_ADDRESS);
  const wethIsFavorited = addresses.includes(WETH_ADDRESS);
  if (newFavoritesMeta) {
    if (newFavoritesMeta[WETH_ADDRESS] && ethIsFavorited) {
      const favorite = newFavoritesMeta[WETH_ADDRESS];
      newFavoritesMeta[ETH_ADDRESS] = {
        ...favorite,
        address: ETH_ADDRESS,
        name: 'Ethereum',
        symbol: 'ETH',
        uniqueId: ETH_ADDRESS,
      };
    }
    Object.entries(newFavoritesMeta).forEach(([address, favorite]) => {
      if (address !== WETH_ADDRESS || wethIsFavorited) {
        favoritesMetadata[address] = { ...favorite, favorite: true };
      }
    });
  }
  return favoritesMetadata;
};

export function useFavorites(): {
  favorites: string[];
  favoritesMetadata: UniswapFavoriteTokenData;
  toggleFavorite: (address: string) => void;
} {
  const query = useQuery<UniswapFavoriteTokenData>(
    favoritesMetadataQueryKey,
    async () => {
      const favorites = Object.keys(
        queryClient.getQueryData(favoritesMetadataQueryKey) ??
          FAVORITES_METADATA_DEFAULT
      );
      const updatedMetadata = await x(favorites);
      return updatedMetadata;
    },
    {
      staleTime: Infinity,
      cacheTime: Infinity,
    }
  );

  const favoritesMetadata = query.data ?? {};
  const favorites = Object.keys(favoritesMetadata);
  // console.log(favorites.length);

  const toggleFavorite = useCallback(
    async (address: string) => {
      const lowercasedAddress = address.toLowerCase();
      let updatedFavorites;
      console.log('???');
      console.log(favorites);
      console.log(lowercasedAddress);
      if (favorites.includes(lowercasedAddress)) {
        console.log('IN');
        updatedFavorites = without(favorites, lowercasedAddress);
      } else {
        console.log('OUT');
        updatedFavorites = [...favorites, lowercasedAddress];
      }
      const metadata = await x(updatedFavorites);
      console.log('FDSFDSFDS');
      queryClient.setQueryData(favoritesMetadataQueryKey, metadata);
    },
    [favorites]
  );

  return {
    favorites,
    favoritesMetadata,
    toggleFavorite,
  };
}
