import React from 'react';
import * as i18n from '@/languages';
import { useAccountSettings } from '@/hooks';
import { DerivedValue, SharedValue, useDerivedValue } from 'react-native-reanimated';
import { AnimatedNumber } from '@/components/animated-number/AnimatedNumber';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';

const translations = {
  noPriceData: i18n.t(i18n.l.expanded_state.chart.no_price_data),
};

type ChartPriceLabelProps = {
  price: DerivedValue<string | number | undefined>;
  backgroundColor: string;
  isLineChartGestureActive: SharedValue<boolean>;
};

export function ChartPriceLabel({ price, backgroundColor, isLineChartGestureActive }: ChartPriceLabelProps) {
  const { nativeCurrency } = useAccountSettings();

  const formattedPrice = useDerivedValue(() => {
    if (!price.value) return translations.noPriceData;
    return formatAssetPrice({
      value: price.value,
      currency: nativeCurrency,
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
