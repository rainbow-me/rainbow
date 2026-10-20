import { createDerivedStore, createQueryStore, type QueryStoreConfig } from '@storesjs/stores';

import { getUniqueId } from '@/entities/assetId';
import { useChartsStore } from '@/features/charts/stores/chartsStore';
import { isHyperliquidToken } from '@/features/charts/utils';
import { SPOT_PNL } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';
import { getCodexTokenId, postCodex } from '@/resources/platform/codex';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

import { type TokenTrades } from '../core/spotPnl';

export type WalletTokenTrades = TokenTrades & {
  /** Token units the wallet holds now. */
  tokenBalanceLive: string;
};

export type TokenTradesParams = {
  walletAddress: string | null;
  codexTokenId: string | null;
  /** Not sent: keys the cache to the position, so a trade refetches the cost basis instead of pairing the new balance with the old one. */
  heldBalance: string | null;
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

/**
 * The viewed token's Codex token id while spot P&L is enabled, or `null` when it is disabled, no token is viewed,
 * or the viewed token is a perps market.
 */
export const useSpotPnlTokenId = createDerivedStore(
  $ => {
    const token = $(useChartsStore, state => state.token);
    const remoteEnabled = $(useRemoteConfigStore, state => state.getRemoteConfigKey('spot_pnl_enabled'));
    const experimentalEnabled = $(useExperimentalConfigStore, state => state.getFlag(SPOT_PNL));

    if (!remoteEnabled && !experimentalEnabled) return null;
    if (!token || isHyperliquidToken(token)) return null;

    return getCodexTokenId(token.address, token.chainId);
  },
  { lockDependencies: true }
);

/**
 * The current wallet's balance of the viewed token, or `null` when it holds none or the viewed token is a perps market.
 */
const useViewedTokenBalance = createDerivedStore(
  $ => {
    const token = $(useChartsStore, state => state.token);
    const userAssets = $(useUserAssetsStore, state => state.userAssets);

    if (!token || isHyperliquidToken(token)) return null;
    return userAssets.get(getUniqueId(token.address, token.chainId))?.balance.amount ?? null;
  },
  { lockDependencies: true }
);

/** Codex's swap trades for a wallet and a token. */
export function createTokenTradesStore(config: Pick<QueryStoreConfig<WalletTokenTrades | null, TokenTradesParams>, 'enabled' | 'params'>) {
  return createQueryStore<WalletTokenTrades | null, TokenTradesParams>({
    ...config,
    fetcher: fetchTokenTrades,
    staleTime: time.minutes(5),
    cacheTime: time.hours(1),
  });
}

/** The current wallet's trades in the viewed token. */
export const useTokenTradesStore = createTokenTradesStore({
  enabled: $ => $(useSpotPnlTokenId, Boolean),
  params: {
    walletAddress: $ => $(userAssetsStoreManager).address,
    codexTokenId: $ => $(useSpotPnlTokenId),
    heldBalance: $ => $(useViewedTokenBalance),
  },
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
    if (!abortController?.signal.aborted) {
      logger.error(new RainbowError('[tokenTradesStore] Codex filterTokenWallets failed', error), { codexTokenId });
    }
    throw error;
  }
}
