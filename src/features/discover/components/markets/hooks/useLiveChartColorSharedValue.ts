import { useAnimatedReaction, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';
import { type MarketDisplayItem } from '@/features/discover/types/marketDisplayItem';
import { getPriceChangeColor, type PriceChangeColors } from '@/framework/ui/price/usePriceChangeColors';

export function useLiveChartColorSharedValue(item: MarketDisplayItem, priceChangeColors: PriceChangeColors): SharedValue<string> {
  const livePriceChange = useLiveTokenSharedValue({
    initialValue: item.initialPriceChange,
    selector: item.priceChangeSelector,
    tokenId: item.liveTokenId,
  });
  const chartColor = useSharedValue(getPriceChangeColor(item.initialPriceChange, priceChangeColors));

  useAnimatedReaction(
    () => getPriceChangeColor(livePriceChange.value, priceChangeColors),
    (nextColor, previousColor) => {
      if (nextColor === previousColor) return;
      chartColor.value = nextColor;
    },
    [livePriceChange, priceChangeColors]
  );

  return chartColor;
}
