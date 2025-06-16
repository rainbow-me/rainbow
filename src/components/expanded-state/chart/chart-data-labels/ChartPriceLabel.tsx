import React from 'react';
import * as i18n from '@/languages';
import { AnimatedText } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { currencyToCompactNotation } from '@/helpers/strings';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { AnimatedNumber } from '@/components/live-token-text/AnimatedNumber';

const translations = {
  noPriceData: i18n.t(i18n.l.expanded_state.chart.no_price_data),
};

type ChartPriceLabelProps = {
  price: SharedValue<string | number | undefined>;
  backgroundColor: string;
  isChartGestureActive: SharedValue<boolean>;
};

export function ChartPriceLabel({ price, backgroundColor, isChartGestureActive }: ChartPriceLabelProps) {
  const { nativeCurrency } = useAccountSettings();

  const formattedPrice = useDerivedValue(() => {
    if (!price.value) return translations.noPriceData;
    return currencyToCompactNotation({
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
      tabularNumbers
      easingMaskColor={backgroundColor}
      disabled={isChartGestureActive}
    />
  );

  return (
    <AnimatedText size="34pt" weight="heavy" color="label" numberOfLines={1}>
      {formattedPrice}
    </AnimatedText>
  );
}
