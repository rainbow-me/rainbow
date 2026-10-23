import { createQueryStore } from '@storesjs/stores';

import { useViewedTokenStore } from '@/features/token/data/stores/viewedTokenStore';
import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';
import { getPlatformClient } from '@/resources/platform/client';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

import { type TokenAcquisition } from '../core/unrealizedPnl';

export type TokenAcquisitionParams = {
  walletAddress: string | null;
  /** `null` when no token is viewed or it is a perps market. */
  codexTokenId: string | null;
};

type FilterTokenWalletsResponse = {
  data?: { filterTokenWallets: { results: TokenAcquisition[] } };
  errors?: { message: string }[];
};

const FILTER_TOKEN_WALLETS_QUERY = `query FilterTokenWallets($wallet: String!, $tokenId: String!) {
  filterTokenWallets(input: { wallets: [$wallet], tokenIds: [$tokenId], limit: 1 }) {
    results {
      purchasedTokenBalance
      tokenAcquisitionCostUsd
    }
  }
}`;

/**
 * Codex's swap-acquisition data for the current wallet and the viewed token.
 */
export const useTokenAcquisitionStore = createQueryStore<TokenAcquisition | null, TokenAcquisitionParams>({
  fetcher: fetchTokenAcquisition,
  params: {
    walletAddress: $ => $(userAssetsStoreManager).address,
    // Codex network ids are EVM chain ids
    codexTokenId: $ =>
      $(useViewedTokenStore, ({ token }) => (token && typeof token !== 'string' ? `${token.address}:${token.chainId}` : null)),
  },
  staleTime: time.minutes(5),
  cacheTime: time.hours(1),
});

async function fetchTokenAcquisition(
  { walletAddress, codexTokenId }: TokenAcquisitionParams,
  abortController: AbortController | null
): Promise<TokenAcquisition | null> {
  if (!walletAddress || !codexTokenId) return null;
  try {
    const { data } = await getPlatformClient().post<FilterTokenWalletsResponse>(
      '/proxy/codex',
      {
        query: FILTER_TOKEN_WALLETS_QUERY,
        variables: { wallet: walletAddress, tokenId: codexTokenId },
      },
      { abortController, timeout: time.seconds(15) }
    );

    if (data.errors?.length || !data.data) throw new Error(data.errors?.[0]?.message ?? 'Missing data');

    return data.data.filterTokenWallets.results[0] ?? null;
  } catch (error) {
    logger.error(new RainbowError('[tokenAcquisitionStore] Codex filterTokenWallets failed', error), { codexTokenId });
    throw error;
  }
}
