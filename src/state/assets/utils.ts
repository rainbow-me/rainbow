import { type ParsedSearchAsset, type UniqueId } from '@/__swaps__/types/assets';
import { getUniqueId } from '@/entities/assetId';
import type { ParsedAddressAsset } from '@/entities/tokens';
import { convertAmountAndPriceToNativeDisplay, convertAmountToNativeDisplayWorklet } from '@/features/currency/utils/nativeDisplay';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { ChainId } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';
import { isNativeAsset } from '@/handlers/assets';
import { add, convertAmountToBalanceDisplay, convertRawAmountToDecimalFormat, greaterThan } from '@/helpers/utilities';
import { logger, RainbowError } from '@/logger';
import { isStaging } from '@/resources/addys/client';
import { fetchAnvilUserAssets } from '@/resources/assets/anvilAssets';
import { getPlatformClient } from '@/resources/platform/client';
import { toUnixTime } from '@/worklets/dates';

import {
  type GetAssetsResponse,
  type HighestValueAssetOptions,
  type UserAsset,
  type UserAssetsParams,
  type UserAssetsState,
} from './types';
import { userAssetsStoreManager } from './userAssetsStoreManager';

// ============ Fetch Utils ==================================================== //

const EMPTY_USER_ASSETS: UserAsset[] = [];

export async function fetchUserAssets(params: UserAssetsParams, abortController: AbortController | null): Promise<UserAsset[] | null> {
  if (!params.address) return null;

  const { address, currency, testnetMode } = params;
  if (testnetMode) return fetchAnvilUserAssets(address);

  try {
    const chainIds = useBackendNetworksStore.getState().getSupportedChainIds();
    const res = await getPlatformClient().get<GetAssetsResponse>('/assets/GetAssetUpdates', {
      abortController,
      params: { currency: currency, chainIds: chainIds.join(','), address: address },
      timeout: time.seconds(isStaging() ? 40 : 20),
    });

    if (res.data.errors?.length) {
      logger.error(new RainbowError('[🔴 userAssetsStore - fetchUserAssets 🔴]: Failed to fetch user assets'), {
        errors: res.data.errors,
      });
    }

    if (!res.data.result) return EMPTY_USER_ASSETS;

    return filterZeroBalanceAssets(Object.values(res.data.result));
  } catch (e) {
    logger.error(new RainbowError('[🔴 userAssetsStore - fetchUserAssets 🔴]: Failed to fetch user assets', e));
  }

  return null;
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
    for (const asset of state.userAssets.values()) if (!chains.has(asset.chainId)) allAssets.push(asset);
  }

  for (const asset of userAssets) allAssets.push(transformUserAssetToParsedSearchAsset(asset));
  allAssets.sort((a, b) => (Number(b.native.balance.amount) || 0) - (Number(a.native.balance.amount) || 0));

  const parsedAssets = new Map<UniqueId, ParsedSearchAsset>();
  for (const asset of allAssets) parsedAssets.set(asset.uniqueId, asset);

  return { userAssets: parsedAssets, chainBalances: getChainBalances(parsedAssets) };
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
  const asset = userAsset.asset;
  const uniqueId = getUniqueId(asset.address, asset.chainId);

  const { decimals = 0, symbol = '', price } = asset;
  const amount = convertRawAmountToDecimalFormat(userAsset.quantity, decimals);
  const nativeBalance = convertAmountAndPriceToNativeDisplay(1, userAsset.value, currency);
  const networks: ParsedSearchAsset['networks'] = {};

  for (const chain in asset.networks) {
    const chainId = Number(chain);
    const network = asset.networks[chainId];
    if (network) networks[chainId] = { address: network.address, decimals: network.decimals ?? 0 };
  }

  return {
    uniqueId,
    address: asset.address,
    chainId: asset.chainId,
    chainName: asset.network ?? '',
    colors: asset.colors,
    decimals,
    icon_url: asset.iconUrl,
    isNativeAsset: isNativeAsset(asset.address, asset.chainId),
    isVerified: asset.verified ?? false,
    mainnetAddress: asset.mainnetAddress,
    name: asset.name ?? '',
    networks,
    symbol,
    price: {
      changed_at: price.changedAt ? toUnixTime(price.changedAt) : undefined,
      relative_change_24h: price.relativeChange24h ?? 0,
      value: price.value ?? 0,
    },
    smallBalance: userAsset.smallBalance,
    bridging: {
      isBridgeable: asset.bridging?.bridgeable ?? false,
      networks: asset.bridging?.networks ?? {},
    },
    balance: {
      amount,
      display: convertAmountToBalanceDisplay(amount, { decimals, symbol }),
    },
    native: {
      balance: nativeBalance,
      price: {
        change: String(price.relativeChange24h ?? 0),
        amount: price.value ?? 0,
        display: convertAmountToNativeDisplayWorklet(price.value ?? 0, currency),
      },
    },
    updatedAt: userAsset.updatedAt,
    // These are required in the type, but the new platform endpoint does not return them.
    highLiquidity: false,
    isRainbowCurated: false,
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
  if (balance === hiddenAssetBalances[address]) return;

  setHiddenAssetBalance(address, balance);
}

export function filterZeroBalanceAssets(assets: UserAsset[]): UserAsset[] {
  return assets.filter(asset => greaterThan(asset.quantity, 0));
}
