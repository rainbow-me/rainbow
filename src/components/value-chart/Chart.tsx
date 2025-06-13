import React, { memo, useCallback, useMemo, useState } from 'react';
import * as i18n from '@/languages';
import { useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { Text, Box, TextIcon } from '@/design-system';
import { LineChart } from './LineChart';
import { ButtonPressAnimation } from '../animations';
import { ChartExpandedStateHeader } from '../expanded-state/chart';
import { CandlestickChart } from '../candlestick-charts/CandlestickChart';
import { colors } from '@/styles';
import { ExpandedSheetAsset, useExpandedAssetSheetContext } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import { formatTimestamp } from '@/worklets/dates';
import { useCandlestickStore } from '../candlestick-charts/candlestickStore';

const translations = {
  noChartData: i18n.t(i18n.l.expanded_state.chart.no_chart_data),
};

// TODO: These values must correspond with the expected backend values, make sure types are shared
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

export const ChartTypes = {
  CANDLESTICK: 'candlestick',
  LINE: 'line',
} as const;

export type ChartType = (typeof ChartTypes)[keyof typeof ChartTypes];

export type LineChartTimespan = keyof typeof LineChartTimespans;
export type CandlestickChartTimespan = keyof typeof CandlestickChartTimespans;
export type ChartTimespan = LineChartTimespan | CandlestickChartTimespan;

const ChartTimespanLabels: Record<ChartTimespan, { short: string; long: string }> = {
  minute: {
    short: '1m',
    long: '1m',
  },
  fiveMinute: {
    short: '5m',
    long: '5m',
  },
  hour: {
    short: '1H',
    long: 'Hour',
  },
  fourHour: {
    short: '4h',
    long: '4h',
  },
  day: {
    short: '1d',
    long: 'Day',
  },
  week: {
    short: '1w',
    long: 'Week',
  },
  month: {
    short: '1m',
    long: 'Month',
  },
  year: {
    short: '1y',
    long: 'Year',
  },
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
        {translations.noChartData}
      </Text>
    </Box>
  );
};

type ChartProps = {
  asset: ExpandedSheetAsset;
  backgroundColor: string;
  color: string;
};

export const Chart = memo(function Chart({ asset, backgroundColor, color }: ChartProps) {
  // TODO: lift this up so that chart does not re-render when other context values change
  const { accentColors } = useExpandedAssetSheetContext();
  const priceRelativeChange = useSharedValue<number | undefined>(asset.price.relativeChange24h ?? undefined);
  const chartGesturePrice = useSharedValue<number | undefined>(asset.price.value ?? undefined);
  const chartGestureUnixTimestamp = useSharedValue<number>(0);
  const isChartGestureActive = useSharedValue(false);
  const { width: screenWidth } = useWindowDimensions();

  const chartType = useCandlestickStore(state => state.chartType);
  const [selectedTimespan, setSelectedTimespan] = useState<ChartTimespan>('hour');

  const selectedTimespanLabel = useMemo(() => {
    return i18n.t(i18n.l.expanded_state.chart.past_timespan, {
      formattedTimespan: ChartTimespanLabels[selectedTimespan].long,
    });
  }, [selectedTimespan]);

  const displayDate = useDerivedValue(() => {
    return isChartGestureActive.value ? formatTimestamp(chartGestureUnixTimestamp.value) : selectedTimespanLabel;
  });

  const price = useDerivedValue(() => {
    return isChartGestureActive.value ? chartGesturePrice.value : asset.price.value ?? undefined;
  });

  const timespans = useMemo(() => {
    if (chartType === ChartTypes.LINE) {
      return LineChartTimespans;
    } else {
      return CandlestickChartTimespans;
    }
  }, [chartType]);

  const onPressTimespan = useCallback((timespan: ChartTimespan) => {
    setSelectedTimespan(timespan);
  }, []);

  const onPresschartType = useCallback(() => {
    const selectedTimespanIndex = Object.keys(chartType === ChartTypes.LINE ? LineChartTimespans : CandlestickChartTimespans).indexOf(
      selectedTimespan
    );
    const newchartTypeEquivalentTimespan = Object.keys(chartType === ChartTypes.LINE ? CandlestickChartTimespans : LineChartTimespans)[
      selectedTimespanIndex
    ];

    setSelectedTimespan(newchartTypeEquivalentTimespan as ChartTimespan);
    useCandlestickStore.getState().toggleChartType();
  }, [selectedTimespan, chartType]);

  const chartHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: isChartGestureActive.value && chartType === ChartTypes.CANDLESTICK ? 0 : 1,
    };
  });

  return (
    <Box>
      <Box paddingHorizontal={'24px'}>
        <Animated.View style={chartHeaderStyle}>
          <ChartExpandedStateHeader priceRelativeChange={priceRelativeChange} price={price} displayDate={displayDate} />
        </Animated.View>
      </Box>
      {chartType === ChartTypes.LINE && (
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
      {chartType === ChartTypes.CANDLESTICK && (
        <Box height={CHART_HEIGHT + CHART_VERTICAL_PADDING * 2}>
          <CandlestickChart
            backgroundColor={backgroundColor}
            // TODO: check back on this once merged with Christian's changes
            chartHeight={CHART_HEIGHT + CHART_VERTICAL_PADDING}
            config={{
              // chart: {
              //   activeCandleCardGap: 16,
              // },
              activeCandleCard: {
                style: {
                  backgroundColor: accentColors.opacity6,
                  paddingHorizontal: 16,
                  alignSelf: 'center',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: accentColors.opacity10,
                  width: screenWidth - 48,
                },
                height: 75,
              },
            }}
            isChartGestureActive={isChartGestureActive}
            showChartControls={false}
          />
        </Box>
      )}
      <Box height={34} width={'full'} flexDirection="row" justifyContent="center" alignItems="center" gap={12}>
        {Object.keys(timespans).map(timespan => (
          <ButtonPressAnimation key={timespan} onPress={() => onPressTimespan(timespan as ChartTimespan)}>
            <Box
              width={44}
              paddingVertical={'12px'}
              justifyContent="center"
              alignItems="center"
              borderRadius={20}
              backgroundColor={timespan === selectedTimespan ? colors.alpha(color, 0.06) : 'transparent'}
            >
              <Text color={timespan === selectedTimespan ? { custom: color } : 'labelQuaternary'} uppercase size="15pt" weight="heavy">
                {ChartTimespanLabels[timespan as ChartTimespan].short}
              </Text>
            </Box>
          </ButtonPressAnimation>
        ))}
        <ButtonPressAnimation onPress={onPresschartType}>
          <Box borderRadius={20} justifyContent="center" alignItems="center" width={44} paddingVertical={'12px'}>
            <TextIcon color="labelQuaternary" containerSize={12} size="icon 15px" weight="heavy">
              {chartType === ChartTypes.LINE ? '􀋪' : '􀋦'}
            </TextIcon>
          </Box>
        </ButtonPressAnimation>
      </Box>
    </Box>
  );
});
