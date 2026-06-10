import { isAddress, type Address } from 'viem';

import { type NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { type DiscoverPlacementResult } from '@/features/discover/stores/discoverPlacementsStore';
import { useDiscoverSurfacePlacementRefs } from '@/features/discover/stores/discoverSurfaceStore';
import { usePlacementResolver } from '@/features/discover/stores/placementResolvers/usePlacementResolver';
import { type PlacementId, type PlacementItem } from '@/features/placements/types';
import { mapWithConcurrency } from '@/framework/core/utils/mapWithConcurrency';
import { time } from '@/framework/core/utils/time';
import { fetchExternalToken, type FormattedExternalAsset } from '@/resources/assets/externalAssetsQuery';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { type ChainId } from '@/state/backendNetworks/types';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';

// ============ Types ========================================================== //

export type TokenPlacementItem = PlacementItem & {
  asset: FormattedExternalAsset;
};

type TokenRefsParams = {
  currency: NativeCurrencyKey;
  tokenRefs: string[];
};

type TokenAssetsByRef = Record<string, FormattedExternalAsset>;
type TokenRefFetchResult = {
  asset: FormattedExternalAsset | null;
  tokenRef: string;
};

// ============ Constants ====================================================== //

const TOKEN_REF_FETCH_CONCURRENCY = 4;
const TOKEN_REFS_STALE_TIME = time.minutes(2);
// Keep object identity stable for Object.is store selectors; arrays are compared structurally downstream.
const EMPTY_TOKEN_ASSETS_BY_REF: TokenAssetsByRef = Object.freeze({});

// ============ Stores ========================================================= //

const useTokensEnabled = createDerivedStore<boolean>(
  $ => {
    return $(useDiscoverSurfacePlacementRefs, refs => refs.rainbow.length > 0);
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

  const assetsByRef: TokenAssetsByRef = {};
  const supportedAssetChainIds = useBackendNetworksStore.getState().getSupportedAssetsChainIds();
  const results = await mapWithConcurrency(tokenRefs, TOKEN_REF_FETCH_CONCURRENCY, tokenRef =>
    fetchTokenRef(tokenRef, currency, abortController, supportedAssetChainIds)
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      const { asset, tokenRef } = result.value;
      if (asset) assetsByRef[tokenRef] = asset;
    }
  }

  return Object.keys(assetsByRef).length ? assetsByRef : EMPTY_TOKEN_ASSETS_BY_REF;
}

async function fetchTokenRef(
  tokenRef: string,
  currency: TokenRefsParams['currency'],
  abortController: AbortController | null,
  supportedAssetChainIds: readonly ChainId[]
): Promise<TokenRefFetchResult> {
  const params = parseTokenRef(tokenRef, supportedAssetChainIds);
  if (!params) return { asset: null, tokenRef };

  const asset = await fetchExternalToken({ ...params, abortController, currency });
  return { asset, tokenRef };
}

// ============ Utilities ====================================================== //

export function useTokensPlacement(placementId: PlacementId): DiscoverPlacementResult<TokenPlacementItem> {
  const enabled = useTokensEnabled();

  return usePlacementResolver(placementId, {
    enabled,
    pairItem: pairTokenPlacementItem,
    source: 'rainbow',
    useResolvedData: useTokenRefsData,
  });
}

function useTokenRefsData(placementItems: PlacementItem[]) {
  const assetsByRef = useTokenRefsStore(state => state.getData());
  const tokenRefsLoading = useTokenRefsStore(state => {
    return placementItems.length > 0 && state.enabled && (state.getStatus('isIdle') || state.getStatus('isLoading'));
  });
  const tokenRefsError = useTokenRefsStore(state => state.getStatus('isError'));

  return {
    data: assetsByRef ?? undefined,
    isError: tokenRefsError,
    isLoading: tokenRefsLoading,
  };
}

function pairTokenPlacementItem(item: PlacementItem, assetsByRef: TokenAssetsByRef): TokenPlacementItem | undefined {
  const asset = assetsByRef[item.id];
  return asset ? { ...item, asset } : undefined;
}

// CMS authors token refs as colon-delimited `address:chainId`, distinct from the app's
// underscore-delimited `UniqueId` (`address_chainId`) — they are not interchangeable.
function parseTokenRef(tokenRef: string, supportedAssetChainIds: readonly ChainId[]): { address: Address; chainId: ChainId } | null {
  const parts = tokenRef.split(':');
  if (parts.length !== 2) return null;

  const [address, chainId] = parts;
  const numericChainId = Number(chainId);
  const supportedChainId = supportedAssetChainIds.find(chainId => chainId === numericChainId);

  if (!address || !isAddress(address) || supportedChainId === undefined) return null;

  return {
    address,
    chainId: supportedChainId,
  };
}
