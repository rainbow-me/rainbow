import { type MarketDetails } from '@polymarket/clob-client-v2';

import { polymarketClobDataClient } from '@/features/polymarket/polymarket-clob-data-client';
import { EMPTY_POLYMARKET_FEE_INFO, type PolymarketFeeInfo } from '@/features/polymarket/utils/fees';
import { time } from '@/framework/core/utils/time';
import { createQueryStore } from '@/state/internal/createQueryStore';

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

async function fetchPolymarketFeeInfo({ conditionId }: FetchParams): Promise<PolymarketFeeInfo> {
  if (!conditionId) return EMPTY_POLYMARKET_FEE_INFO;

  const marketInfo = await polymarketClobDataClient.getClobMarketInfo(conditionId);

  return {
    minimumOrderSize: getMinimumOrderSize(marketInfo),
    platformFeeExponent: marketInfo.fd?.e ?? EMPTY_POLYMARKET_FEE_INFO.platformFeeExponent,
    platformFeeRate: marketInfo.fd?.r ?? EMPTY_POLYMARKET_FEE_INFO.platformFeeRate,
  };
}

function getMinimumOrderSize(marketInfo: MarketDetails): number {
  if (!('mos' in marketInfo)) return EMPTY_POLYMARKET_FEE_INFO.minimumOrderSize;
  return typeof marketInfo.mos === 'number' ? marketInfo.mos : EMPTY_POLYMARKET_FEE_INFO.minimumOrderSize;
}
