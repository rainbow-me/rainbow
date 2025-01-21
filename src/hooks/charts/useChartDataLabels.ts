import { useCallback } from 'react';
import { useDerivedValue } from 'react-native-reanimated';
import ChartTypes, { ChartType } from '@/helpers/chartTypes';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { AssetApiResponse, AssetMetadata } from '@/__swaps__/types/assets';
import { ChartData } from './useChartInfo';

const formatPercentChange = (change = 0) => {
  'worklet';
  return toFixedWorklet(change, 2);
};

type AssetWithPrice = (AssetApiResponse | AssetMetadata) & {
  price?: {
    relative_change_24h?: number;
    relativeChange24h?: number;
    value: number;
  };
};

export default function useChartDataLabels({
  asset,
  chartType,
  points,
}: {
  asset: AssetWithPrice;
  chartType: ChartType;
  points: ChartData[];
}) {
  const latestPrice = asset?.price?.value;

  const getPercentChangeForPrice = useCallback(
    (startPrice: number) => {
      'worklet';
      const endPrice = points[points.length - 1]?.y;
      if (!endPrice) return;
      const percent = ((endPrice - startPrice) / startPrice) * 100;
      return formatPercentChange(percent);
    },
    [points]
  );

  const latestChange = useDerivedValue(() => {
    if (!points || chartType === ChartTypes.day) {
      // Handle both AssetApiResponse and AssetMetadata price change fields
      const change = asset?.price?.relative_change_24h ?? asset?.price?.relativeChange24h ?? 0;
      return formatPercentChange(change);
    }
    return getPercentChangeForPrice(points[0]?.y ?? 0);
  });

  return {
    latestChange,
    latestPrice,
  };
}
