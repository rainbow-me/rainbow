import { Address } from 'viem';
import { ParsedAddressAsset } from '@/entities';
import { add, greaterThan, multiply } from '@/helpers/utilities';
import { RainbowError, logger } from '@/logger';
import { SupportedCurrencyKey, supportedNativeCurrencies } from '@/references';
import { addysHttp } from '@/resources/addys/claimables/query';
import { fetchAnvilBalancesByChainId } from '@/resources/assets/anvilAssets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { staleBalancesStore } from '@/state/staleBalances';
import {
  ParsedAssetsDictByChain,
  ParsedSearchAsset,
  ParsedUserAsset,
  UniqueId,
  UserAssetFilter,
  ZerionAsset,
} from '@/__swaps__/types/assets';
import { AddressAssetsReceivedMessage } from '@/__swaps__/types/refraction';
import { parseUserAsset } from '@/__swaps__/utils/assets';
import { time } from '@/utils';
import { UserAssetsState, UserAssetsParams } from './types';
import { userAssetsStore, useUserAssetsStore } from './userAssets';
import { userAssetsStoreManager } from './userAssetsStoreManager';

const USER_ASSETS_TIMEOUT_DURATION = time.seconds(10);

// ============ Fetch Utils ==================================================== //

export async function fetchUserAssets(
  params: UserAssetsParams,
  abortController: AbortController | null
): Promise<{ chainIdsWithErrors: ChainId[] | null; parsedAssetsDict: ParsedAssetsDictByChain | null } | null> {
  const { address, currency, testnetMode } = params;

  if (testnetMode) {
    const { assets, chainIdsInResponse } = await fetchAnvilBalancesByChainId(address);
    const parsedAssets: Array<{
      asset: ZerionAsset;
      quantity: string;
      small_balances: boolean;
    }> = Object.values(assets).map(asset => ({
      asset: asset.asset,
      quantity: asset.quantity,
      small_balances: false,
    }));

    const parsedAssetsDict = parseUserAssets({
      assets: parsedAssets,
      chainIds: chainIdsInResponse,
      currency,
    });

    return { chainIdsWithErrors: null, parsedAssetsDict };
  }

  try {
    staleBalancesStore.getState().clearExpiredData(address);
    const staleBalanceParam = staleBalancesStore.getState().getStaleBalancesQueryParam(address);
    let url = `/${useBackendNetworksStore.getState().getSupportedChainIds().join(',')}/${address}/assets?currency=${currency.toLowerCase()}`;
    if (staleBalanceParam) {
      url += staleBalanceParam;
    }
    const res = await addysHttp.get<AddressAssetsReceivedMessage>(url, {
      abortController,
      timeout: USER_ASSETS_TIMEOUT_DURATION,
    });
    const chainIdsInResponse = res?.data?.meta?.chain_ids || [];
    const chainIdsWithErrors = res?.data?.meta?.chain_ids_with_errors || [];
    const assets = res?.data?.payload?.assets?.filter(asset => !asset.asset.defi_position) || [];
    if (address) {
      let parsedAssetsDict: ParsedAssetsDictByChain | null = null;

      if (assets.length && chainIdsInResponse.length) {
        parsedAssetsDict = parseUserAssets({
          assets,
          chainIds: chainIdsInResponse,
          currency,
        });
      } else if (chainIdsWithErrors.length) {
        /**
         * Currently only retrying if no asset data is returned, as the chains that individually fail
         * (e.g. due to rate limiting) are highly likely to fail again if retried immediately. So instead
         * we simply wait for the next fetch and ensure we don't override existing data for failed chains.
         */
        refetchAssetsForFailedChains({
          address,
          chainIds: chainIdsWithErrors,
          currency,
          existingData: parsedAssetsDict,
          testnetMode,
        });
      }

      return { chainIdsWithErrors, parsedAssetsDict };
    }
    return null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return null;
    logger.error(new RainbowError('[🔴 userAssetsStore - fetchUserAssets 🔴]: Failed to fetch user assets'), {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function refetchAssetsForFailedChains({
  address,
  chainIds,
  currency,
  existingData,
}: UserAssetsParams & {
  chainIds: ChainId[];
  existingData: ParsedAssetsDictByChain | null;
}) {
  try {
    const retries = [];
    for (const chainIdWithError of chainIds) {
      retries.push(
        fetchUserAssetsForChain({
          address,
          chainId: chainIdWithError,
          currency,
        })
      );
    }
    const parsedRetries = await Promise.all(retries);
    let newData: ParsedAssetsDictByChain | null = null;
    for (const parsedAssets of parsedRetries) {
      if (parsedAssets) {
        const values = Object.values(parsedAssets);
        if (values[0]) {
          if (!newData) newData = {};
          newData[values[0].chainId] = parsedAssets;
        }
      }
    }
    if (!newData) return;

    useUserAssetsStore.setState(state =>
      setUserAssets({
        address,
        chainIdsWithErrors: chainIds.filter(chainId => !newData?.[chainId]),
        state,
        userAssets: { ...existingData, ...newData },
      })
    );
  } catch (error) {
    logger.error(new RainbowError('[🔴 userAssetsStore - refetchAssetsForFailedChains 🔴]: Failed to retry for chainIds'), {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function fetchUserAssetsForChain(params: {
  address: UserAssetsParams['address'];
  chainId: ChainId;
  currency: UserAssetsParams['currency'];
}): Promise<Record<string, ParsedUserAsset> | null> {
  const { address, chainId, currency } = params;
  if (address !== userAssetsStoreManager.getState().address) return null;

  try {
    const url = `/${chainId}/${address}/assets`;
    const res = await addysHttp.get<AddressAssetsReceivedMessage>(url, {
      params: {
        currency: currency.toLowerCase(),
      },
    });
    const chainIdsInResponse = res?.data?.meta?.chain_ids || [];
    const assets = res?.data?.payload?.assets?.filter(asset => !asset.asset.defi_position) || [];
    if (assets.length && chainIdsInResponse.length) {
      const parsedAssetsDict = parseUserAssets({
        assets,
        chainIds: chainIdsInResponse,
        currency,
      });
      return parsedAssetsDict[chainId];
    } else {
      return null;
    }
  } catch (error) {
    logger.error(new RainbowError('[🔴 userAssetsStore - fetchUserAssetsForChain 🔴]: Failed to fetch user assets for chainId'), {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export function parsedSearchAssetToParsedAddressAsset(asset: ParsedSearchAsset): ParsedAddressAsset {
  return {
    address: asset.address,
    balance: {
      amount: asset.balance.amount,
      display: asset.balance.display,
    },
    network: useBackendNetworksStore.getState().getChainsName()[asset.chainId],
    name: asset.name,
    chainId: asset.chainId,
    color: asset.colors?.primary ?? asset.colors?.fallback,
    colors: asset.colors?.primary
      ? {
          primary: asset.colors.primary,
          fallback: asset.colors.fallback,
          shadow: asset.colors.shadow,
        }
      : undefined,
    decimals: asset.decimals,
    highLiquidity: asset.highLiquidity,
    icon_url: asset.icon_url,
    id: asset.networks?.[ChainId.mainnet]?.address,
    isNativeAsset: asset.isNativeAsset,
    price: {
      changed_at: undefined,
      relative_change_24h: asset.price?.relative_change_24h,
      value: asset.price?.value,
    },
    mainnet_address: asset.mainnetAddress,
    native: {
      balance: {
        amount: asset.native.balance.amount,
        display: asset.native.balance.display,
      },
      change: asset.native.price?.change,
      price: {
        amount: asset.native.price?.amount?.toString(),
        display: asset.native.price?.display,
      },
    },
    shadowColor: asset.colors?.shadow,
    symbol: asset.symbol,
    type: asset.type,
    uniqueId: asset.uniqueId,
  };
}

// ============ Asset Utils ==================================================== //

export function setUserAssets({
  address,
  chainIdsWithErrors = null,
  state,
  userAssets,
}: {
  address: Address | string;
  chainIdsWithErrors: ChainId[] | null;
  state: UserAssetsState;
  userAssets: ParsedSearchAsset[] | ParsedAssetsDictByChain | null;
}): UserAssetsState {
  if (!userAssets || address !== state.address) return state;

  const idsByChain = new Map<UserAssetFilter, UniqueId[]>();
  const unsortedChainBalances = new Map<ChainId, number>();
  const isArray = Array.isArray(userAssets);
  const newUserAssetsMap = new Map<UniqueId, ParsedSearchAsset>();
  const allIds: UniqueId[] = [];

  // Get preserved assets for chains with errors
  const preservedAssets: ParsedSearchAsset[] = [];
  if (chainIdsWithErrors && chainIdsWithErrors.length > 0) {
    for (const [, asset] of state.userAssets) {
      if (chainIdsWithErrors.includes(asset.chainId)) {
        preservedAssets.push(asset);
      }
    }
  }

  // Collect all assets in a flat array and sort by value
  const allAssets: ParsedSearchAsset[] = [...preservedAssets];

  if (isArray) {
    for (const asset of userAssets) {
      if (!chainIdsWithErrors?.includes(asset.chainId)) {
        allAssets.push(asset);
      }
    }
  } else {
    for (const [chainId, assetsDict] of Object.entries(userAssets)) {
      const numericChainId = Number(chainId);
      if (!chainIdsWithErrors?.includes(numericChainId)) {
        for (const asset of Object.values(assetsDict)) {
          allAssets.push(asset as ParsedSearchAsset);
        }
      }
    }
  }

  // Sort all assets by chain balance first, then by individual asset value
  allAssets.sort((a, b) => {
    const balanceA = unsortedChainBalances.get(a.chainId) ?? 0;
    const balanceB = unsortedChainBalances.get(b.chainId) ?? 0;
    if (balanceA !== balanceB) return balanceB - balanceA;
    return (Number(b.native.balance.amount) ?? 0) - (Number(a.native.balance.amount) ?? 0);
  });

  // Process sorted assets in a single pass
  for (const asset of allAssets) {
    newUserAssetsMap.set(asset.uniqueId, asset);
    allIds.push(asset.uniqueId);

    const balance = Number(asset.native.balance.amount) ?? 0;
    unsortedChainBalances.set(asset.chainId, (unsortedChainBalances.get(asset.chainId) ?? 0) + balance);
    idsByChain.set(asset.chainId, (idsByChain.get(asset.chainId) ?? []).concat(asset.uniqueId));
  }

  // Ensure all supported chains have entries
  for (const chainId of useBackendNetworksStore.getState().getSupportedChainIds()) {
    if (!unsortedChainBalances.has(chainId)) {
      unsortedChainBalances.set(chainId, 0);
      idsByChain.set(chainId, []);
    }
  }

  // Sort chain balances
  const sortedEntries = Array.from(unsortedChainBalances.entries()).sort(([, balanceA], [, balanceB]) => balanceB - balanceA);
  const chainBalances = new Map(sortedEntries);

  // Set complete list of IDs
  idsByChain.set('all', allIds);

  const smallBalanceThreshold = supportedNativeCurrencies[userAssetsStoreManager.getState().currency].userAssetsSmallThreshold;
  const filteredAllIdsArray = allIds.filter(id => {
    const asset = newUserAssetsMap.get(id);
    return asset && (+asset.native?.balance?.amount ?? 0) > smallBalanceThreshold;
  });

  // Build search cache
  const searchCache = new Map<string, UniqueId[]>();
  for (const userAssetFilter of chainBalances.keys()) {
    const filteredIds = (idsByChain.get(userAssetFilter) ?? []).filter(id => filteredAllIdsArray.includes(id));
    searchCache.set(`${userAssetFilter}`, filteredIds);
  }
  searchCache.set('all', filteredAllIdsArray);

  const legacyUserAssets = Array.from(newUserAssetsMap.values()).map(parsedSearchAssetToParsedAddressAsset);

  const hiddenAssetsBalance = calculateHiddenAssetsBalance({
    address,
    hiddenAssets: state.hiddenAssets,
    userAssets: newUserAssetsMap,
  });

  return {
    ...state,
    chainBalances,
    hiddenAssetsBalance,
    idsByChain,
    legacyUserAssets,
    searchCache,
    userAssets: newUserAssetsMap,
  };
}

export function calculateHiddenAssetsBalance({
  address,
  hiddenAssets,
  userAssets,
}: {
  address: Address | string;
} & Pick<UserAssetsState, 'hiddenAssets' | 'userAssets'>): string {
  let balance = '0';
  const {
    hiddenAssetBalances: { [address]: storedBalance },
    setHiddenAssetBalance,
  } = userAssetsStoreManager.getState();

  hiddenAssets.forEach(uniqueId => {
    const asset = userAssets.get(uniqueId);
    if (asset) {
      const assetNativeBalance = multiply(asset.price?.value ?? 0, asset.balance?.amount ?? 0);
      balance = add(balance, assetNativeBalance);
    }
  });

  if (balance !== storedBalance) setHiddenAssetBalance(address, balance);
  return balance;
}

export function parseUserAssets({
  assets,
  chainIds,
  currency,
}: {
  assets: {
    asset: ZerionAsset;
    quantity: string;
    small_balance?: boolean;
  }[];
  chainIds: ChainId[];
  currency: SupportedCurrencyKey;
}): ParsedAssetsDictByChain {
  const parsedAssetsDict = chainIds.reduce((dict, currentChainId) => ({ ...dict, [currentChainId]: {} }), {}) as ParsedAssetsDictByChain;
  for (const { asset, quantity, small_balance } of assets) {
    if (greaterThan(quantity, 0)) {
      const parsedAsset = parseUserAsset({
        asset,
        balance: quantity,
        currency,
        smallBalance: small_balance,
      });
      parsedAssetsDict[parsedAsset?.chainId][parsedAsset.uniqueId] = parsedAsset;
    }
  }
  return parsedAssetsDict;
}

// ============ Search Utils =================================================== //

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getCurrentSearchCache(): Map<string, UniqueId[]> {
  return userAssetsStore.getState().searchCache;
}

export function getDefaultCacheKeys(): Set<string> {
  const queryKeysToPreserve = new Set<string>();
  queryKeysToPreserve.add('all');

  for (const chainId of useBackendNetworksStore.getState().getSupportedChainIds()) {
    queryKeysToPreserve.add(`${chainId}`);
  }
  return queryKeysToPreserve;
}

export function getSearchQueryKey({ filter, searchQuery }: { filter: UserAssetFilter; searchQuery: string }): string {
  return `${filter}${searchQuery}`;
}

export function getFilteredUserAssetIds({
  filter,
  selectUserAssetIds,
  setSearchCache,
  rawSearchQuery,
}: {
  rawSearchQuery: UserAssetsState['inputSearchQuery'];
} & Pick<UserAssetsState, 'filter' | 'selectUserAssetIds' | 'setSearchCache'>) {
  const smallBalanceThreshold = supportedNativeCurrencies[userAssetsStoreManager.getState().currency].userAssetsSmallThreshold;

  const inputSearchQuery = rawSearchQuery.trim().toLowerCase();
  const queryKey = getSearchQueryKey({ filter, searchQuery: inputSearchQuery });

  // Use an external function to get the cache to prevent updates in response to changes in the cache
  const cachedData = getCurrentSearchCache()?.get(queryKey);

  // Check if the search results are already cached
  if (cachedData) {
    return cachedData;
  } else {
    const chainIdFilter = filter === 'all' ? null : filter;
    const searchRegex = inputSearchQuery.length > 0 ? new RegExp(escapeRegExp(inputSearchQuery), 'i') : null;

    const filteredIds = Array.from(
      selectUserAssetIds(
        asset =>
          (+asset.native?.balance?.amount ?? 0) > smallBalanceThreshold &&
          (!chainIdFilter || asset.chainId === chainIdFilter) &&
          (!searchRegex ||
            searchRegex.test(asset.name) ||
            searchRegex.test(asset.symbol) ||
            asset.address.toLowerCase() === inputSearchQuery),
        filter
      )
    );

    setSearchCache(queryKey, filteredIds);

    return filteredIds;
  }
}
