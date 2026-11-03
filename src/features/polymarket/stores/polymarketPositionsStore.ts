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

type ApplyExpectedBuyPositionParams = PolymarketOrderDetails & {
  operationId: string;
  positionAmounts: PolymarketOrderAmounts;
  proxyAddress: Address;
};

type PolymarketPositionsStoreActions = {
  beginExpectedBuyPosition: (params: { asset: string; operationId: string; proxyAddress: Address }) => void;
  applyExpectedBuyPosition: (params: ApplyExpectedBuyPositionParams) => void;
  amendExpectedBuyPosition: (params: ApplyExpectedBuyPositionParams) => void;
  applyExpectedPositionRemoval: (params: { operationId: string; position: PolymarketPosition }) => void;
  discardExpectedPosition: (params: { asset: string; operationId: string; proxyAddress: Address }) => void;
  getPosition: (asset: string, proxyAddress: Address) => PolymarketPosition | undefined;
};

// ============ Constants ====================================================== //

const STALE_TIME = time.seconds(30);
const OPTIMISTIC_POSITION_CONFLICT_WINDOW = time.minutes(2);

// ============ Positions Store ================================================ //

export const usePolymarketPositionsStore = createPolymarketPositionsStore();

export const polymarketPositionsActions = createStoreActions(usePolymarketPositionsStore);

function createPolymarketPositionsStore() {
  const optimisticPositions = createPolymarketPositionOptimisticUpdater(OPTIMISTIC_POSITION_CONFLICT_WINDOW);

  const store = createQueryStore<PolymarketPositionsByAsset, PolymarketPositionsParams, PolymarketPositionsStoreActions>(
    {
      enabled: $ => $(usePolymarketClients, state => state.proxyAddress !== null),
      fetcher: fetchPolymarketPositions,
      params: { proxyAddress: $ => $(usePolymarketClients, state => state.proxyAddress) },
      setData: setPolymarketPositionsData,
      staleTime: STALE_TIME,
    },

    (set, get) => ({
      beginExpectedBuyPosition: ({ asset, operationId, proxyAddress }) => {
        const positions = get().getData({ proxyAddress });
        if (!positions) return;

        optimisticPositions.track({
          apply: position => position,
          asset,
          canConfirmFromBackend: false,
          operationId,
          positions,
          proxyAddress,
        });
      },

      applyExpectedBuyPosition: params => updateBuyPosition('accept', params),
      amendExpectedBuyPosition: params => updateBuyPosition('amend', params),

      applyExpectedPositionRemoval: ({ operationId, position }) => {
        set(state => {
          const queryKey = getQueryKey({ proxyAddress: position.proxyWallet });
          const currentPositions = state.getCacheEntry(queryKey)?.data;
          const positions = optimisticPositions.track({
            apply: () => undefined,
            asset: position.asset,
            canConfirmFromBackend: false,
            operationId,
            positions: currentPositions ?? { [position.asset]: position },
            proxyAddress: position.proxyWallet,
          });

          return buildPolymarketCacheUpdate(state.queryCache, queryKey, positions, STALE_TIME);
        });
      },

      discardExpectedPosition: ({ asset, operationId, proxyAddress }) => {
        set(state => {
          const queryKey = getQueryKey({ proxyAddress });
          const positions = optimisticPositions.discard({
            asset,
            operationId,
            positions: state.getCacheEntry(queryKey)?.data ?? {},
            proxyAddress,
          });

          if (!positions) return state;

          return buildPolymarketCacheUpdate(state.queryCache, queryKey, positions, STALE_TIME);
        });
      },

      getPosition: (asset, proxyAddress) => get().getData({ proxyAddress })?.[asset],
    }),

    { storageKey: 'polymarketPositions', version: 3 }
  );

  function updateBuyPosition(phase: 'accept' | 'amend', { operationId, proxyAddress, ...buy }: ApplyExpectedBuyPositionParams): void {
    const asset = buy.market.clobTokenIds[buy.outcomeIndex];

    store.setState(state => {
      const queryKey = getQueryKey({ proxyAddress });
      const cached = state.getCacheEntry(queryKey)?.data;
      if (phase === 'accept' && (!cached || !asset || !buy.market.outcomes[buy.outcomeIndex])) return state;

      const positions = optimisticPositions[phase]({
        apply: currentPosition => buildAcceptedBuyPosition({ ...buy, proxyWallet: proxyAddress, currentPosition }) ?? currentPosition,
        asset,
        operationId,
        positions: cached ?? {},
        proxyAddress,
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
