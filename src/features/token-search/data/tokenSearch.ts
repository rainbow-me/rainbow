import { createDerivedStore } from '@storesjs/stores';

import { TOKEN_SEARCH_V2 } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { getPlatformClient } from '@/resources/platform/client';

import { type TokenSearchCategory, type TokenSearchResult } from '../core/tokenSearch';

export type TokenSearchParams = {
  /** Free text, a `$TICKER`, or a contract address. */
  query: string;
  category?: TokenSearchCategory;
  /** Strict filter: only assets deployed on these chains are returned, with only those deployments. */
  chainIds?: ChainId[];
  /** Ranking hint: breaks ties in favor of assets deployed on this chain, and lists that deployment first. */
  preferredChainId?: ChainId;
  /** Maximum items per section, excluding `top`. */
  limit?: number;
};

type TokenSearchResponse = { result: TokenSearchResult };

export const useTokenSearchV2EnabledStore = createDerivedStore($ => {
  const remoteEnabled = $(useRemoteConfigStore, state => state.getRemoteConfigKey('token_search_v2_enabled'));
  const experimentalEnabled = $(useExperimentalConfigStore, state => state.getFlag(TOKEN_SEARCH_V2));
  return remoteEnabled || experimentalEnabled;
});

export async function fetchTokenSearch(
  { query, category, chainIds, preferredChainId, limit }: TokenSearchParams,
  abortController: AbortController | null
): Promise<TokenSearchResult> {
  const params: Record<string, string> = { query };
  if (category) params.category = category;
  if (chainIds?.length) params.chainIds = chainIds.map(toCaip2ChainId).join(',');
  if (preferredChainId) params.preferredChainId = toCaip2ChainId(preferredChainId);
  if (limit) params.limit = String(limit);

  const response = await getPlatformClient().get<TokenSearchResponse>('/search/Search', { abortController, params });
  return response.data.result;
}

function toCaip2ChainId(chainId: ChainId): string {
  return `eip155:${chainId}`;
}
