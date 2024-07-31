import { UniqueId } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { EthereumAddress, NativeCurrencyKeys, RainbowToken } from '@/entities';
import { Network } from '@/networks/types';
import { createQueryKey, queryClient } from '@/react-query';
import { DAI_ADDRESS, ETH_ADDRESS, SOCKS_ADDRESS, WBTC_ADDRESS, WETH_ADDRESS } from '@/references';
import { promiseUtils } from '@/utils';
import ethereumUtils, { getUniqueId } from '@/utils/ethereumUtils';
import { useQuery } from '@tanstack/react-query';
import { omit } from 'lodash';
import { externalTokenQueryKey, fetchExternalToken } from './assets/externalAssetsQuery';

export const favoritesQueryKey = createQueryKey('favorites', {}, { persisterVersion: 141224 });

const DAI_uniqueId = getUniqueId(DAI_ADDRESS, Network.mainnet);
const ETH_uniqueId = getUniqueId(ETH_ADDRESS, Network.mainnet);
const SOCKS_uniqueId = getUniqueId(SOCKS_ADDRESS, Network.mainnet);
const WBTC_uniqueId = getUniqueId(WBTC_ADDRESS, Network.mainnet);

const DEFAULT: Record<UniqueId, RainbowToken> = {
  [DAI_uniqueId]: {
    address: DAI_ADDRESS,
    color: '#F0B340',
    decimals: 18,
    favorite: true,
    highLiquidity: true,
    isRainbowCurated: true,
    isVerified: true,
    name: 'Dai',
    symbol: 'DAI',
    network: Network.mainnet,
    uniqueId: DAI_uniqueId,
  },
  [ETH_uniqueId]: {
    address: ETH_ADDRESS,
    color: '#25292E',
    decimals: 18,
    favorite: true,
    highLiquidity: true,
    isVerified: true,
    name: 'Ethereum',
    symbol: 'ETH',
    network: Network.mainnet,
    uniqueId: ETH_uniqueId,
  },
  [SOCKS_uniqueId]: {
    address: SOCKS_ADDRESS,
    color: '#E15EE5',
    decimals: 18,
    favorite: true,
    highLiquidity: true,
    isRainbowCurated: true,
    isVerified: true,
    name: 'Unisocks',
    symbol: 'SOCKS',
    network: Network.mainnet,
    uniqueId: SOCKS_uniqueId,
  },
  [WBTC_uniqueId]: {
    address: WBTC_ADDRESS,
    color: '#FF9900',
    decimals: 8,
    favorite: true,
    highLiquidity: true,
    isRainbowCurated: true,
    isVerified: true,
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    network: Network.mainnet,
    uniqueId: WBTC_uniqueId,
  },
};

/**
 * Returns a map of the given `addresses` to their corresponding `RainbowToken` metadata.
 */
async function fetchMetadata(addresses: string[], chainId = ChainId.mainnet) {
  const favoritesMetadata: Record<UniqueId, RainbowToken> = {};
  const newFavoritesMeta: Record<UniqueId, RainbowToken> = {};

  const network = ethereumUtils.getNetworkFromChainId(chainId);

  // Map addresses to an array of promises returned by fetchExternalToken
  const fetchPromises: Promise<void>[] = addresses.map(async address => {
    const externalAsset = await queryClient.fetchQuery(
      externalTokenQueryKey({ address, network, currency: NativeCurrencyKeys.USD }),
      async () => fetchExternalToken({ address, network, currency: NativeCurrencyKeys.USD }),
      {
        staleTime: Infinity,
      }
    );

    if (externalAsset) {
      const uniqueId = getUniqueId(externalAsset?.networks[chainId]?.address, network);
      newFavoritesMeta[uniqueId] = {
        ...externalAsset,
        network,
        address,
        networks: externalAsset.networks,
        mainnet_address: externalAsset?.networks[ChainId.mainnet]?.address,
        uniqueId,
        isVerified: true,
      };
    }
  });

  // Wait for all promises to resolve
  await promiseUtils.PromiseAllWithFails(fetchPromises);

  const ethIsFavorited = addresses.includes(ETH_ADDRESS);
  const wethIsFavorited = addresses.includes(WETH_ADDRESS);
  if (newFavoritesMeta) {
    const WETH_uniqueId = getUniqueId(WETH_ADDRESS, Network.mainnet);
    if (newFavoritesMeta[WETH_uniqueId] && ethIsFavorited) {
      const favorite = newFavoritesMeta[WETH_uniqueId];
      const uniqueId = getUniqueId(ETH_ADDRESS, Network.mainnet);
      newFavoritesMeta[uniqueId] = {
        ...favorite,
        address: ETH_ADDRESS,
        name: 'Ethereum',
        symbol: 'ETH',
        uniqueId,
      };
    }
    Object.entries(newFavoritesMeta).forEach(([uniqueId, favorite]) => {
      if (favorite.address !== WETH_ADDRESS || wethIsFavorited) {
        favoritesMetadata[uniqueId] = { ...favorite, favorite: true };
      }
    });
  }

  return favoritesMetadata;
}

/**
 * Refreshes the metadata associated with all favorites.
 */
export async function refreshFavorites() {
  const favorites = queryClient.getQueryData<Record<UniqueId, RainbowToken>>(favoritesQueryKey) ?? DEFAULT;

  const favoritesByNetwork = Object.values(favorites).reduce(
    (favoritesByChain, token) => {
      favoritesByChain[token.network] ??= [];
      favoritesByChain[token.network].push(token.address);
      return favoritesByChain;
    },
    {} as Record<Network, string[]>
  );

  const updatedMetadataByNetwork = await Promise.all(
    Object.entries(favoritesByNetwork).map(async ([network, networkFavorites]) =>
      fetchMetadata(networkFavorites, ethereumUtils.getChainIdFromNetwork(network as Network))
    )
  );

  return updatedMetadataByNetwork.reduce(
    (updatedMetadata, updatedNetworkMetadata) => ({
      ...updatedMetadata,
      ...updatedNetworkMetadata,
    }),
    {}
  );
}

/**
 * Toggles the favorite status of the given address. Performs a fetch to refresh the metadata of the
 * given address if it is not already favorited. If the address is already favorited, the favorite status
 * is removed from the query data.
 * @param address - The address to toggle the favorite status of.
 * @param chainId - The chain id of the network to toggle the favorite status of @default ChainId.mainnet
 */
export async function toggleFavorite(address: string, chainId = ChainId.mainnet) {
  const favorites = queryClient.getQueryData<Record<UniqueId, RainbowToken>>(favoritesQueryKey);
  const lowercasedAddress = address.toLowerCase() as EthereumAddress;
  const uniqueId = getUniqueId(lowercasedAddress, ethereumUtils.getNetworkFromChainId(chainId));
  if (Object.keys(favorites || {}).includes(uniqueId)) {
    queryClient.setQueryData(favoritesQueryKey, omit(favorites, uniqueId));
  } else {
    const metadata = await fetchMetadata([lowercasedAddress], chainId);
    queryClient.setQueryData(favoritesQueryKey, {
      ...favorites,
      ...metadata,
    });
  }
}

/**
 * Returns `favorites`, an array of favorited addresses, as well as `favoritesMetadata`, a map of these
 * addresses to their corresponding `RainbowToken`. These values are cached in AsyncStorage and is only
 * modified/updated when `toggleFavorite` or `refreshFavorites` is called.
 */
export function useFavorites(): {
  favorites: string[];
  favoritesMetadata: Record<UniqueId, RainbowToken>;
} {
  const query = useQuery({
    queryKey: favoritesQueryKey,
    queryFn: refreshFavorites,
    staleTime: 24 * 60 * 60 * 1000, // 24hrs
    cacheTime: Infinity,
  });

  const favoritesMetadata = query.data ?? {};
  const favorites = Object.keys(favoritesMetadata);

  return {
    favorites,
    favoritesMetadata,
  };
}
