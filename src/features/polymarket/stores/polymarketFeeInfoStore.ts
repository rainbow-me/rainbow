import { Chain, ClobClient, type ClobToken } from '@polymarket/clob-client-v2';

import { POLYMARKET_BUILDER_CODE, POLYMARKET_CLOB_PROXY_URL } from '@/features/polymarket/constants';
import { EMPTY_POLYMARKET_FEE_INFO, type PolymarketFeeInfo } from '@/features/polymarket/utils/orderExecution';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

type FetchParams = {
  conditionId: string | null;
};

type RawBuilderFeesResponse = {
  builder_maker_fee_rate_bps: number;
  builder_taker_fee_rate_bps: number;
};

type RawBuilderFeesPayload = RawBuilderFeesResponse | string;

const publicClobClient = new ClobClient({
  host: POLYMARKET_CLOB_PROXY_URL,
  chain: Chain.POLYGON,
});

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
  mos?: number;
  mts?: number;
  ao?: boolean;
  nr?: boolean;
  cbos?: boolean;
  aot?: string | null;
  ibce?: boolean;
  fd?: FeeDetails;
  mbf?: number;
  tbf?: number;
};

const EMPTY_PLATFORM_FEE_INFO = {
  exponent: EMPTY_POLYMARKET_FEE_INFO.platformFeeExponent,
  rate: EMPTY_POLYMARKET_FEE_INFO.platformFeeRate,
};

const BASIS_POINTS_DIVISOR = 10000;

export const usePolymarketFeeInfoStore = createQueryStore<PolymarketFeeInfo, FetchParams>({
  fetcher: fetchPolymarketFeeInfo,
  params: {
    conditionId: null,
  },
  cacheTime: time.minutes(10),
  staleTime: time.minutes(1),
});

export function prefetchPolymarketFeeInfo(conditionId: string) {
  return usePolymarketFeeInfoStore.getState().fetch({ conditionId });
}

async function fetchPolymarketFeeInfo({ conditionId }: FetchParams, abortController: AbortController | null): Promise<PolymarketFeeInfo> {
  if (!conditionId) return EMPTY_POLYMARKET_FEE_INFO;

  const marketInfoPromise = publicClobClient.getClobMarketInfo(conditionId) as Promise<MarketDetails>;
  const builderFeesPromise = rainbowFetch<RawBuilderFeesPayload>(
    `${POLYMARKET_CLOB_PROXY_URL}/fees/builder-fees/${POLYMARKET_BUILDER_CODE}`,
    {
      abortController,
      timeout: time.seconds(15),
    }
  ).then(({ data }) => data);

  const [marketInfo, rawBuilderFees] = await Promise.all([marketInfoPromise, builderFeesPromise]);
  const builderFees = parseBuilderFeesResponse(rawBuilderFees);
  const builderTakerFeeRateBps = toFiniteNumber(builderFees.builder_taker_fee_rate_bps) ?? 0;
  const platformFeeInfo = getPlatformFeeInfo(marketInfo);

  return {
    builderTakerFeeRate: builderTakerFeeRateBps / BASIS_POINTS_DIVISOR,
    minimumOrderSize: toFiniteNumber(marketInfo.mos) ?? EMPTY_POLYMARKET_FEE_INFO.minimumOrderSize,
    platformFeeExponent: platformFeeInfo.exponent,
    platformFeeRate: platformFeeInfo.rate,
  };
}

function parseBuilderFeesResponse(builderFees: RawBuilderFeesPayload): RawBuilderFeesResponse {
  if (typeof builderFees !== 'string') return builderFees;
  return JSON.parse(builderFees) as RawBuilderFeesResponse;
}

function getPlatformFeeInfo(marketInfo: MarketDetails): { exponent: number; rate: number } {
  const feeDetailsRate = toFiniteNumber(marketInfo.fd?.r);
  if (feeDetailsRate === null) return EMPTY_PLATFORM_FEE_INFO;

  return {
    exponent: toFiniteNumber(marketInfo.fd?.e) ?? EMPTY_POLYMARKET_FEE_INFO.platformFeeExponent,
    rate: feeDetailsRate,
  };
}

function toFiniteNumber(value: number | string | null | undefined): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
