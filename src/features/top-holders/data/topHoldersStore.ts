import { createDerivedStore, createQueryStore, shallowEqual } from '@storesjs/stores';
import { getAddress } from 'viem';

import { TOP_HOLDERS } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { DEFAULT_CONFIG, useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { resolveEnsName } from '@/features/ens/data/ens';
import { ChainId } from '@/features/network/types/backendNetworks';
import { usePnlEligibleToken } from '@/features/spot-pnl/data/pnlEligibleTokenStore';
import { WALLET_TOKEN_TRADES_FIELDS } from '@/features/spot-pnl/data/tokenTradesStore';
import { divWorklet, powWorklet } from '@/framework/core/safeMath';
import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';
import { getCodexTokenId, postCodex } from '@/resources/platform/codex';

import {
  isHolderWalletFilter,
  rankHolding,
  rankRealized,
  rankUnrealized,
  TOP_HOLDERS_LIMIT,
  type HolderWalletFilter,
  type TokenHolder,
  type TokenTrader,
  type TopHolders,
} from '../core/topHolders';

type NamedTopHolders = TopHolders & { names: Record<string, string> };

export type TopHoldersParams = {
  /** `null` when the viewed token is not P&L-eligible. */
  token: { address: string; chainId: ChainId } | null;
  filter: HolderWalletFilter;
};

type TradersResponse = { results: TokenTrader[] };

type TopHoldersResponse = {
  holders: {
    status: 'ENABLED' | 'DISABLED';
    items: {
      address: string;
      /** Raw integer amount. */
      balance: string;
      wallet: { category: string | null; identityLabels: string[] | null } | null;
    }[];
  };
  token: { decimals: number; info: { totalSupply: string | null } | null } | null;
  prices: ({ priceUsd: number | null } | null)[];
  unrealized: TradersResponse;
  realized: TradersResponse;
};

/** Codex's maximum page size. */
const CODEX_PAGE_SIZE = 200;

// Codex can't rank traders by unrealized P&L, which depends on the price, so the largest bought positions are ranked locally
const TOP_HOLDERS_QUERY = `query TopHolders($tokenId: String!, $address: String!, $networkId: Int!, $excludeLabels: [String]) {
  holders(input: { tokenId: $tokenId, limit: ${CODEX_PAGE_SIZE}, sort: { attribute: BALANCE, direction: DESC } }) {
    status
    items {
      address
      balance
      wallet {
        category
        identityLabels
      }
    }
  }
  token(input: { address: $address, networkId: $networkId }) {
    decimals
    info {
      totalSupply
    }
  }
  prices: getTokenPrices(inputs: [{ address: $address, networkId: $networkId }]) {
    priceUsd
  }
  unrealized: filterTokenWallets(
    input: {
      tokenIds: [$tokenId]
      limit: ${CODEX_PAGE_SIZE}
      excludeLabels: $excludeLabels
      rankings: [{ attribute: purchasedTokenBalance, direction: DESC }]
      filtersV2: { purchasedTokenBalance: { gt: 0 }, tokenBalance: { gt: 0 }, tokenAcquisitionCostUsd: { gt: 0 } }
    }
  ) {
    results {
      address
      ${WALLET_TOKEN_TRADES_FIELDS}
    }
  }
  realized: filterTokenWallets(
    input: {
      tokenIds: [$tokenId]
      limit: ${TOP_HOLDERS_LIMIT}
      excludeLabels: $excludeLabels
      rankings: [{ attribute: realizedProfitUsd1y, direction: DESC }]
      filtersV2: { tokenAmountSold1y: { gt: 0 } }
    }
  ) {
    results {
      address
      ${WALLET_TOKEN_TRADES_FIELDS}
    }
  }
}`;

export const useTopHoldersEnabledStore = createDerivedStore($ => {
  const remoteEnabled = $(useRemoteConfigStore, state => state.getRemoteConfigKey('top_holders_enabled'));
  const experimentalEnabled = $(useExperimentalConfigStore, state => state.getFlag(TOP_HOLDERS));
  return remoteEnabled || experimentalEnabled;
});

/**
 * The viewed token's Top Holders lists. Holding ranks Codex's top {@link CODEX_PAGE_SIZE} holders; Unrealized ranks
 * the {@link CODEX_PAGE_SIZE} largest bought positions still held. `null` when no list has a row.
 */
export const useTopHoldersStore = createQueryStore<NamedTopHolders | null, TopHoldersParams>({
  fetcher: fetchTopHolders,
  // Gated on the flags alone: an ineligible token leaves `token` null, which fetches nothing
  enabled: $ => $(useTopHoldersEnabledStore),
  params: {
    token: $ => $(usePnlEligibleToken, token => (token ? { address: token.address, chainId: token.chainId } : null), shallowEqual),
    filter: $ =>
      $(useRemoteConfigStore, state => {
        const filter = state.getRemoteConfigKey('top_holders_wallet_filter');
        return isHolderWalletFilter(filter) ? filter : DEFAULT_CONFIG.top_holders_wallet_filter;
      }),
  },
  staleTime: time.minutes(5),
  cacheTime: time.hours(1),
});

async function fetchTopHolders(
  { token, filter }: TopHoldersParams,
  abortController: AbortController | null
): Promise<NamedTopHolders | null> {
  if (!token) return null;
  const tokenId = getCodexTokenId(token.address, token.chainId);
  try {
    const response = await postCodex<TopHoldersResponse>(
      TOP_HOLDERS_QUERY,
      { tokenId, address: token.address, networkId: token.chainId, excludeLabels: filter.excludedLabels },
      abortController
    );
    const topHolders = rankTopHolders(response, filter);
    const addresses = [...new Set(Object.values(topHolders).flatMap(rows => rows.map(row => row.address.toLowerCase())))];
    if (!addresses.length) return null;

    const resolved = await Promise.allSettled(
      addresses.map(async address => resolveEnsName(getAddress(address), ChainId.mainnet, abortController?.signal))
    );
    const names: Record<string, string> = {};
    for (let i = 0; i < addresses.length; i++) {
      const result = resolved[i];
      if (result.status === 'fulfilled' && result.value) names[addresses[i]] = result.value;
    }
    return { ...topHolders, names };
  } catch (error) {
    logger.error(new RainbowError('[topHoldersStore] Codex top holders fetch failed', error), { tokenId });
    throw error;
  }
}

function rankTopHolders({ holders, token, prices, unrealized, realized }: TopHoldersResponse, filter: HolderWalletFilter): TopHolders {
  const priceUsd = prices[0]?.priceUsd;
  const hasPrice = priceUsd != null && priceUsd > 0;
  const hasHolders = holders.status === 'ENABLED' && !!token;
  const unit = token ? powWorklet(10, token.decimals) : '1';

  return {
    holding:
      hasPrice && hasHolders
        ? rankHolding(
            {
              holders: holders.items.map(
                (item): TokenHolder => ({
                  address: item.address,
                  balance: divWorklet(item.balance, unit),
                  category: item.wallet?.category ?? null,
                  identityLabels: item.wallet?.identityLabels ?? [],
                })
              ),
              priceUsd: String(priceUsd),
              totalSupply: token.info?.totalSupply ?? '0',
              traders: [...unrealized.results, ...realized.results],
            },
            filter
          )
        : [],
    unrealized: hasPrice ? rankUnrealized(unrealized.results, String(priceUsd)) : [],
    realized: rankRealized(realized.results),
  };
}
