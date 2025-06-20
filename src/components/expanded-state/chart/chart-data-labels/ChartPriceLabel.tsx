import React from 'react';
import * as i18n from '@/languages';
import { AnimatedText } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { currencyToCompactNotation } from '@/helpers/strings';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';

const translations = {
  noPriceData: i18n.t(i18n.l.expanded_state.chart.no_price_data),
};

export function ChartPriceLabel({ price }: { price: SharedValue<number | undefined> }) {
  const { nativeCurrency } = useAccountSettings();

  const formattedPrice = useDerivedValue(() => {
    if (!price.value) return translations.noPriceData;
    return currencyToCompactNotation({
      value: price.value,
      currency: nativeCurrency,
    });
  });

  return (
    <AnimatedText size="34pt" weight="heavy" color="label" numberOfLines={1}>
      {formattedPrice}
    </AnimatedText>
  );
}
