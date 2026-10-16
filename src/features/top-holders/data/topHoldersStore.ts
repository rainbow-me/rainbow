import { createDerivedStore, createQueryStore } from '@storesjs/stores';
import { getAddress } from 'viem';

import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { useCurrencyConversionStore } from '@/features/currency/stores/currencyConversionStore';
import { ChainId } from '@/features/network/types/backendNetworks';
import { type TokenTrades } from '@/features/spot-pnl/core/spotPnl';
import { useViewedTokenStore } from '@/features/token/data/stores/viewedTokenStore';
import { divWorklet, powWorklet } from '@/framework/core/safeMath';
import { mapWithConcurrency } from '@/framework/core/utils/mapWithConcurrency';
import { time } from '@/framework/core/utils/time';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { getPlatformClient } from '@/resources/platform/client';

import { rankTopHolders, type TokenHolder, type TokenHolders, type TopHolders } from '../core/topHolders';

type TopHoldersParams = {
  /** `null` when no token is viewed or it is a perps market. */
  token: { address: string; chainId: ChainId } | null;
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
  holders(input: { tokenId: $tokenId, limit: ${HOLDERS_SCANNED} }) {
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

/**
 * The viewed token's largest holders by balance, with each one's swap history. Codex returns at most
 * {@link HOLDERS_SCANNED}, which bounds which holders can rank by profit.
 */
export const useTopHoldersDataStore = createQueryStore<TokenHolders | null, TopHoldersParams>({
  fetcher: fetchTopHolders,
  params: {
    token: $ =>
      $(useViewedTokenStore, ({ token }) =>
        token && typeof token !== 'string' ? { address: token.address, chainId: token.chainId } : null
      ),
  },
  staleTime: time.minutes(5),
  cacheTime: time.hours(1),
});

/** The ranked lists shown by the Top Holders section; `null` until there is a holder to show. */
export const useTopHoldersStore = createDerivedStore<TopHolders | null>($ => {
  const data = $(useTopHoldersDataStore).getData();
  const filter = $(useRemoteConfigStore, state => state.getRemoteConfigKey('top_holders_wallet_filter'));
  const usdToNativeRate = $(useCurrencyConversionStore).getData()?.usdToNativeCurrencyConversionRate;
  if (!data || !usdToNativeRate) return null;

  const topHolders = rankTopHolders({ data, filter, usdToNativeRate });
  return topHolders.byStake.length ? topHolders : null;
});

/** Lowercased address to ENS name, for the holders currently listed. Addresses without a reverse record are absent. */
export const useTopHolderNamesStore = createQueryStore<Record<string, string>, { addresses: string[] }>({
  fetcher: fetchNames,
  params: {
    addresses: $ =>
      $(useTopHoldersStore, topHolders =>
        topHolders ? [...new Set([...topHolders.byStake, ...topHolders.byProfit].map(row => row.holder.address))].sort() : []
      ),
  },
  keepPreviousData: true,
  staleTime: time.hours(1),
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

async function fetchTopHolders({ token }: TopHoldersParams, abortController: AbortController | null): Promise<TokenHolders | null> {
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

    return {
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
    };
  } catch (error) {
    logger.error(new RainbowError('[topHoldersStore] Codex top holders fetch failed', error), { tokenId });
    throw error;
  }
}

async function fetchNames({ addresses }: { addresses: string[] }): Promise<Record<string, string>> {
  const provider = getProvider({ chainId: ChainId.mainnet });
  const results = await mapWithConcurrency(addresses, NAME_LOOKUP_CONCURRENCY, address => provider.lookupAddress(getAddress(address)));
  const names: Record<string, string> = {};
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) names[addresses[index].toLowerCase()] = result.value;
  });
  return names;
}
