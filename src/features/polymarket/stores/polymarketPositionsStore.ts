import { createQueryStore, createStoreActions, getQueryKey, type SetDataParams } from '@storesjs/stores';
import { type Address } from 'viem';

import { getHighContrastColor } from '@/design-system/color/getHighContrastColor';
import { POLYMARKET_DATA_API_URL } from '@/features/polymarket/constants';
import { buildPolymarketCacheUpdate } from '@/features/polymarket/stores/buildPolymarketCacheUpdate';
import { usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { type PolymarketOrderDetails } from '@/features/polymarket/stores/polymarketOrderDetailsStore';
import { createPolymarketPositionOptimisticUpdater } from '@/features/polymarket/stores/polymarketPositionOptimisticUpdater';
import {
  type PolymarketOrderAmounts,
  type PolymarketPosition,
  type PolymarketPositionsByAsset,
  type RawPolymarketPosition,
} from '@/features/polymarket/types';
import { type PolymarketMarket, type RawPolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { buildAcceptedBuyPosition } from '@/features/polymarket/utils/buildAcceptedPolymarketPosition';
import { getColorBySeed } from '@/features/polymarket/utils/getColorBySeed';
import { getImagePrimaryColor } from '@/features/polymarket/utils/getImageColors';
import { gammaMarketsUrl } from '@/features/polymarket/utils/marketProtocol';
import { processRawPolymarketPosition } from '@/features/polymarket/utils/processRawPolymarketPosition';
import { fetchTeamsForGameMarkets } from '@/features/polymarket/utils/sports';
import { processRawPolymarketMarket } from '@/features/polymarket/utils/transforms';
import { time } from '@/framework/core/utils/time';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import { RainbowError } from '@/logger';

// ============ Core Types ===================================================== //

type PolymarketPositionsParams = {
  proxyAddress: Address | null;
};

export type PolymarketPositionUpdate = {
  discard: () => void;
};

export type PolymarketBuyPositionUpdate = PolymarketPositionUpdate & {
  publish: (details: PolymarketOrderDetails, amounts: PolymarketOrderAmounts) => void;
  amend: (amounts: PolymarketOrderAmounts) => void;
};

type PolymarketPositionsStoreActions = {
  beginBuy: (params: { asset: string; proxyAddress: Address }) => PolymarketBuyPositionUpdate;
  remove: (position: PolymarketPosition) => PolymarketPositionUpdate;
  getPosition: (asset: string, proxyAddress: Address) => PolymarketPosition | undefined;
};

// ============ Constants ====================================================== //

const STALE_TIME = time.seconds(30);
const OPTIMISTIC_POSITION_CONFLICT_WINDOW = time.minutes(2);

// ============ Positions Store ================================================ //

export const usePolymarketPositionsStore = createPolymarketPositionsStore();

export const polymarketPositionsActions = createStoreActions(usePolymarketPositionsStore);

function createPolymarketPositionsStore() {
  let nextOperationId = 0;
  const optimisticPositions = createPolymarketPositionOptimisticUpdater(OPTIMISTIC_POSITION_CONFLICT_WINDOW);

  const store = createQueryStore<PolymarketPositionsByAsset, PolymarketPositionsParams, PolymarketPositionsStoreActions>(
    {
      enabled: $ => $(usePolymarketClients, state => state.proxyAddress !== null),
      fetcher: fetchPolymarketPositions,
      params: { proxyAddress: $ => $(usePolymarketClients, state => state.proxyAddress) },
      setData: setPolymarketPositionsData,
      staleTime: STALE_TIME,
    },

    (_, get) => ({
      beginBuy,
      remove: removePosition,
      getPosition: (asset, proxyAddress) => get().getData({ proxyAddress })?.[asset],
    }),

    { storageKey: 'polymarketPositions', version: 3 }
  );

  // ============ Pending Position Changes ======================================= //

  /** Retains the holding's history while a buy is submitted and its presentation loads. */
  function beginBuy({ asset, proxyAddress }: { asset: string; proxyAddress: Address }): PolymarketBuyPositionUpdate {
    const operationId = nextOperationId++;
    const queryKey = getQueryKey({ proxyAddress });
    const positions = store.getState().getData(queryKey);
    let details: PolymarketOrderDetails | undefined;

    if (positions) {
      optimisticPositions.track({
        apply: position => position,
        asset,
        canConfirmFromBackend: false,
        operationId,
        positions,
        proxyAddress,
      });
    }

    function update(phase: 'accept' | 'amend', buy: PolymarketOrderDetails, positionAmounts: PolymarketOrderAmounts): void {
      store.setState(state => {
        const cached = state.getCacheEntry(queryKey)?.data;

        if (phase === 'accept' && (!cached || !asset || !buy.market.outcomes[buy.outcomeIndex])) return state;

        const positions = optimisticPositions[phase]({
          apply: currentPosition =>
            buildAcceptedBuyPosition({ ...buy, positionAmounts, proxyWallet: proxyAddress, currentPosition }) ?? currentPosition,
          asset,
          operationId,
          positions: cached ?? {},
          proxyAddress,
        });

        return positions ? buildPolymarketCacheUpdate(state.queryCache, queryKey, positions, STALE_TIME) : state;
      });
    }

    return {
      publish: (buy, amounts) => {
        details = buy;
        update('accept', buy, amounts);
      },
      amend: amounts => {
        if (details) update('amend', details, amounts);
      },
      discard: () => discardPosition({ asset, operationId, proxyAddress }),
    };
  }

  /** Removes an accepted sale or redemption while the indexed positions catch up. */
  function removePosition(position: PolymarketPosition): PolymarketPositionUpdate {
    const operationId = nextOperationId++;
    const proxyAddress = position.proxyWallet;

    store.setState(state => {
      const queryKey = getQueryKey({ proxyAddress });
      const currentPositions = state.getCacheEntry(queryKey)?.data;
      const positions = optimisticPositions.track({
        apply: () => undefined,
        asset: position.asset,
        canConfirmFromBackend: false,
        operationId,
        positions: currentPositions ?? { [position.asset]: position },
        proxyAddress,
      });

      return buildPolymarketCacheUpdate(state.queryCache, queryKey, positions, STALE_TIME);
    });

    return { discard: () => discardPosition({ asset: position.asset, operationId, proxyAddress }) };
  }

  function discardPosition(params: { asset: string; operationId: number; proxyAddress: Address }): void {
    store.setState(state => {
      const queryKey = getQueryKey({ proxyAddress: params.proxyAddress });
      const positions = optimisticPositions.discard({
        ...params,
        positions: state.getCacheEntry(queryKey)?.data ?? {},
      });

      return positions ? buildPolymarketCacheUpdate(state.queryCache, queryKey, positions, STALE_TIME) : state;
    });
  }

  // ============ Cache Reconciliation =========================================== //

  function setPolymarketPositionsData({
    data,
    params,
    queryKey,
    set,
  }: SetDataParams<PolymarketPositionsByAsset, PolymarketPositionsParams, PolymarketPositionsStoreActions>) {
    set(state => {
      const { proxyAddress } = params;

      const positions = proxyAddress ? optimisticPositions.mergeBackendPositions(proxyAddress, data) : data;

      return buildPolymarketCacheUpdate(state.queryCache, queryKey, positions);
    });
  }

  return store;
}

// ============ Position Fetching ============================================== //

async function fetchPolymarketPositions(
  { proxyAddress }: PolymarketPositionsParams,
  abortController: AbortController | null
): Promise<PolymarketPositionsByAsset> {
  if (!proxyAddress) throw new RainbowError('[PolymarketPositionsStore] Proxy address is required');

  const { data: page } = await rainbowFetch<{ data: RawPolymarketPosition[] }>(`${POLYMARKET_DATA_API_URL}/positions`, {
    params: { user: proxyAddress, filter_amount: '1' },
    abortController,
    timeout: time.seconds(15),
  });

  const rawPositions = page.data;
  if (!rawPositions.length) return {};

  const rawMarkets = await fetchPolymarketMarkets(rawPositions, abortController);
  const [markets, teams] = await Promise.all([preparePolymarketMarkets(rawMarkets), fetchTeamsForGameMarkets(rawMarkets, abortController)]);

  const positions: PolymarketPositionsByAsset = {};
  for (const rawPosition of rawPositions) {
    const market = markets[rawPosition.slug];
    if (!market) continue;
    const ticker = market.events[0]?.ticker;
    const position = processRawPolymarketPosition(rawPosition, market, ticker ? teams[ticker] : undefined);
    positions[position.asset] = position;
  }

  return positions;
}

// ============ Market Enrichment ============================================== //

async function fetchPolymarketMarkets(
  positions: RawPolymarketPosition[],
  abortController: AbortController | null
): Promise<RawPolymarketMarket[]> {
  const slugsByStatus: Partial<Record<'open' | 'closed', Set<string>>> = {};
  for (const { slug, redeemable } of positions) {
    const status = redeemable ? 'closed' : 'open';
    (slugsByStatus[status] ??= new Set()).add(slug);
  }

  const responses = await Promise.all(
    Object.entries(slugsByStatus).map(async ([status, slugs]) => {
      const url = gammaMarketsUrl('markets');
      url.searchParams.set('closed', String(status === 'closed'));
      url.searchParams.set('limit', String(slugs.size));
      for (const slug of slugs) url.searchParams.append('slug', slug);

      const { data } = await rainbowFetch<RawPolymarketMarket[]>(url.toString(), {
        abortController,
        timeout: time.seconds(15),
      });

      return data;
    })
  );

  return responses.flat();
}

async function preparePolymarketMarkets(rawMarkets: RawPolymarketMarket[]): Promise<Partial<Record<string, PolymarketMarket>>> {
  const markets: Partial<Record<string, PolymarketMarket>> = {};

  await Promise.all(
    rawMarkets.map(async market => {
      const event = market.events?.[0];
      const rawColor = await getImagePrimaryColor(event?.icon ?? market.icon);
      const color = getHighContrastColor(rawColor) ?? getColorBySeed(event?.id ?? market.conditionId);
      markets[market.slug] = processRawPolymarketMarket(market, color);
    })
  );

  return markets;
}
