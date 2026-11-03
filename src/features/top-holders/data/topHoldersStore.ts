import { createDerivedStore, createQueryStore, nullObject, shallowEqual } from '@storesjs/stores';
import { getAddress } from 'viem';

import { TOP_HOLDERS } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { DEFAULT_CONFIG, useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { resolveEnsName } from '@/features/ens/data/ens';
import { ChainId } from '@/features/network/types/backendNetworks';
import { usePnlEligibleToken } from '@/features/spot-pnl/data/pnlEligibleTokenStore';
import { WALLET_TOKEN_TRADES_FIELDS } from '@/features/spot-pnl/data/tokenTradesStore';
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

export type TopHoldersParams = {
  /** `null` when the viewed token is not P&L-eligible. */
  token: { address: string; chainId: ChainId } | null;
  filter: HolderWalletFilter;
};

type TradersResponse = { results: TokenTrader[] };

type TopHoldersResponse = {
  holders: {
    status: 'ENABLED' | 'DISABLED';
    items: TokenHolder[];
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
 * The viewed token's Top Holders lists. Holding ranks Codex's top {@link CODEX_PAGE_SIZE} holders; Unrealized
 * ranks the {@link CODEX_PAGE_SIZE} largest bought positions still held. `null` when no list has a row.
 */
export const useTopHoldersStore = createQueryStore<TopHolders | null, TopHoldersParams>({
  fetcher: fetchTopHolders,
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

async function fetchTopHolders({ token, filter }: TopHoldersParams, abortController: AbortController | null): Promise<TopHolders | null> {
  if (!token) return null;
  const tokenId = getCodexTokenId(token.address, token.chainId);
  try {
    const response = await postCodex<TopHoldersResponse>(
      TOP_HOLDERS_QUERY,
      { tokenId, address: token.address, networkId: token.chainId, excludeLabels: filter.excludedLabels },
      abortController
    );

    const topHolders = rankTopHolders(response, filter);
    const nameRequests: Record<string, Promise<string | null> | undefined> = nullObject();
    const pending: Promise<void>[] = [];

    for (const rows of [topHolders.holding, topHolders.unrealized, topHolders.realized]) {
      for (const row of rows) {
        const address = row.address.toLowerCase();
        nameRequests[address] ??= resolveHolderName(address, abortController?.signal);
        pending.push(
          nameRequests[address].then(ensName => {
            if (ensName) row.ensName = ensName;
          })
        );
      }
    }

    if (!pending.length) return null;

    await Promise.all(pending);
    return topHolders;
  } catch (error) {
    logger.error(new RainbowError('[topHoldersStore] Codex top holders fetch failed', error), { tokenId });
    throw error;
  }
}

async function resolveHolderName(address: string, signal?: AbortSignal): Promise<string | null> {
  try {
    return await resolveEnsName(getAddress(address), ChainId.mainnet, signal);
  } catch {
    return null;
  }
}

function rankTopHolders({ holders, token, prices, unrealized, realized }: TopHoldersResponse, filter: HolderWalletFilter): TopHolders {
  const price = prices[0]?.priceUsd;
  const priceUsd = price != null && price > 0 ? String(price) : null;
  const topHolders: TopHolders = {
    holding: [],
    unrealized: priceUsd ? rankUnrealized(unrealized.results, priceUsd) : [],
    realized: rankRealized(realized.results),
  };

  if (priceUsd && token && holders.status === 'ENABLED') {
    const tradesByAddress: Record<string, TokenTrader | undefined> = nullObject();
    for (const traders of [unrealized.results, realized.results]) {
      for (const trader of traders) tradesByAddress[trader.address] = trader;
    }
    topHolders.holding = rankHolding(
      { holders: holders.items, decimals: token.decimals, priceUsd, totalSupply: token.info?.totalSupply ?? '0', tradesByAddress },
      filter
    );
  }

  return topHolders;
}
