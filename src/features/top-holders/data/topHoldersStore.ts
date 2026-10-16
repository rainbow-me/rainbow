import { createDerivedStore, createQueryStore } from '@storesjs/stores';

import { TOP_HOLDERS } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { fetchReverseRecord } from '@/features/ens/utils/handlers';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { type TokenTrades } from '@/features/spot-pnl/core/spotPnl';
import { useViewedTokenStore } from '@/features/token/data/stores/viewedTokenStore';
import { divWorklet, powWorklet } from '@/framework/core/safeMath';
import { mapWithConcurrency } from '@/framework/core/utils/mapWithConcurrency';
import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';
import { getPlatformClient } from '@/resources/platform/client';

import { rankTopHolders, type HolderWalletFilter, type TokenHolder, type TopHolders } from '../core/topHolders';

export type TopHoldersData = TopHolders & {
  /** Lowercased address to ENS name, for the listed holders that have a reverse record. */
  ensNames: Record<string, string>;
};

export type TopHoldersParams = {
  /** `null` when no token is viewed or it is a perps market. */
  token: { address: string; chainId: ChainId } | null;
  filter: HolderWalletFilter;
};

type CodexResponse<T> = { data?: T; errors?: { message: string }[] };

type HoldersResponse = {
  holders: {
    status: 'ENABLED' | 'DISABLED';
    items: {
      address: string;
      /** Raw integer amount. */
      balance: string;
      tokenPriceUsd: string | null;
      wallet: { category: string | null; identityLabels: string[] | null } | null;
    }[];
  };
  token: { decimals: number; info: { totalSupply: string | null } | null } | null;
};

type TokenWalletsResponse = {
  filterTokenWallets: { results: (TokenTrades & { address: string })[] };
};

/** Codex's maximum page size for both queries. */
const HOLDERS_SCANNED = 200;
const NAME_LOOKUP_CONCURRENCY = 6;

const HOLDERS_QUERY = `query TopHolders($tokenId: String!, $address: String!, $networkId: Int!) {
  holders(input: { tokenId: $tokenId, limit: ${HOLDERS_SCANNED}, sort: { attribute: BALANCE, direction: DESC } }) {
    status
    items {
      address
      balance
      tokenPriceUsd
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
}`;

const TOKEN_WALLETS_QUERY = `query TopHolderTrades($wallets: [String], $tokenId: String!) {
  filterTokenWallets(input: { wallets: $wallets, tokenIds: [$tokenId], limit: ${HOLDERS_SCANNED} }) {
    results {
      address
      purchasedTokenBalance
      tokenAcquisitionCostUsd
      tokenAmountSold1y
      amountSoldUsd1y
      realizedProfitUsd1y
      lastTransactionAt
    }
  }
}`;

export const useTopHoldersEnabledStore = createDerivedStore($ => {
  const remoteEnabled = $(useRemoteConfigStore, state => state.getRemoteConfigKey('top_holders_enabled'));
  const experimentalEnabled = $(useExperimentalConfigStore, state => state.getFlag(TOP_HOLDERS));
  return remoteEnabled || experimentalEnabled;
});

/**
 * The viewed token's Top Holders lists, with ENS names for the listed wallets. Codex returns at most
 * {@link HOLDERS_SCANNED} holders, which bounds which holders can rank by profit. `null` when there is no holder to show.
 */
export const useTopHoldersStore = createQueryStore<TopHoldersData | null, TopHoldersParams>({
  fetcher: fetchTopHolders,
  enabled: $ => $(useTopHoldersEnabledStore),
  params: {
    token: $ =>
      $(useViewedTokenStore, ({ token }) =>
        token && typeof token !== 'string' ? { address: token.address, chainId: token.chainId } : null
      ),
    filter: $ => $(useRemoteConfigStore, state => state.getRemoteConfigKey('top_holders_wallet_filter')),
  },
  staleTime: time.minutes(5),
  cacheTime: time.hours(1),
});

async function postCodex<T>(query: string, variables: Record<string, unknown>, abortController: AbortController | null): Promise<T> {
  const { data } = await getPlatformClient().post<CodexResponse<T>>(
    '/proxy/codex',
    { query, variables },
    { abortController, timeout: time.seconds(15) }
  );
  if (data.errors?.length || !data.data) throw new Error(data.errors?.[0]?.message ?? 'Missing data');
  return data.data;
}

async function fetchTopHolders(
  { token, filter }: TopHoldersParams,
  abortController: AbortController | null
): Promise<TopHoldersData | null> {
  if (!token) return null;
  // Codex network ids are EVM chain ids
  const tokenId = `${token.address}:${token.chainId}`;
  try {
    const { holders, token: codexToken } = await postCodex<HoldersResponse>(
      HOLDERS_QUERY,
      { tokenId, address: token.address, networkId: token.chainId },
      abortController
    );
    const priceUsd = holders.items.find(item => item.tokenPriceUsd)?.tokenPriceUsd;
    if (holders.status !== 'ENABLED' || !holders.items.length || !codexToken || !priceUsd) return null;

    const { filterTokenWallets } = await postCodex<TokenWalletsResponse>(
      TOKEN_WALLETS_QUERY,
      { wallets: holders.items.map(item => item.address), tokenId },
      abortController
    );
    const tradesByAddress = new Map(filterTokenWallets.results.map(({ address, ...trades }) => [address.toLowerCase(), trades]));
    const unit = powWorklet(10, codexToken.decimals);

    const topHolders = rankTopHolders(
      {
        holders: holders.items.map(
          (item): TokenHolder => ({
            address: item.address,
            balance: divWorklet(item.balance, unit),
            category: item.wallet?.category ?? null,
            identityLabels: item.wallet?.identityLabels ?? [],
            trades: tradesByAddress.get(item.address.toLowerCase()) ?? null,
          })
        ),
        priceUsd,
        totalSupply: codexToken.info?.totalSupply ?? '0',
      },
      filter
    );
    if (!topHolders.byStake.length) return null;

    const listed = [...new Set([...topHolders.byStake, ...topHolders.byProfit].map(row => row.holder.address.toLowerCase()))];
    return { ...topHolders, ensNames: await fetchEnsNames(listed) };
  } catch (error) {
    logger.error(new RainbowError('[topHoldersStore] Codex top holders fetch failed', error), { tokenId });
    throw error;
  }
}

/** Addresses without a reverse record, or whose lookup fails, are left out. */
async function fetchEnsNames(addresses: string[]): Promise<Record<string, string>> {
  const results = await mapWithConcurrency(addresses, NAME_LOOKUP_CONCURRENCY, fetchReverseRecord);
  const names: Record<string, string> = {};
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) names[addresses[index]] = result.value;
  });
  return names;
}
