import { createDerivedStore, createQueryStore, type QueryStoreConfig } from '@storesjs/stores';

import { getUniqueId } from '@/entities/assetId';
import { useChartsStore } from '@/features/charts/stores/chartsStore';
import { isHyperliquidToken } from '@/features/charts/utils';
import { SPOT_PNL } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';
import { postCodex } from '@/resources/platform/codex';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

import { type WalletTokenTrades } from '../core/spotPnl';
import { usePnlEligibleToken } from './pnlEligibleTokenStore';

export type TokenTradesParams = {
  walletAddress: string | null;
  codexTokenId: string | null;
  /** Not sent: keys the cache to the position, so a trade refetches the cost basis instead of pairing the new balance with the old one. */
  heldBalance: string | null;
};

type FilterTokenWalletsResponse = {
  filterTokenWallets: { results: WalletTokenTrades[] };
};

/** The `filterTokenWallets` result fields that make up {@link WalletTokenTrades}. */
export const WALLET_TOKEN_TRADES_FIELDS = `purchasedTokenBalance
      tokenAcquisitionCostUsd
      tokenAmountSold1y
      amountSoldUsd1y
      realizedProfitUsd1y
      lastTransactionAt
      tokenBalanceLive`;

const FILTER_TOKEN_WALLETS_QUERY = `query FilterTokenWallets($wallets: [String], $tokenId: String!, $limit: Int!) {
  filterTokenWallets(input: { wallets: $wallets, tokenIds: [$tokenId], limit: $limit }) {
    results {
      ${WALLET_TOKEN_TRADES_FIELDS}
    }
  }
}`;

const useSpotPnlEnabledStore = createDerivedStore($ => {
  const remoteEnabled = $(useRemoteConfigStore, state => state.getRemoteConfigKey('spot_pnl_enabled'));
  const experimentalEnabled = $(useExperimentalConfigStore, state => state.getFlag(SPOT_PNL));
  return remoteEnabled || experimentalEnabled;
});

/**
 * The viewed token's Codex token id while spot P&L is enabled, or `null` when it is disabled or the viewed token is
 * not P&L-eligible.
 */
export const useSpotPnlTokenId = createDerivedStore(
  $ => {
    const isEnabled = $(useSpotPnlEnabledStore);
    const codexTokenId = $(usePnlEligibleToken, token => token?.codexTokenId ?? null);
    return isEnabled ? codexTokenId : null;
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
  // Gated on the flags alone: an ineligible token leaves `codexTokenId` null, which fetches nothing
  enabled: $ => $(useSpotPnlEnabledStore),
  params: {
    walletAddress: $ => $(userAssetsStoreManager).address,
    codexTokenId: $ => $(usePnlEligibleToken, token => token?.codexTokenId ?? null),
    heldBalance: $ => $(useViewedTokenBalance),
  },
});

async function fetchTokenTrades(
  { walletAddress, codexTokenId }: TokenTradesParams,
  abortController: AbortController | null
): Promise<WalletTokenTrades | null> {
  if (!walletAddress || !codexTokenId) return null;
  try {
    const { filterTokenWallets } = await postCodex<FilterTokenWalletsResponse>(
      FILTER_TOKEN_WALLETS_QUERY,
      { wallets: [walletAddress], tokenId: codexTokenId, limit: 1 },
      abortController
    );
    return filterTokenWallets.results[0] ?? null;
  } catch (error) {
    if (!abortController?.signal.aborted) {
      logger.error(new RainbowError('[tokenTradesStore] Codex filterTokenWallets failed', error), { codexTokenId });
    }
    throw error;
  }
}
