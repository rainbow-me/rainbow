import React from 'react';
import * as i18n from '@/languages';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { Stack, Bleed, Box, AnimatedText } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { ChartPercentChangeLabel } from './chart-data-labels';
import { currencyToCompactNotation } from '@/helpers/strings';

const noPriceData = i18n.t(i18n.l.expanded_state.chart.no_price_data);

type ChartExpandedStateHeaderProps = {
  percentageChange: SharedValue<number | undefined>;
  price: SharedValue<number | undefined>;
  dateTimeLabel: SharedValue<string>;
};

export function ChartExpandedStateHeader({ percentageChange, price, dateTimeLabel }: ChartExpandedStateHeaderProps) {
  const { nativeCurrency } = useAccountSettings();

  // TODO: move this to the chart component
  const priceText = useDerivedValue(() => {
    'worklet';
    if (!price.value) return noPriceData;
    return currencyToCompactNotation({
      value: price.value,
      currency: nativeCurrency,
    });
  });

  return (
    <Box testID={'expanded-state-header'}>
      <Stack space={'20px'}>
        <AnimatedText size="34pt" weight="heavy" color="label" numberOfLines={1}>
          {priceText}
        </AnimatedText>
        <Bleed top={'6px'}>
          <Box gap={8} flexDirection="row" alignItems="center">
            <ChartPercentChangeLabel percentageChange={percentageChange} />
            <AnimatedText size="20pt" weight="bold" color="labelQuaternary" tabularNumbers numberOfLines={1}>
              {dateTimeLabel}
            </AnimatedText>
          </Box>
        </Bleed>
      </Stack>
    </Box>
  );
}
