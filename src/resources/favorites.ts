import { EthereumAddress, RainbowToken } from '@/entities';
import { getUniswapV2Tokens } from '@/handlers/dispersion';
import { createQueryKey, queryClient } from '@/react-query';
import {
  DAI_ADDRESS,
  ETH_ADDRESS,
  SOCKS_ADDRESS,
  WBTC_ADDRESS,
  WETH_ADDRESS,
} from '@/references';
import { useQuery } from '@tanstack/react-query';
import { without } from 'lodash';

export const favoritesQueryKey = createQueryKey(
  'favorites',
  {},
  { persisterVersion: 1 }
);

const DEFAULT: Record<EthereumAddress, RainbowToken> = {
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

async function fetchMetadata(addresses: string[]) {
  const favoritesMetadata: Record<EthereumAddress, RainbowToken> = {};
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
}

export function resetFavorites() {
  queryClient.setQueryData(favoritesQueryKey, DEFAULT);
}

export async function refreshFavorites() {
  const favorites = Object.keys(
    queryClient.getQueryData(favoritesQueryKey) ?? DEFAULT
  );
  const updatedMetadata = await fetchMetadata(favorites);
  return updatedMetadata;
}

export async function toggleFavorite(address: string) {
  const favorites = Object.keys(
    queryClient.getQueryData(favoritesQueryKey) ?? []
  );
  const lowercasedAddress = address.toLowerCase();
  let updatedFavorites;
  if (favorites.includes(lowercasedAddress)) {
    updatedFavorites = without(favorites, lowercasedAddress);
  } else {
    updatedFavorites = [...favorites, lowercasedAddress];
  }
  const metadata = await fetchMetadata(updatedFavorites);
  queryClient.setQueryData(favoritesQueryKey, metadata);
}

export function useFavorites(): {
  favorites: string[];
  favoritesMetadata: Record<EthereumAddress, RainbowToken>;
} {
  const query = useQuery<Record<EthereumAddress, RainbowToken>>(
    favoritesQueryKey,
    refreshFavorites,
    {
      staleTime: Infinity,
      cacheTime: Infinity,
    }
  );

  const favoritesMetadata = query.data ?? {};
  const favorites = Object.keys(favoritesMetadata);

  return {
    favorites,
    favoritesMetadata,
  };
}
