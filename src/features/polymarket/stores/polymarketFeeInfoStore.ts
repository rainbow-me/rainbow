import { type ClobToken } from '@polymarket/clob-client-v2';

import { POLYMARKET_BUILDER_CODE, POLYMARKET_CLOB_URL } from '@/features/polymarket/constants';
import { polymarketClobDataClient } from '@/features/polymarket/polymarket-clob-data-client';
import { EMPTY_POLYMARKET_FEE_INFO, type PolymarketFeeInfo } from '@/features/polymarket/utils/fees';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

type RawBuilderFeesResponse = {
  builder_maker_fee_rate_bps: number;
  builder_taker_fee_rate_bps: number;
};

type FeeDetails = {
  r?: number;
  e?: number;
  to?: boolean;
};

type MarketRewardsConfig = {
  mi?: number;
  ma?: number;
  e?: boolean;
  moas?: number;
};

type MarketDetails = {
  r?: MarketRewardsConfig;
  t: [ClobToken | null, ClobToken | null];
  c: string;
  mos: number;
  mts: number;
  ao?: boolean;
  nr: boolean;
  cbos?: boolean;
  aot?: string | null;
  ibce?: boolean;
  fd?: FeeDetails;
  mbf?: number;
  tbf?: number;
};

type FetchParams = {
  conditionId: string | null;
};

type StoreState = {
  conditionId: string | null;
  setConditionId: (conditionId: string | null) => void;
};

export const usePolymarketFeeInfoStore = createQueryStore<PolymarketFeeInfo, FetchParams, StoreState>(
  {
    fetcher: fetchPolymarketFeeInfo,
    params: { conditionId: ($, store) => $(store).conditionId },
    cacheTime: time.minutes(10),
    staleTime: time.minutes(1),
  },
  set => ({
    conditionId: null,
    setConditionId: (conditionId: string | null) => set({ conditionId }),
  })
);

async function fetchPolymarketFeeInfo({ conditionId }: FetchParams, abortController: AbortController | null): Promise<PolymarketFeeInfo> {
  if (!conditionId) return EMPTY_POLYMARKET_FEE_INFO;

  // TODO: We're casting because the SDK's type is not correct. Remove once the SDK is updated.
  const marketInfoPromise = polymarketClobDataClient.getClobMarketInfo(conditionId) as Promise<MarketDetails>;
  const builderFeesPromise = fetchBuilderFees(abortController);

  const [marketInfo, builderFees] = await Promise.all([marketInfoPromise, builderFeesPromise]);
  const builderTakerFeeRateBps = builderFees.builder_taker_fee_rate_bps;

  return {
    builderTakerFeeRate: builderTakerFeeRateBps / 10_000,
    minimumOrderSize: marketInfo.mos,
    platformFeeExponent: marketInfo.fd?.e ?? EMPTY_POLYMARKET_FEE_INFO.platformFeeExponent,
    platformFeeRate: marketInfo.fd?.r ?? EMPTY_POLYMARKET_FEE_INFO.platformFeeRate,
  };
}

async function fetchBuilderFees(abortController: AbortController | null): Promise<RawBuilderFeesResponse> {
  const { data } = await rainbowFetch<string>(`${POLYMARKET_CLOB_URL}/fees/builder-fees/${POLYMARKET_BUILDER_CODE}`, {
    abortController,
    timeout: time.seconds(15),
  });
  return JSON.parse(data) as RawBuilderFeesResponse;
}
