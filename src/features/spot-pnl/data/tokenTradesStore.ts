import { createQueryStore, type QueryStoreConfig } from '@storesjs/stores';

import { useViewedTokenStore } from '@/features/token/data/stores/viewedTokenStore';
import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';
import { getCodexTokenId, postCodex } from '@/resources/platform/codex';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

import { type TokenTrades } from '../core/spotPnl';

export type WalletTokenTrades = TokenTrades & {
  /** Token units the wallet holds now. */
  tokenBalanceLive: string;
};

export type TokenTradesParams = {
  walletAddress: string | null;
  /** `null` when no token is viewed or it is a perps market. */
  codexTokenId: string | null;
};

type FilterTokenWalletsResponse = {
  filterTokenWallets: { results: (WalletTokenTrades & { address: string })[] };
};

const FILTER_TOKEN_WALLETS_QUERY = `query FilterTokenWallets($wallets: [String], $tokenId: String!, $limit: Int!) {
  filterTokenWallets(input: { wallets: $wallets, tokenIds: [$tokenId], limit: $limit }) {
    results {
      address
      purchasedTokenBalance
      tokenAcquisitionCostUsd
      tokenAmountSold1y
      amountSoldUsd1y
      realizedProfitUsd1y
      lastTransactionAt
      tokenBalanceLive
    }
  }
}`;

/** Codex's swap trades for a wallet and a token. */
export function createTokenTradesStore(params: QueryStoreConfig<WalletTokenTrades | null, TokenTradesParams>['params']) {
  return createQueryStore<WalletTokenTrades | null, TokenTradesParams>({
    fetcher: fetchTokenTrades,
    params,
    staleTime: time.minutes(5),
    cacheTime: time.hours(1),
  });
}

/** The current wallet's trades in the viewed token. */
export const useTokenTradesStore = createTokenTradesStore({
  walletAddress: $ => $(userAssetsStoreManager).address,
  codexTokenId: $ =>
    $(useViewedTokenStore, ({ token }) => (token && typeof token !== 'string' ? getCodexTokenId(token.address, token.chainId) : null)),
});

/** Codex's trades in one token for each of `wallets` that has any, keyed by lowercased address. At most 200 wallets. */
export async function fetchWalletsTokenTrades(
  wallets: string[],
  codexTokenId: string,
  abortController: AbortController | null
): Promise<Map<string, WalletTokenTrades>> {
  const { filterTokenWallets } = await postCodex<FilterTokenWalletsResponse>(
    FILTER_TOKEN_WALLETS_QUERY,
    { wallets, tokenId: codexTokenId, limit: wallets.length },
    abortController
  );
  return new Map(filterTokenWallets.results.map(({ address, ...trades }) => [address.toLowerCase(), trades]));
}

async function fetchTokenTrades(
  { walletAddress, codexTokenId }: TokenTradesParams,
  abortController: AbortController | null
): Promise<WalletTokenTrades | null> {
  if (!walletAddress || !codexTokenId) return null;
  try {
    const tradesByWallet = await fetchWalletsTokenTrades([walletAddress], codexTokenId, abortController);
    return tradesByWallet.get(walletAddress.toLowerCase()) ?? null;
  } catch (error) {
    logger.error(new RainbowError('[tokenTradesStore] Codex filterTokenWallets failed', error), { codexTokenId });
    throw error;
  }
}
