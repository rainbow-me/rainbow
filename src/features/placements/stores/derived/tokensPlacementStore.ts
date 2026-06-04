import { useMemo } from 'react';

import { isAddress, type Address } from 'viem';

import { type NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { finalizePlacementResult, pairPlacementItems } from '@/features/placements/stores/derived/finalizePlacementResult';
import { hasRefsOrPendingHydration } from '@/features/placements/stores/derived/hasRefsOrPendingHydration';
import {
  isPlacementHydrating,
  selectPlacementItemsBySource,
  usePlacementsStore,
  type PlacementResult,
} from '@/features/placements/stores/placementsStore';
import { useDiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import { type PlacementId, type PlacementItem } from '@/features/placements/types';
import { mapWithConcurrency } from '@/framework/core/utils/mapWithConcurrency';
import { time } from '@/framework/core/utils/time';
import { fetchExternalToken, type FormattedExternalAsset } from '@/resources/assets/externalAssetsQuery';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { isValidChainId, type ChainId } from '@/state/backendNetworks/types';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { shallowEqual } from '@/worklets/comparisons';

// ============ Types ========================================================== //

export type TokenPlacementItem = PlacementItem & {
  asset: FormattedExternalAsset;
};

type TokenRefsParams = {
  currency: NativeCurrencyKey;
  tokenRefs: string[];
};

type TokenAssetsByRef = Record<string, FormattedExternalAsset>;
type TokenRefCacheEntry = {
  asset: FormattedExternalAsset | null;
  fetchedAt: number;
};
type TokenRefFetchResult = {
  asset: FormattedExternalAsset | null;
  tokenRef: string;
};

// ============ Constants ====================================================== //

const TOKEN_REF_FETCH_CONCURRENCY = 4;
const TOKEN_REFS_STALE_TIME = time.minutes(2);
// Keep object identity stable for Object.is store selectors; arrays are compared structurally downstream.
const EMPTY_TOKEN_ASSETS_BY_REF: TokenAssetsByRef = Object.freeze({});
const hasTokenRefsOrPendingHydration = hasRefsOrPendingHydration('rainbow', 'token');
const tokenRefCache = new Map<string, TokenRefCacheEntry>();

// ============ Stores ========================================================= //

const useTokensEnabled = createDerivedStore<boolean>(
  $ => {
    return hasTokenRefsOrPendingHydration($);
  },
  { fastMode: true }
);

export const useTokenRefsStore = createQueryStore<TokenAssetsByRef, TokenRefsParams>({
  fetcher: fetchTokenRefs,
  enabled: $ => $(useTokensEnabled),
  params: {
    currency: $ => $(userAssetsStoreManager, state => state.currency),
    tokenRefs: $ => $(useDiscoverSurfacePlacementRefs, refs => refs.rainbow),
  },
  keepPreviousData: true,
  staleTime: TOKEN_REFS_STALE_TIME,
  cacheTime: time.minutes(10),
});

// ============ Fetcher ======================================================== //

async function fetchTokenRefs(
  { currency, tokenRefs }: TokenRefsParams,
  abortController: AbortController | null
): Promise<TokenAssetsByRef> {
  if (!tokenRefs.length) return EMPTY_TOKEN_ASSETS_BY_REF;

  const now = Date.now();
  const assetsByRef: TokenAssetsByRef = {};
  const staleTokenRefs: string[] = [];

  for (const tokenRef of tokenRefs) {
    const cached = tokenRefCache.get(getTokenRefCacheKey(tokenRef, currency));
    if (cached && now - cached.fetchedAt < TOKEN_REFS_STALE_TIME) {
      if (cached.asset) assetsByRef[tokenRef] = cached.asset;
    } else {
      staleTokenRefs.push(tokenRef);
    }
  }

  const results = await mapWithConcurrency(staleTokenRefs, TOKEN_REF_FETCH_CONCURRENCY, tokenRef =>
    fetchTokenRef(tokenRef, currency, abortController)
  );
  const fetchedAt = Date.now();

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      const { asset, tokenRef } = result.value;
      tokenRefCache.set(getTokenRefCacheKey(tokenRef, currency), { asset, fetchedAt });
      if (asset) assetsByRef[tokenRef] = asset;
    }
  }

  return Object.keys(assetsByRef).length ? assetsByRef : EMPTY_TOKEN_ASSETS_BY_REF;
}

async function fetchTokenRef(
  tokenRef: string,
  currency: TokenRefsParams['currency'],
  abortController: AbortController | null
): Promise<TokenRefFetchResult> {
  const params = parseTokenRef(tokenRef);
  if (!params) return { asset: null, tokenRef };

  const asset = await fetchExternalToken({ ...params, abortController, currency });
  return { asset, tokenRef };
}

// ============ Utilities ====================================================== //

export function useTokensPlacement(placementId: PlacementId): PlacementResult<TokenPlacementItem> {
  const enabled = useTokensEnabled();
  const placement = usePlacementsStore(state => state.getPlacement(placementId));
  const placementItems = usePlacementsStore(state => selectPlacementItemsBySource(state, placementId, 'rainbow'), shallowEqual);
  const placementsLoading = usePlacementsStore(state => isPlacementHydrating(state, placementId, 'rainbow'));
  const assetsByRef = useTokenRefsStore(state => state.getData());
  const tokenRefsLoading = useTokenRefsStore(state => {
    return placementItems.length > 0 && state.enabled && (state.getStatus('isIdle') || state.getStatus('isLoading'));
  });
  const items = useMemo(() => (assetsByRef ? parseTokenItems(placementItems, assetsByRef) : []), [assetsByRef, placementItems]);

  return useMemo(
    () =>
      finalizePlacementResult({
        enabled,
        hasRefs: placementItems.length > 0,
        isInitialLoad: placementsLoading || tokenRefsLoading,
        items,
        placement,
      }),
    [enabled, items, placement, placementItems.length, placementsLoading, tokenRefsLoading]
  );
}

function parseTokenItems(placementItems: PlacementItem[], assetsByRef: TokenAssetsByRef): TokenPlacementItem[] {
  return pairPlacementItems(
    placementItems,
    id => assetsByRef[id],
    (item, asset) => ({ ...item, asset })
  );
}

// CMS authors token refs as colon-delimited `address:chainId`, distinct from the app's
// underscore-delimited `UniqueId` (`address_chainId`) — they are not interchangeable.
function parseTokenRef(tokenRef: string): { address: Address; chainId: ChainId } | null {
  const parts = tokenRef.split(':');
  if (parts.length !== 2) return null;

  const [address, chainId] = parts;
  const numericChainId = Number(chainId);

  if (!address || !isAddress(address) || !isValidChainId(numericChainId)) return null;

  return {
    address,
    chainId: numericChainId,
  };
}

function getTokenRefCacheKey(tokenRef: string, currency: NativeCurrencyKey): string {
  return `${currency}:${tokenRef}`;
}
