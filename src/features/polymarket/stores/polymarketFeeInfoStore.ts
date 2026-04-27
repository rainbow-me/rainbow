import { POLYMARKET_BUILDER_CODE, POLYMARKET_CLOB_URL } from '@/features/polymarket/constants';
import { EMPTY_POLYMARKET_FEE_INFO, type PolymarketFeeInfo } from '@/features/polymarket/utils/fees';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

type RawBuilderFeesResponse = {
  builder_taker_fee_rate_bps: number;
};

type RawMarketInfo = {
  mos: number;
  fd?: {
    e?: number;
    r?: number;
  };
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

  const marketInfoPromise = fetchMarketInfo(conditionId, abortController);
  const builderFeeRatePromise = fetchBuilderTakerFeeRate(abortController);

  const [marketInfo, builderTakerFeeRate] = await Promise.all([marketInfoPromise, builderFeeRatePromise]);

  return {
    ...marketInfo,
    builderTakerFeeRate,
  };
}

async function fetchMarketInfo(
  conditionId: string,
  abortController: AbortController | null
): Promise<Pick<PolymarketFeeInfo, 'minimumOrderSize' | 'platformFeeExponent' | 'platformFeeRate'>> {
  const { data } = await rainbowFetch<RawMarketInfo>(`${POLYMARKET_CLOB_URL}/clob-markets/${conditionId}`, {
    abortController,
    timeout: time.seconds(15),
  });

  return {
    minimumOrderSize: data.mos,
    platformFeeExponent: data.fd?.e ?? EMPTY_POLYMARKET_FEE_INFO.platformFeeExponent,
    platformFeeRate: data.fd?.r ?? EMPTY_POLYMARKET_FEE_INFO.platformFeeRate,
  };
}

async function fetchBuilderTakerFeeRate(abortController: AbortController | null): Promise<number> {
  const { data } = await rainbowFetch<string>(`${POLYMARKET_CLOB_URL}/fees/builder-fees/${POLYMARKET_BUILDER_CODE}`, {
    abortController,
    timeout: time.seconds(15),
  });
  const builderFees: RawBuilderFeesResponse = JSON.parse(data);

  return builderFees.builder_taker_fee_rate_bps / 10_000;
}
