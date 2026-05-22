import { type NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { IS_TEST } from '@/env';
import { createPlacementStore } from '@/features/placements/stores/factories/createPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type PlacementId, type PlacementItem } from '@/features/placements/types';
import { fetchExternalToken, type FormattedExternalAsset } from '@/resources/assets/externalAssetsQuery';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { type ChainId } from '@/state/backendNetworks/types';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

// ============ Types ========================================================== //

export type TokenPlacementItem = PlacementItem & {
  asset: FormattedExternalAsset;
};

type TokenRefsParams = {
  currency: NativeCurrencyKey;
  tokenRefs: string[];
};

type TokenAssetsByRef = Record<string, FormattedExternalAsset>;

// ============ Constants ====================================================== //

const EMPTY_TOKEN_ASSETS_BY_REF: TokenAssetsByRef = {};
const EMPTY_TOKEN_PLACEMENT_ITEMS: TokenPlacementItem[] = [];
const storesByPlacementId = new Map<PlacementId, ReturnType<typeof createTokensPlacementStore>>();

// ============ Stores ========================================================= //

export const useTokensEnabled = createDerivedStore<boolean>(
  $ => {
    const hasTokenRefsOrPendingPlacements = $(usePlacementsStore, hasTokenRefsOrPendingPlacementsHydration);

    return hasTokenRefsOrPendingPlacements && !IS_TEST;
  },
  { fastMode: true }
);

export const useTokenRefsStore = createQueryStore<TokenAssetsByRef, TokenRefsParams>({
  fetcher: fetchTokenRefs,
  enabled: $ => $(useTokensEnabled),
  params: {
    currency: $ => $(userAssetsStoreManager, state => state.currency),
    tokenRefs: $ => $(usePlacementsStore, state => state.getAllRefIds({ source: 'rainbow', type: 'token' })),
  },
  keepPreviousData: true,
  staleTime: time.minutes(2),
  cacheTime: time.minutes(10),
});

export function getTokensPlacementStore(placementId: PlacementId) {
  let store = storesByPlacementId.get(placementId);
  if (!store) {
    store = createTokensPlacementStore(placementId);
    storesByPlacementId.set(placementId, store);
  }
  return store;
}

// ============ Fetcher ======================================================== //

async function fetchTokenRefs({ currency, tokenRefs }: TokenRefsParams): Promise<TokenAssetsByRef> {
  if (!tokenRefs.length) return EMPTY_TOKEN_ASSETS_BY_REF;

  const results = await Promise.allSettled(tokenRefs.map(tokenRef => fetchTokenRef(tokenRef, currency)));
  const assetsByRef: TokenAssetsByRef = {};

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      assetsByRef[result.value.tokenRef] = result.value.asset;
    }
  }

  return Object.keys(assetsByRef).length ? assetsByRef : EMPTY_TOKEN_ASSETS_BY_REF;
}

async function fetchTokenRef(tokenRef: string, currency: TokenRefsParams['currency']) {
  const params = parseTokenRef(tokenRef);
  if (!params) return null;

  const asset = await fetchExternalToken({ ...params, currency });
  return asset ? { asset, tokenRef } : null;
}

// ============ Utilities ====================================================== //

function createTokensPlacementStore(placementId: PlacementId) {
  return createPlacementStore({
    placementId,
    source: 'rainbow',
    enabled: useTokensEnabled,
    select: ($, placementItems) => {
      const assetsByRef = $(useTokenRefsStore, state => state.getData());
      const isLoading = $(useTokenRefsStore, state => state.enabled && state.getStatus('isInitialLoad'));

      return {
        isLoading,
        items: assetsByRef ? parseTokenItems(placementItems, assetsByRef) : EMPTY_TOKEN_PLACEMENT_ITEMS,
      };
    },
  });
}

function parseTokenItems(placementItems: PlacementItem[], assetsByRef: TokenAssetsByRef): TokenPlacementItem[] {
  const items: TokenPlacementItem[] = [];

  for (const item of placementItems) {
    const asset = assetsByRef[item.id];
    if (asset) items.push({ ...item, asset });
  }

  return items.length ? items : EMPTY_TOKEN_PLACEMENT_ITEMS;
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

function hasTokenRefsOrPendingPlacementsHydration(state: ReturnType<typeof usePlacementsStore.getState>): boolean {
  if (state.getAllRefIds({ source: 'rainbow', type: 'token' }).length > 0) return true;
  return state.getStatus('isIdle') || state.getStatus('isInitialLoad');
}
