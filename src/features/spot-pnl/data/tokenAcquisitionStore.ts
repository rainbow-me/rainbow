import { createQueryStore } from '@storesjs/stores';

import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';
import { getPlatformClient } from '@/resources/platform/client';

import { type TokenAcquisition } from '../core/unrealizedPnl';

export type TokenAcquisitionParams = {
  walletAddress: string;
  tokenAddress: string;
  chainId: number;
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
 * Codex's swap-acquisition data for one wallet and token. Params are supplied per fetch by the screen showing the
 * token, so the store never fetches on its own.
 */
export const useTokenAcquisitionStore = createQueryStore<TokenAcquisition | null, TokenAcquisitionParams>({
  fetcher: fetchTokenAcquisition,
  enabled: false,
  staleTime: time.minutes(5),
  cacheTime: time.hours(1),
});

async function fetchTokenAcquisition(
  { walletAddress, tokenAddress, chainId }: TokenAcquisitionParams,
  abortController: AbortController | null
): Promise<TokenAcquisition | null> {
  try {
    const { data } = await getPlatformClient().post<FilterTokenWalletsResponse>(
      '/proxy/codex',
      {
        query: FILTER_TOKEN_WALLETS_QUERY,
        // Codex network ids are EVM chain ids
        variables: { wallet: walletAddress, tokenId: `${tokenAddress}:${chainId}` },
      },
      { abortController, timeout: time.seconds(15) }
    );

    if (data.errors?.length || !data.data) throw new Error(data.errors?.[0]?.message ?? 'Missing data');

    return data.data.filterTokenWallets.results[0] ?? null;
  } catch (error) {
    // The store neither records nor logs failures of `skipStoreUpdates` fetches
    logger.error(new RainbowError('[tokenAcquisitionStore] Codex filterTokenWallets failed', error), { tokenAddress, chainId });
    throw error;
  }
}
