import { createDerivedStore, createQueryStore, shallowEqual } from '@storesjs/stores';

import { useChartsStore } from '@/features/charts/stores/chartsStore';
import { isHyperliquidToken } from '@/features/charts/utils';
import type { NativeCurrencyKey } from '@/features/currency/types';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';
import { isNativeAsset } from '@/handlers/assets';
import { queryClient } from '@/react-query/queryClient';
import {
  EXTERNAL_TOKEN_CACHE_TIME,
  EXTERNAL_TOKEN_STALE_TIME,
  externalTokenQueryFunction,
  externalTokenQueryKey,
  type ExternalTokenQueryFunctionResult,
} from '@/resources/assets/externalAssetsQuery';
import { getCodexTokenId } from '@/resources/platform/codex';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

type ViewedTokenTypeParams = {
  /** `null` when no token is viewed, or it is a perps market or a native asset, which never qualify. */
  token: { address: string; chainId: ChainId } | null;
  currency: NativeCurrencyKey;
};

/**
 * The viewed token's metadata type, read through the expanded sheet's external token query so both share one request
 * and its persisted cache. `null` when the metadata has none.
 */
const useViewedTokenTypeStore = createQueryStore<string | null, ViewedTokenTypeParams>({
  fetcher: fetchViewedTokenType,
  params: {
    token: $ =>
      $(
        useChartsStore,
        ({ token }) =>
          token && !isHyperliquidToken(token) && !isNativeAsset(token.address, token.chainId)
            ? { address: token.address, chainId: token.chainId }
            : null,
        shallowEqual
      ),
    currency: $ => $(userAssetsStoreManager, state => state.currency),
  },
  staleTime: time.hours(1),
  cacheTime: time.hours(1),
});

async function fetchViewedTokenType({ token, currency }: ViewedTokenTypeParams): Promise<string | null> {
  if (!token) return null;
  const queryKey = externalTokenQueryKey({ address: token.address, chainId: token.chainId, currency });
  // A token's type does not change, so any cached copy will do, however stale
  const externalToken =
    queryClient.getQueryData<ExternalTokenQueryFunctionResult>(queryKey) ??
    (await queryClient.fetchQuery(queryKey, externalTokenQueryFunction, {
      staleTime: EXTERNAL_TOKEN_STALE_TIME,
      cacheTime: EXTERNAL_TOKEN_CACHE_TIME,
    }));
  return externalToken?.type ?? null;
}

/**
 * The viewed token while P&L is meaningful for it: its metadata type is known, and it is neither a stablecoin nor a
 * native asset. Independent of feature flags, which each consumer applies itself.
 */
export const usePnlEligibleToken = createDerivedStore(
  $ => {
    const token = $(useChartsStore, state => state.token);
    const type = $(useViewedTokenTypeStore, state => state.getData());

    if (!token || isHyperliquidToken(token) || !type || type === 'stablecoin') return null;
    return { address: token.address, chainId: token.chainId, codexTokenId: getCodexTokenId(token.address, token.chainId) };
  },
  { equalityFn: shallowEqual, lockDependencies: true }
);
