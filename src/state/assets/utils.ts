import { type Address } from 'viem';

import { type AddressOrEth, type ParsedSearchAsset, type UniqueId, type ZerionAsset } from '@/__swaps__/types/assets';
import { getUniqueId } from '@/entities/assetId';
import { AssetType } from '@/entities/assetTypes';
import type { ParsedAddressAsset } from '@/entities/tokens';
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
  { excludeAssetId, nativeAsset, preferredChainId }: HighestValueAssetOptions = EMPTY_ASSET_SEARCH_OPTIONS
): ParsedSearchAsset | null {
  const shouldTrackAnyAsset = nativeAsset !== 'required';
  const shouldTrackNativeAsset = nativeAsset !== undefined;

  let highestValueAsset: ParsedSearchAsset | null = null;
  let highestValueNativeAsset: ParsedSearchAsset | null = null;
  let preferredAsset: ParsedSearchAsset | null = null;
  let preferredNativeAsset: ParsedSearchAsset | null = null;

  for (const asset of assets) {
    if (asset.uniqueId === excludeAssetId || hiddenAssets.has(asset.uniqueId)) continue;
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

  return preferredNativeAsset ?? highestValueNativeAsset ?? preferredAsset ?? highestValueAsset;
}

function isHigherValueAsset(asset: ParsedSearchAsset, selectedAsset: ParsedSearchAsset | null): boolean {
  return !selectedAsset || greaterThan(asset.native.balance.amount, selectedAsset.native.balance.amount);
}

/**
 * Builds balance-sorted holdings and chain totals, preserving chains omitted from a partial update.
 */
export function setUserAssets({
  state,
  userAssets,
  chainIdsToUpdate,
}: {
  state: UserAssetsState;
  userAssets: UserAsset[];
  chainIdsToUpdate?: ChainId[];
}): Pick<UserAssetsState, 'userAssets' | 'chainBalances'> {
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
    userAssets: parsedAssets,
    chainBalances: getChainBalances(parsedAssets),
  };
}

/**
 * Totals complete holdings by chain, ordered by balance and including empty supported chains.
 */
export function getChainBalances(userAssets: UserAssetsState['userAssets']): UserAssetsState['chainBalances'] {
  const chainBalances = new Map<ChainId, number>();

  for (const asset of userAssets.values()) {
    const balance = Number(asset.native.balance.amount) || 0;
    chainBalances.set(asset.chainId, (chainBalances.get(asset.chainId) ?? 0) + balance);
  }

  for (const chainId of useBackendNetworksStore.getState().getSupportedChainIds()) {
    if (!chainBalances.has(chainId)) chainBalances.set(chainId, 0);
  }

  return new Map([...chainBalances].sort(([, a], [, b]) => b - a));
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

/**
 * Updates the account's cached hidden balance from its complete holdings.
 */
export function updateHiddenAssetsBalance({
  address,
  hiddenAssets,
  userAssets,
}: Pick<UserAssetsState, 'address' | 'hiddenAssets' | 'userAssets'>): void {
  let balance = '0';
  for (const id of hiddenAssets) {
    const asset = userAssets.get(id);
    if (asset) balance = add(balance, asset.native.balance.amount);
  }

  const { hiddenAssetBalances, setHiddenAssetBalance } = userAssetsStoreManager.getState();
  if (balance !== hiddenAssetBalances[address]) setHiddenAssetBalance(address, balance);
}

export function filterZeroBalanceAssets(assets: UserAsset[]): UserAsset[] {
  return assets.filter(asset => greaterThan(asset.quantity, 0));
}
