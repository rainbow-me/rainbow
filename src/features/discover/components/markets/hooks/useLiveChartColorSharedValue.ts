import { useEffect } from 'react';

import { useAnimatedReaction, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';
import { getMarketPriceChangeColor, type PriceChangeColors } from '@/features/discover/components/markets/marketCardChrome';
import { type MarketDisplayItem } from '@/features/discover/types/marketDisplayItem';

export function useLiveChartColorSharedValue(item: MarketDisplayItem, priceChangeColors: PriceChangeColors): SharedValue<string> {
  const livePriceChange = useLiveTokenSharedValue({
    initialValue: item.initialPriceChange,
    selector: item.priceChangeSelector,
    tokenId: item.liveTokenId,
  });
  const chartColor = useSharedValue(getMarketPriceChangeColor(item.initialPriceChange, priceChangeColors));
  const negativeColor = priceChangeColors.negative;
  const positiveColor = priceChangeColors.positive;

  useAnimatedReaction(
    () => getMarketPriceChangeColor(livePriceChange.value, { negative: negativeColor, positive: positiveColor }),
    (nextColor, previousColor) => {
      if (nextColor === previousColor) return;
      chartColor.value = nextColor;
    },
    [livePriceChange, negativeColor, positiveColor]
  );

  useEffect(() => {
    chartColor.value = getMarketPriceChangeColor(livePriceChange.value, { negative: negativeColor, positive: positiveColor });
  }, [chartColor, livePriceChange, negativeColor, positiveColor]);

  return chartColor;
}
