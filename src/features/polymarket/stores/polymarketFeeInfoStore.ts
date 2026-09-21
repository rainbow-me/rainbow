import { type MarketDetails } from '@polymarket/clob-client-v2';
import { createQueryStore } from '@storesjs/stores';

import { polymarketClobDataClient } from '@/features/polymarket/polymarket-clob-data-client';
import { polymarketOrderParamsStore, usePolymarketOrderDetailsStore } from '@/features/polymarket/stores/polymarketOrderStore';
import { EMPTY_POLYMARKET_FEE_INFO, type PolymarketFeeInfo } from '@/features/polymarket/utils/fees';
import { time } from '@/framework/core/utils/time';

type FetchParams = {
  conditionId: string | null;
};

export const usePolymarketFeeInfoStore = createQueryStore<PolymarketFeeInfo, FetchParams>({
  fetcher: fetchPolymarketFeeInfo,
  params: {
    conditionId: $ => {
      const { params } = $(polymarketOrderParamsStore);
      const conditionId = $(usePolymarketOrderDetailsStore, state => state.getData()?.market.conditionId ?? null);
      if (!params) return null;
      return 'conditionId' in params ? params.conditionId : conditionId;
    },
  },
  cacheTime: time.minutes(10),
  staleTime: time.minutes(1),
});

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
