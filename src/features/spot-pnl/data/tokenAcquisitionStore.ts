import { createDerivedStore, createQueryStore } from '@storesjs/stores';

import { getUniqueId } from '@/entities/assetId';
import { useChartsStore } from '@/features/charts/stores/chartsStore';
import { isHyperliquidToken } from '@/features/charts/utils';
import { SPOT_PNL } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';
import { getPlatformClient } from '@/resources/platform/client';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

import { type TokenAcquisition } from '../core/unrealizedPnl';

export type TokenAcquisitionParams = {
  walletAddress: string | null;
  codexTokenId: string | null;
  /** Not sent: keys the cache to the position, so a trade refetches the cost basis instead of pairing the new balance with the old one. */
  heldBalance: string | null;
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

    // Codex network ids are EVM chain ids
    return `${token.address}:${token.chainId}`;
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

/**
 * Codex's swap-acquisition data for the current wallet and the viewed token.
 */
export const useTokenAcquisitionStore = createQueryStore<TokenAcquisition | null, TokenAcquisitionParams>({
  fetcher: fetchTokenAcquisition,
  enabled: $ => $(useSpotPnlTokenId, Boolean),
  params: {
    walletAddress: $ => $(userAssetsStoreManager).address,
    codexTokenId: $ => $(useSpotPnlTokenId),
    heldBalance: $ => $(useViewedTokenBalance),
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
      // A signal, so the request timeout cannot abort the store's controller: an aborted controller means the store cancelled
      { signal: abortController?.signal, timeout: time.seconds(15) }
    );

    if (data.errors?.length || !data.data) throw new Error(data.errors?.[0]?.message ?? 'Missing data');

    return data.data.filterTokenWallets.results[0] ?? null;
  } catch (error) {
    if (!abortController?.signal.aborted) {
      logger.error(new RainbowError('[tokenAcquisitionStore] Codex filterTokenWallets failed', error), { codexTokenId });
    }
    throw error;
  }
}
