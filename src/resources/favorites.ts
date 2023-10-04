import { UniswapFavoriteTokenData } from '@/entities';
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

export function useFavorites() {
  const favoritesQuery = useQuery<string[]>(
    favoritesQueryKey,
    () => FAVORITES_DEFAULT,
    {
      staleTime: Infinity,
      cacheTime: Infinity,
    }
  );

  const favorites = favoritesQuery.data ?? [];

  const favoritesMetadataQuery = useQuery<UniswapFavoriteTokenData>(
    favoritesMetadataQueryKey,
    async () => {
      const favoritesMetadata: UniswapFavoriteTokenData = {};
      try {
        const newFavoritesMeta = await getUniswapV2Tokens(
          favorites.map(address => {
            return address === ETH_ADDRESS
              ? WETH_ADDRESS
              : address.toLowerCase();
          })
        );
        const ethIsFavorited = favorites.includes(ETH_ADDRESS);
        const wethIsFavorited = favorites.includes(WETH_ADDRESS);
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
      } catch (e) {
        // logger.sentry(
        //   `An error occurred while fetching uniswap favorite metadata: ${e}`
        // );
        console.log('shit');
      }
      return favoritesMetadata;
    },
    {
      staleTime: Infinity,
      cacheTime: Infinity,
    }
  );

  return {
    favorites,
    favoritesWithMetadata: favoritesMetadataQuery.data ?? {},
  };
}
