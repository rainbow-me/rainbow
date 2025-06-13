import React, { memo } from 'react';
import { SharedValue } from 'react-native-reanimated';
import { Stack, Bleed, Box, AnimatedText } from '@/design-system';
import { ChartPercentChangeLabel } from './chart-data-labels';
import { ChartPriceLabel } from '@/components/expanded-state/chart/chart-data-labels/ChartPriceLabel';
import { View } from 'react-native';

type ChartExpandedStateHeaderProps = {
  displayDate: SharedValue<string>;
  priceRelativeChange: SharedValue<number | undefined>;
  price: SharedValue<number | undefined>;
};

export const ChartExpandedStateHeader = memo(function ChartExpandedStateHeader({
  displayDate,
  priceRelativeChange,
  price,
}: ChartExpandedStateHeaderProps) {
  return (
    <View testID={'expanded-state-header'}>
      <Stack space={'20px'}>
        <ChartPriceLabel price={price} />
        <Bleed top={'6px'}>
          <Box gap={8} flexDirection="row" alignItems="center">
            <ChartPercentChangeLabel percentageChange={priceRelativeChange} />
            <AnimatedText size="20pt" weight="bold" color="labelQuaternary" tabularNumbers numberOfLines={1}>
              {displayDate}
            </AnimatedText>
          </Box>
        </Bleed>
      </Stack>
    </View>
  );
});
