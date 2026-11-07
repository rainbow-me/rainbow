import { type Address } from 'viem';

import { type AddressOrEth, type ParsedSearchAsset, type UniqueId, type UserAssetFilter, type ZerionAsset } from '@/__swaps__/types/assets';
import { getUniqueId } from '@/entities/assetId';
import { AssetType } from '@/entities/assetTypes';
import type { ParsedAddressAsset } from '@/entities/tokens';
import { supportedCurrencies as supportedNativeCurrencies } from '@/features/currency/supportedCurrencies';
import { convertAmountAndPriceToNativeDisplay, convertAmountToNativeDisplayWorklet } from '@/features/currency/utils/nativeDisplay';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { ChainId, ChainName } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';
import { isNativeAsset } from '@/handlers/assets';
import { add, convertAmountToBalanceDisplay, convertRawAmountToDecimalFormat, greaterThan } from '@/helpers/utilities';
import { logger, RainbowError } from '@/logger';
import { isStaging } from '@/resources/addys/client';
import { fetchAnvilBalancesByChainId } from '@/resources/assets/anvilAssets';
import { getPlatformClient } from '@/resources/platform/client';

import {
  type Asset,
  type GetAssetsResponse,
  type HighestValueAssetOptions,
  type UserAsset,
  type UserAssetsParams,
  type UserAssetsState,
} from './types';
import { userAssetsStoreManager } from './userAssetsStoreManager';

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
  if (!params.address) return null;
  const { address, currency, testnetMode } = params;

  if (testnetMode) {
    return fetchTestnetUserAssets(params);
  }

  try {
    const chainIds = useBackendNetworksStore.getState().getSupportedChainIds();
    const res = await getPlatformClient().get<GetAssetsResponse>('/assets/GetAssetUpdates', {
      abortController,
      params: {
        currency: currency,
        chainIds: chainIds.join(','),
        address: address,
      },
      timeout: getUserAssetsTimeoutDuration(),
    });

    if (res.data.errors?.length > 0) {
      logger.error(new RainbowError('[🔴 userAssetsStore - fetchUserAssets 🔴]: Failed to fetch user assets'), {
        errors: res.data.errors,
      });
    }

    if (!res.data.result) {
      return null;
    }

    const userAssets = filterZeroBalanceAssets(Object.values(res.data.result));

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

function getUserAssetsTimeoutDuration() {
  return time.seconds(isStaging() ? 40 : 20);
}

// ============ Asset Utils ==================================================== //

const EMPTY_ASSET_SEARCH_OPTIONS = Object.freeze<HighestValueAssetOptions>({});

/**
 * Selects the highest-value user asset, optionally preferring
 * or requiring native assets and a preferred chain.
 */
export function selectHighestValueAsset(
  assets: Iterable<ParsedSearchAsset>,
  hiddenAssets: ReadonlySet<UniqueId>,
  { nativeAsset, preferredChainId }: HighestValueAssetOptions = EMPTY_ASSET_SEARCH_OPTIONS
): ParsedSearchAsset | null {
  const shouldRequireNativeAsset = nativeAsset === 'required';
  const shouldTrackAnyAsset = !shouldRequireNativeAsset;
  const shouldTrackNativeAsset = shouldRequireNativeAsset || nativeAsset === 'preferred';

  let highestValueAsset: ParsedSearchAsset | null = null;
  let highestValueNativeAsset: ParsedSearchAsset | null = null;
  let preferredAsset: ParsedSearchAsset | null = null;
  let preferredNativeAsset: ParsedSearchAsset | null = null;

  for (const asset of assets) {
    if (hiddenAssets.has(asset.uniqueId)) continue;
    const isPreferredChain = preferredChainId === asset.chainId;

    if (shouldTrackAnyAsset) {
      if (isHigherValueAsset(asset, highestValueAsset)) highestValueAsset = asset;
      if (isPreferredChain && isHigherValueAsset(asset, preferredAsset)) preferredAsset = asset;
    }

    if (shouldTrackNativeAsset && asset.isNativeAsset) {
      if (isHigherValueAsset(asset, highestValueNativeAsset)) highestValueNativeAsset = asset;
      if (isPreferredChain && isHigherValueAsset(asset, preferredNativeAsset)) preferredNativeAsset = asset;
    }
  }

  if (shouldRequireNativeAsset) return preferredNativeAsset ?? highestValueNativeAsset;
  if (nativeAsset === 'preferred') return preferredNativeAsset ?? highestValueNativeAsset ?? preferredAsset ?? highestValueAsset;
  return preferredAsset ?? highestValueAsset;
}

function isHigherValueAsset(asset: ParsedSearchAsset, selectedAsset: ParsedSearchAsset | null): boolean {
  return !selectedAsset || greaterThan(asset.native.balance.amount, selectedAsset.native.balance.amount);
}

export function setUserAssets({
  address,
  state,
  userAssets,
  positionTokenAddresses,
  chainIdsToUpdate,
}: {
  address: Address | string;
  state: UserAssetsState;
  userAssets: UserAsset[];
  positionTokenAddresses: ReadonlySet<string>;
  chainIdsToUpdate?: ChainId[];
}): UserAssetsState {
  if (address !== state.address) return state;

  const allAssets: ParsedSearchAsset[] = [];
  if (chainIdsToUpdate) {
    const chains = new Set(chainIdsToUpdate);
    for (const asset of state.userAssets.values()) {
      if (!chains.has(asset.chainId)) allAssets.push(asset);
    }
  }
  for (const asset of userAssets) allAssets.push(transformUserAssetToParsedSearchAsset(asset));
  allAssets.sort((a, b) => (Number(b.native.balance.amount) || 0) - (Number(a.native.balance.amount) || 0));

  const parsedAssets = new Map<UniqueId, ParsedSearchAsset>();
  for (const asset of allAssets) parsedAssets.set(asset.uniqueId, asset);

  return {
    ...state,
    userAssets: parsedAssets,
    ...indexUserAssets(address, parsedAssets, state.hiddenAssets, positionTokenAddresses),
  };
}

/** Builds list and balance indexes without discarding holdings represented by positions. */
export function indexUserAssets(
  address: UserAssetsState['address'],
  userAssets: UserAssetsState['userAssets'],
  hiddenAssets: UserAssetsState['hiddenAssets'],
  positionTokenAddresses: ReadonlySet<string>
): Pick<UserAssetsState, 'chainBalances' | 'hiddenAssetsBalance' | 'listAssets'> {
  let listAssets = userAssets;
  const chainBalances = new Map<ChainId, number>();

  for (const asset of userAssets.values()) {
    if (positionTokenAddresses.has(asset.address.toLowerCase())) {
      if (listAssets === userAssets) listAssets = new Map(userAssets);
      listAssets.delete(asset.uniqueId);
      continue;
    }

    const balance = Number(asset.native.balance.amount) || 0;
    chainBalances.set(asset.chainId, (chainBalances.get(asset.chainId) ?? 0) + balance);
  }

  for (const chainId of useBackendNetworksStore.getState().getSupportedChainIds()) {
    if (!chainBalances.has(chainId)) chainBalances.set(chainId, 0);
  }

  return {
    chainBalances: new Map([...chainBalances].sort(([, a], [, b]) => b - a)),
    hiddenAssetsBalance: calculateHiddenAssetsBalance({ address, hiddenAssets, listAssets }),
    listAssets,
  };
}

function transformUserAssetToParsedSearchAsset(userAsset: UserAsset): ParsedSearchAsset {
  const currency = userAssetsStoreManager.getState().currency;
  const { asset } = userAsset;
  const uniqueId = getUniqueId(asset.address, asset.chainId);
  const { decimals, symbol, price } = asset;
  // The API omits empty maps from its JSON.
  const networks = (asset.networks ?? {}) as Record<ChainId, { address: Address; decimals: number }>;
  const amount = convertRawAmountToDecimalFormat(userAsset.quantity, decimals);
  const nativeBalance = convertAmountAndPriceToNativeDisplay(1, userAsset.value, currency);

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
    mainnetAddress: networks[ChainId.mainnet]?.address as AddressOrEth,
    name: asset.name,
    networks,
    symbol: asset.symbol,
    price: {
      changed_at: asset.price.changedAt,
      relative_change_24h: asset.price?.relativeChange24h,
      value: asset.price?.value,
    },
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
    updatedAt: userAsset.updatedAt,
    // These are required in the type, but the new platform endpoint does not return them.
    highLiquidity: false,
    isRainbowCurated: false,
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
    type: asset.type ?? AssetType.token,
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

/** Publishes the hidden portion of the same balances used by the asset list. */
export function calculateHiddenAssetsBalance({
  address,
  hiddenAssets,
  listAssets,
}: Pick<UserAssetsState, 'address' | 'hiddenAssets' | 'listAssets'>): string {
  let balance = '0';
  for (const id of hiddenAssets) {
    const asset = listAssets.get(id);
    if (asset) balance = add(balance, asset.native.balance.amount);
  }

  const { hiddenAssetBalances, setHiddenAssetBalance } = userAssetsStoreManager.getState();
  if (balance !== hiddenAssetBalances[address]) setHiddenAssetBalance(address, balance);
  return balance;
}

export function filterZeroBalanceAssets(assets: UserAsset[]): UserAsset[] {
  return assets.filter(asset => greaterThan(asset.quantity, 0));
}

// ============ Search Utils =================================================== //

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SEARCH_CACHE_MAX_ENTRIES = 50;

/**
 * Builds a search index for one holdings snapshot. Empty-query results stay cached;
 * recent searches reuse their result arrays, including while deleting characters.
 */
export function createUserAssetSearch({
  listAssets,
  hiddenAssets,
  currency,
}: Pick<UserAssetsState, 'listAssets' | 'hiddenAssets'> & {
  currency: UserAssetsParams['currency'];
}): (filter: UserAssetFilter, query: string) => UniqueId[] {
  const assetsByChain = new Map<UserAssetFilter, ParsedSearchAsset[]>();
  const cache = new Map<string, UniqueId[]>();
  const allAssets: ParsedSearchAsset[] = [];
  const allIds: UniqueId[] = [];
  const threshold = supportedNativeCurrencies[currency].userAssetsSmallThreshold;

  assetsByChain.set('all', allAssets);
  cache.set('all:', allIds);
  for (const asset of listAssets.values()) {
    if (hiddenAssets.has(asset.uniqueId)) continue;
    allAssets.push(asset);
    const chainAssets = assetsByChain.get(asset.chainId);
    if (chainAssets) chainAssets.push(asset);
    else assetsByChain.set(asset.chainId, [asset]);

    const chainKey = `${asset.chainId}:`;
    let chainIds = cache.get(chainKey);
    if (!chainIds) cache.set(chainKey, (chainIds = []));
    if (Number(asset.native.balance.amount) > threshold) {
      allIds.push(asset.uniqueId);
      chainIds.push(asset.uniqueId);
    }
  }

  return (filter, query) => {
    const key = `${filter}:${query}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const search = query ? new RegExp(escapeRegExp(query), 'i') : null;
    const minimum = query.length >= 2 ? 0 : threshold;
    const ids: UniqueId[] = [];
    for (const asset of assetsByChain.get(filter) ?? []) {
      if (!(Number(asset.native.balance.amount) > minimum)) continue;
      if (search && !search.test(asset.name) && !search.test(asset.symbol) && asset.address.toLowerCase() !== query) continue;
      ids.push(asset.uniqueId);
    }

    cache.set(key, ids);
    if (cache.size > SEARCH_CACHE_MAX_ENTRIES) {
      for (const cachedKey of cache.keys()) {
        if (cachedKey.indexOf(':') !== cachedKey.length - 1) {
          cache.delete(cachedKey);
          break;
        }
      }
    }
    return ids;
  };
}
