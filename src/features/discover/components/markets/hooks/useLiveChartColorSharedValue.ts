import { useEffect } from 'react';

import { useAnimatedReaction, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';
import { getPriceChangeColor, type PriceChangeColors } from '@/design-system/color/usePriceChangeColors';
import { type MarketDisplayItem } from '@/features/discover/types/marketDisplayItem';

export function useLiveChartColorSharedValue(item: MarketDisplayItem, priceChangeColors: PriceChangeColors): SharedValue<string> {
  const livePriceChange = useLiveTokenSharedValue({
    initialValue: item.initialPriceChange,
    selector: item.priceChangeSelector,
    tokenId: item.liveTokenId,
  });
  const chartColor = useSharedValue(getPriceChangeColor(item.initialPriceChange, priceChangeColors));
  const negativeColor = priceChangeColors.negative;
  const neutralColor = priceChangeColors.neutral;
  const positiveColor = priceChangeColors.positive;

  useAnimatedReaction(
    () => getPriceChangeColor(livePriceChange.value, { negative: negativeColor, neutral: neutralColor, positive: positiveColor }),
    (nextColor, previousColor) => {
      if (nextColor === previousColor) return;
      chartColor.value = nextColor;
    },
    [livePriceChange, negativeColor, neutralColor, positiveColor]
  );

  useEffect(() => {
    chartColor.value = getPriceChangeColor(livePriceChange.value, {
      negative: negativeColor,
      neutral: neutralColor,
      positive: positiveColor,
    });
  }, [chartColor, livePriceChange, negativeColor, neutralColor, positiveColor]);

  return chartColor;
}
