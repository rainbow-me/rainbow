import React from 'react';
import * as i18n from '@/languages';
import { DerivedValue, SharedValue, useDerivedValue } from 'react-native-reanimated';
import { AnimatedNumber } from '@/components/animated-number/AnimatedNumber';
import { NativeCurrencyKeys } from '@/entities';
import { useChartsStore } from '@/features/charts/stores/chartsStore';
import { isHyperliquidToken } from '@/features/charts/utils';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

const translations = {
  noPriceData: i18n.t(i18n.l.expanded_state.chart.no_price_data),
};

type ChartPriceLabelProps = {
  price: DerivedValue<string | number | undefined>;
  backgroundColor: string;
  isLineChartGestureActive: SharedValue<boolean>;
};

export function ChartPriceLabel({ price, backgroundColor, isLineChartGestureActive }: ChartPriceLabelProps) {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const isHyperliquidChart = useChartsStore(state => isHyperliquidToken(state.token));
  const currency = isHyperliquidChart ? NativeCurrencyKeys.USD : nativeCurrency;

  const formattedPrice = useDerivedValue(() => {
    if (!price.value) return translations.noPriceData;
    return formatAssetPrice({
      currency,
      value: price.value,
    });
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
