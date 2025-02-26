import { useQuery } from '@tanstack/react-query';
import { omit } from 'lodash';
import isEqual from 'react-fast-compare';
import { analyticsV2 } from '@/analytics';
import { NativeCurrencyKeys, RainbowToken } from '@/entities';
import { RainbowError, logger } from '@/logger';
import { createQueryKey, queryClient } from '@/react-query';
import { DAI_ADDRESS, ETH_ADDRESS, SOCKS_ADDRESS, WBTC_ADDRESS, WETH_ADDRESS } from '@/references';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId, Network } from '@/state/backendNetworks/types';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { AddressOrEth, UniqueId } from '@/__swaps__/types/assets';
import { promiseUtils, time } from '@/utils';
import { getUniqueId } from '@/utils/ethereumUtils';
import { externalTokenQueryKey, fetchExternalToken } from './assets/externalAssetsQuery';

export const favoritesQueryKey = createQueryKey('favorites', {}, { persisterVersion: 4 });

const DEFAULT_FAVORITES = [DAI_ADDRESS, ETH_ADDRESS, SOCKS_ADDRESS, WBTC_ADDRESS];

interface FavoritesState {
  favorites: Record<UniqueId, RainbowToken> | undefined;
}

const useFavoritesStore = createRainbowStore<FavoritesState>(
  () => ({
    favorites: initializeFavorites(),
  }),
  { storageKey: 'favoritedTokens' }
);

function initializeFavorites() {
  return queryClient.getQueryData<Record<UniqueId, RainbowToken>>(favoritesQueryKey);
}

/**
 * Returns a map of the given `addresses` to their corresponding `RainbowToken` metadata.
 */
async function fetchMetadata(addresses: string[], chainId = ChainId.mainnet) {
  const favoritesMetadata: Record<UniqueId, RainbowToken> = {};
  const newFavoritesMeta: Record<UniqueId, RainbowToken> = {};
  const network = useBackendNetworksStore.getState().getChainsName()[chainId];

  // Map addresses to an array of promises returned by fetchExternalToken
  const fetchPromises: Promise<void>[] = addresses.map(async address => {
    const externalAsset = await queryClient.fetchQuery(
      externalTokenQueryKey({ address, chainId, currency: NativeCurrencyKeys.USD }),
      async () => fetchExternalToken({ address, chainId, currency: NativeCurrencyKeys.USD }),
      {
        staleTime: Infinity,
      }
    );

    if (externalAsset) {
      const uniqueId = getUniqueId(externalAsset?.networks[chainId]?.address, chainId);
      newFavoritesMeta[uniqueId] = {
        ...externalAsset,
        chainId,
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
    const WETH_uniqueId = getUniqueId(WETH_ADDRESS, ChainId.mainnet);
    if (newFavoritesMeta[WETH_uniqueId] && ethIsFavorited) {
      const favorite = newFavoritesMeta[WETH_uniqueId];
      const uniqueId = getUniqueId(ETH_ADDRESS, ChainId.mainnet);
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
 * Gets persisted favorites data and refreshes metadata, initializing with defaults if none exist.
 */
async function getFavorites() {
  const favorites = useFavoritesStore.getState().favorites || queryClient.getQueryData<Record<UniqueId, RainbowToken>>(favoritesQueryKey);

  // If favorites haven't ever been set, initialize with defaults
  if (!favorites) {
    const defaultFavorites = await fetchMetadata(DEFAULT_FAVORITES, ChainId.mainnet);
    useFavoritesStore.setState({ favorites: defaultFavorites });
    return defaultFavorites;
  }

  // Otherwise, refresh existing favorites
  const favoritesByNetwork = Object.values(favorites).reduce(
    (favoritesByChain, token) => {
      favoritesByChain[token.network as Network] ??= [];
      favoritesByChain[token.network as Network].push(token.address);
      return favoritesByChain;
    },
    {} as Record<Network, string[]>
  );

  const chainsIdByName = useBackendNetworksStore.getState().getChainsIdByName();

  try {
    const updatedMetadataByNetwork = await Promise.all(
      Object.entries(favoritesByNetwork).map(async ([network, networkFavorites]) =>
        fetchMetadata(networkFavorites, chainsIdByName[network as Network])
      )
    );

    // Merge with existing favorites data
    const newFavorites: Record<UniqueId, RainbowToken> = Object.assign({}, favorites, ...updatedMetadataByNetwork);
    useFavoritesStore.setState({ favorites: newFavorites });

    return newFavorites;
  } catch (error) {
    logger.error(new RainbowError('Failed to refresh favorites:', { cause: error }));
    return favorites;
  }
}

/**
 * Toggles the favorite status of the given address. Performs a fetch to refresh the metadata of the
 * given address if it is not already favorited. If the address is already favorited, the favorite status
 * is removed from the query data.
 * @param address - The address to toggle the favorite status of.
 * @param chainId - The chain id of the network to toggle the favorite status of @default ChainId.mainnet
 */
export async function toggleFavorite(address: string, chainId = ChainId.mainnet) {
  const favorites =
    useFavoritesStore.getState().favorites || queryClient.getQueryData<Record<UniqueId, RainbowToken>>(favoritesQueryKey) || {};
  const lowercasedAddress = address.toLowerCase() as AddressOrEth;
  const uniqueId = getUniqueId(lowercasedAddress, chainId);
  if (Object.keys(favorites).includes(uniqueId)) {
    useFavoritesStore.setState({ favorites: omit(favorites, uniqueId) });
  } else {
    const metadata = await fetchMetadata([lowercasedAddress], chainId);
    analyticsV2.track(analyticsV2.event.addFavoriteToken, {
      address: lowercasedAddress,
      chainId,
      name: metadata[uniqueId].name,
      symbol: metadata[uniqueId].symbol,
    });
    useFavoritesStore.setState({ favorites: { ...favorites, ...metadata } });
  }
}

/**
 * Returns `favorites`, an array of favorited addresses, as well as `favoritesMetadata`, a map of these
 * addresses to their corresponding `RainbowToken`. These values are cached in AsyncStorage and is only
 * modified/updated when `toggleFavorite` or `refreshFavorites` is called.
 */
export function useFavorites() {
  useQuery({
    queryFn: getFavorites,
    cacheTime: Infinity,
    keepPreviousData: true,
    notifyOnChangeProps: [],
    queryKey: favoritesQueryKey,
    refetchOnWindowFocus: false,
    staleTime: time.days(1),
  });

  const [favorites, favoritesMetadata] = useFavoritesStore(state => [Object.keys(state.favorites ?? {}), state.favorites ?? {}], isEqual);

  return {
    favorites,
    favoritesMetadata,
  };
}
