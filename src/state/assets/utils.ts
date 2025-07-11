import { Address } from 'viem';
import { ParsedAddressAsset } from '@/entities';
import { AssetType } from '@/entities/assetTypes';
import {
  add,
  convertAmountAndPriceToNativeDisplay,
  convertAmountToBalanceDisplay,
  convertAmountToNativeDisplayWorklet,
  convertRawAmountToDecimalFormat,
  greaterThan,
  multiply,
} from '@/helpers/utilities';
import { RainbowError, logger } from '@/logger';
import { supportedNativeCurrencies } from '@/references';
import { isStaging } from '@/resources/addys/client';
import { fetchAnvilBalancesByChainId } from '@/resources/assets/anvilAssets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId, ChainName } from '@/state/backendNetworks/types';
import { AddressOrEth, ParsedSearchAsset, UniqueId, UserAssetFilter, ZerionAsset } from '@/__swaps__/types/assets';
import { time } from '@/utils';
import { getUniqueId } from '@/utils/ethereumUtils';
import { isNativeAsset } from '@/handlers/assets';
import { UserAssetsState, UserAssetsParams, GetAssetsResponse, Asset, UserAsset } from './types';
import { userAssetsStore } from './userAssets';
import { userAssetsStoreManager } from './userAssetsStoreManager';
import { getPlatformClient } from '@/resources/platform/client';

const USER_ASSETS_TIMEOUT_DURATION = time.seconds(isStaging() ? 40 : 20);

// ============ Fetch Utils ==================================================== //

async function fetchTestnetUserAssets(
  params: UserAssetsParams
): Promise<{ chainIdsWithErrors: ChainId[] | null; userAssets: UserAsset[] } | null> {
  const { address } = params;
  const { assets } = await fetchAnvilBalancesByChainId(address, ChainId.mainnet);

  const userAssets: UserAsset[] = Object.values(assets).map(asset => ({
    asset: transformZerionAssetToUserAsset(asset.asset),
    quantity: asset.quantity,
    smallBalance: false,
    updatedAt: '0',
    value: '0',
  }));

  return {
    chainIdsWithErrors: null,
    userAssets,
  };
}

export async function fetchUserAssets(
  params: UserAssetsParams,
  abortController: AbortController | null
): Promise<{ chainIdsWithErrors: ChainId[] | null; userAssets: UserAsset[] } | null> {
  const { address, currency, testnetMode } = params;

  if (testnetMode) {
    return fetchTestnetUserAssets(params);
  }

  try {
    const chainIds = useBackendNetworksStore.getState().getSupportedChainIds();
    // const now = performance.now();
    const res = await getPlatformClient().get<GetAssetsResponse>('/assets/GetAssetUpdates', {
      abortController,
      params: {
        currency: currency,
        chainIds: chainIds.join(','),
        address: address,
      },
      timeout: USER_ASSETS_TIMEOUT_DURATION,
    });
    // console.log('fetchUserAssets', ((performance.now() - now) / 1000).toFixed(2), 's');

    if (res.data.errors?.length > 0) {
      logger.error(new RainbowError('[🔴 userAssetsStore - fetchUserAssets 🔴]: Failed to fetch user assets'), {
        errors: res.data.errors,
      });
    }

    if (!res.data.result) {
      return null;
    }

    const userAssets = filterZeroBalanceAssets(Object.values(res.data.result)).sort((a, b) => parseFloat(b.value) - parseFloat(a.value));

    return {
      chainIdsWithErrors: null,
      userAssets,
    };
  } catch (e) {
    console.log(e);
    logger.error(new RainbowError('[🔴 userAssetsStore - fetchUserAssets 🔴]: Failed to fetch user assets', e));
  }
  return null;
}

// ============ Asset Utils ==================================================== //

export function setUserAssets({
  address,
  state,
  userAssets,
}: {
  address: Address | string;
  state: UserAssetsState;
  userAssets: UserAsset[] | null;
}): UserAssetsState {
  if (!userAssets || address !== state.address) return state;

  const idsByChain = new Map<UserAssetFilter, UniqueId[]>();
  const unsortedChainBalances = new Map<ChainId, number>();
  const newUserAssetsMap = new Map<UniqueId, ParsedSearchAsset>();
  const allIds: UniqueId[] = [];

  // Collect all assets in a flat array and sort by value
  const allAssets: ParsedSearchAsset[] = userAssets.map(asset => transformUserAssetToParsedSearchAsset(asset));

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
    return asset && Number(asset.native?.balance?.amount ?? 0) > smallBalanceThreshold;
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

function transformUserAssetToParsedSearchAsset(userAsset: UserAsset): ParsedSearchAsset {
  const currency = userAssetsStoreManager.getState().currency;
  const { asset } = userAsset;
  const uniqueId = getUniqueId(asset.address, asset.chainId);
  const { decimals, symbol, price } = asset;
  const amount = convertRawAmountToDecimalFormat(userAsset.quantity, decimals);
  const nativeBalance = convertAmountAndPriceToNativeDisplay(1, userAsset.value, currency);

  // TODO (kane): is price supposed to be an optional?
  return {
    uniqueId,
    address: asset.address as AddressOrEth,
    chainId: asset.chainId,
    chainName: asset.network,
    colors: asset.colors,
    decimals,
    icon_url: asset.iconUrl,
    isNativeAsset: isNativeAsset(asset.address, asset.chainId),
    isVerified: asset.verified,
    mainnetAddress: asset.networks[ChainId.mainnet]?.address as AddressOrEth,
    name: asset.name,
    networks: asset.networks as Record<ChainId, { address: Address; decimals: number }>,
    symbol: asset.symbol,
    price: {
      // TODO (kane): change the type this back in
      // changedAt: asset.price.changedAt,
      relative_change_24h: asset.price?.relativeChange24h,
      value: asset.price?.value,
    },
    // value: userAsset.value,
    smallBalance: userAsset.smallBalance,
    bridging: {
      isBridgeable: asset.bridging.bridgeable,
      networks: asset.bridging.networks,
    },
    balance: {
      amount,
      display: convertAmountToBalanceDisplay(amount, { decimals, symbol }),
    },
    native: {
      balance: nativeBalance,
      price: {
        change: String(price?.relativeChange24h ?? 0),
        amount: price?.value ?? 0,
        display: convertAmountToNativeDisplayWorklet(price?.value ?? 0, currency),
      },
    },
    // TODO (kane): these are required in the type, but we don't have them
    highLiquidity: true,
    isRainbowCurated: false,

    // Optionals of the ParsedSearchAsset type that we don't have

    // standard: 'erc-721' | 'erc-1155';
    // rainbowMetadataId?: number;
    // sectionId?: 'bridge' | 'recent' | 'favorites' | 'verified' | 'unverified' | 'other_networks' | 'popular';
    // type?: 'nft' | 'aave-v2' | 'balancer' | 'curve' | 'compound' | 'compound-v3' | 'maker' | 'one-inch' | 'piedao-pool' | 'yearn' | 'yearn-v2' | 'uniswap-v2' | 'aave-v3' | 'harvest' | 'lido' | 'uniswap-v3' | 'convex' | 'convex-frax' | 'pancake-swap' | 'balancer-v2' | 'frax' | 'gmx' | 'aura' | 'pickle' | 'yearn-v3' | 'venus' | 'sushiswap' | 'native' | 'wrappedNative' | 'stablecoin' | 'rainbow';
    // isPopular?: boolean;
    // market?: {
    //   market_cap: {
    //     value: number;
    //   };
    //   volume_24h: number;
    //   circulating_supply: number;
    // };
  };
}

function transformZerionAssetToUserAsset(asset: ZerionAsset): Asset {
  const chainName = asset.network ?? ChainName.mainnet;
  const chainId = useBackendNetworksStore.getState().getChainsIdByName()[chainName] || ChainId.mainnet;

  // Transform implementations to networks format
  const networks: Record<string, { address: string; decimals: number }> = {};
  if (asset.implementations) {
    Object.entries(asset.implementations).forEach(([chainIdStr, impl]) => {
      if (impl.address) {
        networks[chainIdStr] = {
          address: impl.address,
          decimals: impl.decimals,
        };
      }
    });
  }

  if (!networks[chainId.toString()]) {
    networks[chainId.toString()] = {
      address: asset.asset_code,
      decimals: asset.decimals,
    };
  }

  const bridgingNetworks: Record<string, { bridgeable: boolean }> = {};
  if (asset.bridging?.networks) {
    Object.entries(asset.bridging.networks).forEach(([chainIdKey, value]) => {
      if (value) {
        bridgingNetworks[chainIdKey] = { bridgeable: value.bridgeable };
      }
    });
  }

  return {
    address: asset.asset_code,
    chainId: chainId,
    name: asset.name,
    symbol: asset.symbol,
    decimals: asset.decimals,
    type: asset.type || AssetType.token,
    iconUrl: asset.icon_url,
    network: chainName,
    verified: asset.is_verified ?? false,
    transferable: true,
    colors: {
      primary: asset.colors?.primary ?? '#FFFFFF',
      fallback: asset.colors?.fallback,
    },
    price: {
      value: asset.price?.value ?? 0,
      relativeChange24h: asset.price?.relative_change_24h ?? 0,
      changedAt: 0, // ZerionAsset price doesn't have changed_at
    },
    networks,
    bridging: {
      bridgeable: asset.bridging?.bridgeable || false,
      networks: bridgingNetworks,
    },
  };
}

// ParsedAddressAsset is a legacy type
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

function filterZeroBalanceAssets(assets: UserAsset[]): UserAsset[] {
  return assets.filter(asset => greaterThan(asset.value, 0));
}

// export function parseUserAssets({
//   assets,
//   chainIds,
//   currency,
// }: {
//   assets: UserAsset[];
//   chainIds: ChainId[];
//   currency: SupportedCurrencyKey;
// }): ParsedAssetsDictByChain {
//   const parsedAssetsDict = chainIds.reduce((dict, currentChainId) => ({ ...dict, [currentChainId]: {} }), {}) as ParsedAssetsDictByChain;
//   for (const { asset, quantity, smallBalance } of assets) {
//     if (greaterThan(quantity, 0)) {
//       const parsedUserAsset = transformUserAssetToParsedUserAsset(asset);
//       const parsedAsset = parseUserAsset({
//         asset: transformUserAssetToZerionAsset(asset),
//         balance: quantity,
//         currency,
//         smallBalance,
//       });
//       parsedAssetsDict[parsedAsset?.chainId][parsedAsset.uniqueId] = parsedAsset;
//     }
//   }
//   return parsedAssetsDict;
// }

// function transformUserAssetToParsedUserAsset(asset: UserAsset): ParsedUserAsset {
//   return {
//     ...asset,
//     asset: transformUserAssetToZerionAsset(asset),
//   };
// }

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
          Number(asset.native?.balance?.amount ?? 0) > smallBalanceThreshold &&
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
