import { useMemo } from 'react';

import { type NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { IS_TEST } from '@/env';
import { hasRefsOrPendingHydration } from '@/features/placements/stores/derived/hasRefsOrPendingHydration';
import {
  isPlacementHydrating,
  selectPlacementItemsBySource,
  usePlacementsStore,
  type PlacementResult,
} from '@/features/placements/stores/placementsStore';
import { useDiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/hooks/useSurface';
import { type PlacementId, type PlacementItem } from '@/features/placements/types';
import { fetchExternalToken, type FormattedExternalAsset } from '@/resources/assets/externalAssetsQuery';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { type ChainId } from '@/state/backendNetworks/types';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
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
    return hasTokenRefsOrPendingHydration($) && !IS_TEST;
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

  return useMemo(() => {
    if (!enabled) return { isLoading: false, items: [], placement: undefined };

    const isLoading = placementsLoading || (tokenRefsLoading && placement !== undefined && items.length === 0);
    return {
      isLoading,
      items,
      placement: items.length ? placement : undefined,
    };
  }, [enabled, items, placement, placementsLoading, tokenRefsLoading]);
}

function parseTokenItems(placementItems: PlacementItem[], assetsByRef: TokenAssetsByRef): TokenPlacementItem[] {
  const items: TokenPlacementItem[] = [];

  for (const item of placementItems) {
    const asset = assetsByRef[item.id];
    if (asset) items.push({ ...item, asset });
  }

  return items.length ? items : [];
}

function parseTokenRef(tokenRef: string): { address: string; chainId: ChainId } | null {
  const [address, chainId] = tokenRef.split(':');
  const numericChainId = Number(chainId);

  if (!address || !Number.isInteger(numericChainId)) return null;

  return {
    address,
    chainId: numericChainId as ChainId,
  };
}

function getTokenRefCacheKey(tokenRef: string, currency: NativeCurrencyKey): string {
  return `${currency}:${tokenRef}`;
}

async function mapWithConcurrency<T, Result>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<Result>
): Promise<PromiseSettledResult<Result>[]> {
  if (!items.length) return [];

  const results: PromiseSettledResult<Result>[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;

      try {
        results[index] = {
          status: 'fulfilled',
          value: await mapper(items[index]),
        };
      } catch (reason) {
        results[index] = {
          reason,
          status: 'rejected',
        };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}
