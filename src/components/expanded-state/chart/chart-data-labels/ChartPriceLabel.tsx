import React from 'react';
import { DerivedValue, SharedValue, useDerivedValue } from 'react-native-reanimated';
import { AnimatedNumber } from '@/components/animated-number/AnimatedNumber';
import { formatCandlestickPrice } from '@/features/charts/candlestick/components/CandlestickChart';
import { useChartsStore } from '@/features/charts/stores/chartsStore';
import { isHyperliquidToken } from '@/features/charts/utils';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import * as i18n from '@/languages';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';

const translations = {
  noPriceData: i18n.t(i18n.l.expanded_state.chart.no_price_data),
};

type ChartPriceLabelProps = {
  price: DerivedValue<string | number | undefined>;
  backgroundColor: string;
  isLineChartGestureActive: SharedValue<boolean>;
};

export function ChartPriceLabel({ price, backgroundColor, isLineChartGestureActive }: ChartPriceLabelProps) {
  const currency = useStoreSharedValue(userAssetsStoreManager, state => state.currency);
  const isHyperliquidChart = useStoreSharedValue(useChartsStore, state => isHyperliquidToken(state.token));

  const formattedPrice = useDerivedValue(() => {
    if (!price.value) return translations.noPriceData;
    switch (isHyperliquidChart.value) {
      case true:
        return formatCandlestickPrice(price.value, currency.value, isHyperliquidChart.value);
      case false:
        return formatAssetPrice({ currency: currency.value, value: price.value });
    }
  });

  return (
    <AnimatedNumber
      value={formattedPrice}
      size="34pt"
      weight="heavy"
      align="left"
      color="label"
      easingMaskColor={backgroundColor}
      disabled={isLineChartGestureActive}
    />
  );
}
