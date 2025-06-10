import React, { useCallback, useMemo, useState } from 'react';
import * as i18n from '@/languages';
import { useWindowDimensions } from 'react-native';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { Text, Box, TextIcon } from '@/design-system';
import { LineChart } from './LineChart';
import { ButtonPressAnimation } from '../animations';
import { ChartExpandedStateHeader } from '../expanded-state/chart';
import { CandlestickChart } from '../candlestick-charts/CandlestickChart';
import { colors } from '@/styles';
import { ExpandedSheetAsset } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import { formatDatetime } from '../expanded-state/chart/chart-data-labels/ChartDateLabel';

// These values must correspond with the expected backend values
const LineChartTimespans = {
  hour: 'hour',
  day: 'day',
  week: 'week',
  month: 'month',
  year: 'year',
} as const;
const CandlestickChartTimespans = {
  minute: 'minute',
  fiveMinute: 'fiveMinute',
  hour: 'hour',
  fourHour: 'fourHour',
  day: 'day',
} as const;

const ChartTimespans = {
  ...LineChartTimespans,
  ...CandlestickChartTimespans,
} as const;

type ChartMode = 'line' | 'candlestick';
export type LineChartTimespan = keyof typeof LineChartTimespans;
export type CandlestickChartTimespan = keyof typeof CandlestickChartTimespans;
export type ChartTimespan = LineChartTimespan | CandlestickChartTimespan;

const ChartTimespanLabels: Record<ChartTimespan, string> = {
  minute: '1M',
  fiveMinute: '5M',
  hour: '1H',
  fourHour: '4H',
  day: '1D',
  week: '1W',
  month: '1M',
  year: '1Y',
};

const CHART_HEIGHT = 250;
const CHART_VERTICAL_PADDING = 30;

export const NoChartData = ({ height }: { height: number }) => {
  return (
    <Box height={height} alignItems="center" justifyContent="center" flexDirection="row" gap={8}>
      <TextIcon color="labelQuaternary" containerSize={12} size="icon 15px" weight="heavy">
        {'􀋪'}
      </TextIcon>
      <Text align="center" color="labelQuaternary" size="17pt" weight="heavy">
        {i18n.t(i18n.l.expanded_state.chart.no_chart_data)}
      </Text>
    </Box>
  );
};

type ChartProps = {
  asset: ExpandedSheetAsset;
  backgroundColor: string;
  color: string;
};

export function Chart({ asset, backgroundColor, color }: ChartProps) {
  const priceRelativeChange = useSharedValue<number | undefined>(asset.price.relativeChange24h ?? undefined);
  const chartGesturePrice = useSharedValue<number | undefined>(asset.price.value ?? undefined);
  const chartGestureUnixTimestamp = useSharedValue<number>(0);
  const isChartGestureActive = useSharedValue(false);
  const { width: screenWidth } = useWindowDimensions();

  // TODO: persist chart mode preference
  const [chartMode, setChartMode] = useState<ChartMode>('line');
  const [selectedTimespan, setSelectedTimespan] = useState<ChartTimespan>('hour');

  const defaultTimespanLabel = useMemo(() => {
    const timespanLabel = ChartTimespans[selectedTimespan];
    return i18n.t(i18n.l.expanded_state.chart.past_timespan, {
      formattedTimespan: timespanLabel.charAt(0).toUpperCase() + timespanLabel.slice(1),
    });
  }, [selectedTimespan]);

  const dateTimeLabel = useDerivedValue(() => {
    // TODO: move this format function definition somewhere else
    return isChartGestureActive.value ? formatDatetime(chartGestureUnixTimestamp.value) : defaultTimespanLabel;
  });

  const price = useDerivedValue(() => {
    return isChartGestureActive.value ? chartGesturePrice.value : asset.price.value ?? undefined;
  });

  const timespans = useMemo(() => {
    if (chartMode === 'line') {
      return LineChartTimespans;
    } else {
      return CandlestickChartTimespans;
    }
  }, [chartMode]);

  const onPressTimespan = useCallback((timespan: ChartTimespan) => {
    setSelectedTimespan(timespan);
  }, []);

  const onPressChartMode = useCallback(() => {
    const selectedTimespanIndex = Object.keys(chartMode === 'line' ? LineChartTimespans : CandlestickChartTimespans).indexOf(
      selectedTimespan
    );
    const newChartModeEquivalentTimespan = Object.keys(chartMode === 'line' ? CandlestickChartTimespans : LineChartTimespans)[
      selectedTimespanIndex
    ];

    setSelectedTimespan(newChartModeEquivalentTimespan as ChartTimespan);
    setChartMode(prev => (prev === 'line' ? 'candlestick' : 'line'));
  }, [selectedTimespan, chartMode]);

  return (
    <Box>
      <Box paddingHorizontal={'24px'}>
        <ChartExpandedStateHeader
          // TODO: align variable naming
          percentageChange={priceRelativeChange}
          price={price}
          dateTimeLabel={dateTimeLabel}
        />
      </Box>
      {chartMode === 'line' && (
        <Box paddingVertical={{ custom: CHART_VERTICAL_PADDING }}>
          <LineChart
            strokeColor={color}
            backgroundColor={color}
            width={screenWidth}
            height={CHART_HEIGHT}
            asset={asset}
            timespan={selectedTimespan as LineChartTimespan}
            chartGestureUnixTimestamp={chartGestureUnixTimestamp}
            price={chartGesturePrice}
            priceRelativeChange={priceRelativeChange}
            isChartGestureActive={isChartGestureActive}
          />
        </Box>
      )}
      {chartMode === 'candlestick' && (
        <Box>
          <CandlestickChart
            backgroundColor={backgroundColor}
            chartHeight={CHART_HEIGHT + CHART_VERTICAL_PADDING * 2}
            showChartControls={false}
          />
        </Box>
      )}
      <Box height={34} width={'full'} flexDirection="row" justifyContent="center" alignItems="center" gap={12}>
        {Object.keys(timespans).map(timespan => (
          <ButtonPressAnimation key={timespan} onPress={() => onPressTimespan(timespan as ChartTimespan)}>
            <Box
              paddingHorizontal={'12px'}
              paddingVertical={'12px'}
              borderRadius={20}
              backgroundColor={timespan === selectedTimespan ? colors.alpha(color, 0.06) : 'transparent'}
            >
              <Text color={timespan === selectedTimespan ? { custom: color } : 'labelQuaternary'} size="15pt" weight="heavy">
                {ChartTimespanLabels[timespan as ChartTimespan]}
              </Text>
            </Box>
          </ButtonPressAnimation>
        ))}
        <ButtonPressAnimation onPress={onPressChartMode}>
          <Box>
            <TextIcon color="labelQuaternary" containerSize={12} size="icon 15px" weight="heavy">
              {chartMode === 'line' ? '􀋪' : '􀋪'}
            </TextIcon>
          </Box>
        </ButtonPressAnimation>
      </Box>
    </Box>
  );
}
