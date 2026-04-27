import { POLYMARKET_BUILDER_CODE, POLYMARKET_CLOB_URL } from '@/features/polymarket/constants';
import { EMPTY_POLYMARKET_FEE_INFO, type PolymarketFeeInfo } from '@/features/polymarket/utils/fees';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import { RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

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
  const { data } = await rainbowFetch<unknown>(`${POLYMARKET_CLOB_URL}/clob-markets/${conditionId}`, {
    abortController,
    timeout: time.seconds(15),
  });
  const marketInfo = requireRecord(data, 'market info');
  const feeDetails = readRecord(marketInfo, 'fd');

  return {
    minimumOrderSize: readNumber(marketInfo, 'mos') ?? EMPTY_POLYMARKET_FEE_INFO.minimumOrderSize,
    platformFeeExponent: (feeDetails && readNumber(feeDetails, 'e')) ?? EMPTY_POLYMARKET_FEE_INFO.platformFeeExponent,
    platformFeeRate: (feeDetails && readNumber(feeDetails, 'r')) ?? EMPTY_POLYMARKET_FEE_INFO.platformFeeRate,
  };
}

async function fetchBuilderTakerFeeRate(abortController: AbortController | null): Promise<number> {
  const { data } = await rainbowFetch<string>(`${POLYMARKET_CLOB_URL}/fees/builder-fees/${POLYMARKET_BUILDER_CODE}`, {
    abortController,
    timeout: time.seconds(15),
  });
  const builderFees = requireRecord(parseJson(data, 'builder fees'), 'builder fees');
  const builderTakerFeeRateBps = readNumber(builderFees, 'builder_taker_fee_rate_bps');

  if (builderTakerFeeRateBps === null) {
    throw new RainbowError('[polymarketFeeInfoStore] Missing builder taker fee rate');
  }

  return builderTakerFeeRateBps / 10_000;
}

function parseJson(data: string, context: string): unknown {
  try {
    return JSON.parse(data);
  } catch (error) {
    throw new RainbowError(`[polymarketFeeInfoStore] Invalid ${context} response`, error);
  }
}

function requireRecord(value: unknown, context: string): Record<string, unknown> {
  if (isRecord(value)) return value;
  throw new RainbowError(`[polymarketFeeInfoStore] Invalid ${context} response`);
}

function readRecord(record: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const value = record[key];
  return isRecord(value) ? value : null;
}

function readNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  return typeof value === 'number' ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
