import { type ChainId } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';
import { createQueryCollectionStore } from '@/state/internal/createQueryCollectionStore';

import { gweiToWei } from '../core/gasParams';
import { type GasSuggestions, type GasTrend, type MeteorologyLegacyResponse, type MeteorologyResponse } from '../types/gas';
import { fetchMeteorology } from './meteorology';

export type Meteorology = {
  suggestions: GasSuggestions;
  /** Current block base fee in wei; absent on legacy chains. */
  currentBaseFee?: string;
  trend: GasTrend;
  confirmationTimeByPriorityFee?: MeteorologyResponse['data']['confirmationTimeByPriorityFee'];
};

/**
 * Shares gas market data by chain, refreshing subscribed chains every twelve seconds.
 * Gas limits, speed selection and custom fees belong to consumers.
 */
export const useMeteorologyStore = createQueryCollectionStore({
  key: (chainId: ChainId) => chainId,
  fetcher: fetchGasData,
  staleTime: time.seconds(12),
  cacheTime: time.seconds(36),
});

async function fetchGasData(chainId: ChainId, signal?: AbortSignal): Promise<Meteorology> {
  const response = await fetchMeteorology(chainId, signal);

  if (isLegacyMeteorologyFeeData(response)) {
    const legacy = response.data.legacy;
    return {
      suggestions: {
        urgent: { isEIP1559: false, gasPrice: gweiToWei(legacy.fastGasPrice) },
        fast: { isEIP1559: false, gasPrice: gweiToWei(legacy.proposeGasPrice) },
        normal: { isEIP1559: false, gasPrice: gweiToWei(legacy.safeGasPrice) },
      },
      trend: 'notrend',
    };
  }

  const data = response.data;
  return {
    suggestions: {
      urgent: { isEIP1559: true, maxBaseFee: data.baseFeeSuggestion, maxPriorityFee: data.maxPriorityFeeSuggestions.urgent },
      fast: { isEIP1559: true, maxBaseFee: data.baseFeeSuggestion, maxPriorityFee: data.maxPriorityFeeSuggestions.fast },
      normal: { isEIP1559: true, maxBaseFee: data.baseFeeSuggestion, maxPriorityFee: data.maxPriorityFeeSuggestions.normal },
    },
    currentBaseFee: data.currentBaseFee,
    trend: getGasTrend(data.baseFeeTrend),
    confirmationTimeByPriorityFee: data.confirmationTimeByPriorityFee,
  };
}

function getGasTrend(trend: number): GasTrend {
  switch (trend) {
    case -1:
      return 'falling';
    case 0:
      return 'stable';
    case 1:
      return 'rising';
    case 2:
      return 'surging';
    default:
      return 'notrend';
  }
}

/**
 * Classifies meteorology payloads by fee model.
 * Uses `meta.feeType` first, then falls back to payload-shape checks.
 */
function isLegacyMeteorologyFeeData(
  meteorologyData: MeteorologyResponse | MeteorologyLegacyResponse
): meteorologyData is MeteorologyLegacyResponse {
  const feeType = meteorologyData.meta?.feeType;
  if (feeType === 'legacy') return true;
  if (feeType === 'eip1559') return false;

  const hasLegacyPayload = 'legacy' in meteorologyData.data;
  const hasEip1559Payload = 'baseFeeSuggestion' in meteorologyData.data;
  if (hasLegacyPayload && !hasEip1559Payload) return true;

  return false;
}
