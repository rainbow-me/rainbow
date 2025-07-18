import React, { memo } from 'react';
import { View } from 'react-native';
import { DerivedValue, SharedValue, useDerivedValue } from 'react-native-reanimated';
import { ChartPriceLabel } from '@/components/expanded-state/chart/chart-data-labels/ChartPriceLabel';
import { AnimatedText, Bleed, Box, Stack, globalColors, useColorMode } from '@/design-system';
import { CANDLE_RESOLUTIONS, LINE_CHART_TIME_PERIODS } from '@/features/charts/constants';
import { useChartsStore, useChartType } from '@/features/charts/stores/chartsStore';
import { ChartType, LineChartTimePeriod } from '@/features/charts/types';
import * as i18n from '@/languages';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { opacity } from '@/__swaps__/utils/swaps';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { formatTimestamp } from '@/worklets/dates';
import { ChartPercentChangeLabel } from './chart-data-labels';

type ChartExpandedStateHeaderProps = {
  accentColor: string;
  backgroundColor: string;
  chartGestureUnixTimestamp: SharedValue<number>;
  isChartGestureActive: SharedValue<boolean>;
  price: DerivedValue<string | number | undefined>;
  priceRelativeChange: DerivedValue<string | number | undefined>;
};

export const ChartExpandedStateHeader = memo(function ChartExpandedStateHeader({
  accentColor,
  backgroundColor,
  chartGestureUnixTimestamp,
  isChartGestureActive,
  price,
  priceRelativeChange,
}: ChartExpandedStateHeaderProps) {
  return (
    <View testID="expanded-state-header">
      <Stack space="20px">
        <ChartPriceLabel price={price} backgroundColor={backgroundColor} isChartGestureActive={isChartGestureActive} />
        <Box gap={8} flexDirection="row" alignItems="center">
          <ChartPercentChangeLabel
            backgroundColor={backgroundColor}
            isChartGestureActive={isChartGestureActive}
            percentageChange={priceRelativeChange}
          />
          <FormattedTimeLabel
            accentColor={accentColor}
            backgroundColor={backgroundColor}
            chartGestureUnixTimestamp={chartGestureUnixTimestamp}
            isChartGestureActive={isChartGestureActive}
          />
        </Box>
      </Stack>
    </View>
  );
});

const FormattedTimeLabel = ({
  accentColor,
  backgroundColor,
  chartGestureUnixTimestamp,
  isChartGestureActive,
}: {
  accentColor: string;
  backgroundColor: string;
  chartGestureUnixTimestamp: SharedValue<number>;
  isChartGestureActive: SharedValue<boolean>;
}) => {
  const chartType = useChartType();

  return chartType === ChartType.Candlestick ? (
    <CandlestickTimeLabel accentColor={accentColor} backgroundColor={backgroundColor} />
  ) : (
    <LineChartTimeLabel chartGestureUnixTimestamp={chartGestureUnixTimestamp} isChartGestureActive={isChartGestureActive} />
  );
};

const CandlestickTimeLabel = ({ accentColor, backgroundColor }: { accentColor: string; backgroundColor: string }) => {
  const { isDarkMode } = useColorMode();
  const selectedTimespanLabel = useStoreSharedValue(useChartsStore, state => CANDLE_RESOLUTIONS[state.candleResolution].label);

  const background = isDarkMode
    ? getSolidColorEquivalent({ background: backgroundColor, foreground: globalColors.grey100, opacity: 0.08 })
    : undefined;

  return (
    <Bleed bottom={{ custom: 6 }} left={{ custom: 2 }} top={{ custom: 5 }}>
      <Box
        alignItems="center"
        backgroundColor={background}
        borderColor={{ custom: opacity(accentColor, 0.12) }}
        borderRadius={10}
        borderWidth={2}
        height={24}
        justifyContent="center"
        paddingHorizontal={{ custom: 7 }}
      >
        <AnimatedText align="center" color="labelQuaternary" numberOfLines={1} size="15pt" weight="bold">
          {selectedTimespanLabel}
        </AnimatedText>
      </Box>
    </Bleed>
  );
};

const LineChartTimeLabel = ({
  chartGestureUnixTimestamp,
  isChartGestureActive,
}: {
  chartGestureUnixTimestamp: SharedValue<number>;
  isChartGestureActive: SharedValue<boolean>;
}) => {
  const selectedTimespanLabel = useStoreSharedValue(useChartsStore, state => formatLineChartTimespan(state.lineChartTimePeriod));
  const lineChartLabel = useDerivedValue(() =>
    isChartGestureActive.value ? formatTimestamp(chartGestureUnixTimestamp.value) : selectedTimespanLabel.value
  );

  return (
    <AnimatedText color="labelQuaternary" tabularNumbers numberOfLines={1} size="20pt" weight="bold">
      {lineChartLabel}
    </AnimatedText>
  );
};

function formatLineChartTimespan(lineChartTimePeriod: LineChartTimePeriod): string {
  return i18n.t(i18n.l.expanded_state.chart.past_timespan, {
    formattedTimespan: LINE_CHART_TIME_PERIODS[lineChartTimePeriod].suffix,
  });
}
