import React, { memo, useCallback, useMemo, useState } from 'react';
import * as i18n from '@/languages';
import { ScrollView, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { Text, Box, TextIcon, useColorMode } from '@/design-system';
import { LineChart } from './LineChart';
import { ButtonPressAnimation } from '../animations';
import { ChartExpandedStateHeader } from '../expanded-state/chart';
import { CandlestickChart } from '../candlestick-charts/CandlestickChart';
import { colors } from '@/styles';
import { AssetAccentColors, ExpandedSheetAsset } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import { formatTimestamp } from '@/worklets/dates';
import { useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';
import { TokenData } from '@/state/liveTokens/liveTokensStore';
import { useAppSettingsStore } from '@/state/appSettings/appSettingsStore';
import { CandleResolution } from '@/components/candlestick-charts/types';
import { setCandleResolution } from '@/components/candlestick-charts/CandleSelector';
import { useCandlestickStore, useChartsStore } from '@/components/candlestick-charts/candlestickStore';
import { useStableValue } from '@/hooks/useStableValue';
import { useListen } from '@/state/internal/hooks/useListen';
import { CANDLESTICK_CHARTS, CANDLESTICK_DATA_MONITOR, useExperimentalConfig } from '@/config/experimentalHooks';
import { useRemoteConfig } from '@/model/remoteConfig';

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

const TOTAL_CHART_HEIGHT = 288;
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
  accentColors: AssetAccentColors;
};

export const Chart = memo(function Chart({ asset, backgroundColor, accentColors }: ChartProps) {
  const { isDarkMode } = useColorMode();
  const { width: screenWidth } = useWindowDimensions();

  const { candlestick_charts_enabled } = useRemoteConfig('candlestick_charts_enabled');
  const { [CANDLESTICK_CHARTS]: enableCandlestickChartsExperimental, [CANDLESTICK_DATA_MONITOR]: showDataMonitor } =
    useExperimentalConfig();
  const enableCandlestickCharts = candlestick_charts_enabled || enableCandlestickChartsExperimental;

  const chartGesturePrice = useSharedValue<number | undefined>(asset.price.value ?? undefined);
  const chartGesturePriceRelativeChange = useSharedValue<number | undefined>(asset.price.relativeChange24h ?? undefined);
  const chartGestureUnixTimestamp = useSharedValue<number>(0);
  const isChartGestureActive = useSharedValue(false);

  const liveTokenPrice = useLiveTokenSharedValue({
    tokenId: asset.uniqueId,
    initialValue: asset.price.value?.toString() ?? '0',
    selector: state => state.price,
  });

  const initialCandlestickPrice = useStableValue(() => useCandlestickStore.getState().getPrice());
  const currentCandlestickPrice = useSharedValue(initialCandlestickPrice);

  const chartType = useAppSettingsStore(state => (enableCandlestickCharts ? state.chartType : ChartTypes.LINE));

  const [selectedTimespan, setSelectedTimespan] = useState<ChartTimespan>(() =>
    chartType === ChartTypes.LINE ? 'hour' : convertToChartTimespan(useChartsStore.getState().candleResolution)
  );
  const selectedTimespanLabel = useMemo(() => formatSelectedTimespan(selectedTimespan), [selectedTimespan]);

  const liveTokenPercentageChangeSelector = useCallback(
    ({ change }: TokenData) => {
      if (selectedTimespan === 'day') {
        return change.change24hPct;
      } else if (selectedTimespan === 'hour') {
        return change.change1hPct;
      }
      return '0';
    },
    [selectedTimespan]
  );

  const liveTokenPercentageChange = useLiveTokenSharedValue({
    tokenId: asset.uniqueId,
    initialValue: asset.price.relativeChange24h?.toString() ?? '0',
    selector: liveTokenPercentageChangeSelector,
  });

  const priceRelativeChange = useDerivedValue(() => {
    if (chartType === ChartTypes.CANDLESTICK) {
      return currentCandlestickPrice.value?.percentChange ?? liveTokenPercentageChange.value ?? asset.price.relativeChange24h ?? undefined;
    }

    if (isChartGestureActive.value && chartType === ChartTypes.LINE) {
      return chartGesturePriceRelativeChange.value;
    }

    // Not all timespans are available in the live token data, and the chart must be responsible for updating this value
    if (selectedTimespan === 'minute' || selectedTimespan === 'month' || selectedTimespan === 'year' || selectedTimespan === 'week') {
      return chartGesturePriceRelativeChange.value;
    }

    return liveTokenPercentageChange.value ?? asset.price.relativeChange24h ?? undefined;
  });

  const displayDate = useDerivedValue(() =>
    isChartGestureActive.value ? formatTimestamp(chartGestureUnixTimestamp.value) : selectedTimespanLabel
  );
  const price = useDerivedValue(() => {
    if (isChartGestureActive.value) return chartGesturePrice.value;

    if (chartType === ChartTypes.CANDLESTICK) {
      return currentCandlestickPrice.value?.price ?? liveTokenPrice.value ?? asset.price.value ?? undefined;
    }

    return liveTokenPrice.value ?? asset.price.value ?? undefined;
  });

  useListen(
    useCandlestickStore,
    state => state.getPrice(),
    price => {
      currentCandlestickPrice.value = price;
    },
    (previousPrice, price) => {
      if (!price) return true;
      if (!previousPrice) return false;
      return price.price === previousPrice.price && price.percentChange === previousPrice.percentChange;
    }
  );

  const timespans = useMemo(() => {
    if (chartType === ChartTypes.LINE) {
      return LineChartTimespans;
    } else {
      return CandlestickChartTimespans;
    }
  }, [chartType]);

  const timespanKeys = Object.keys(timespans);

  const timespanScrollViewOffset = useMemo(() => {
    const timespansWidth = timespanKeys.length * 44 + 12 * (timespanKeys.length - 1);
    return Math.max(24, (screenWidth - timespansWidth) / 2);
  }, [screenWidth, timespanKeys]);

  const onPressTimespan = useCallback(
    (timespan: ChartTimespan) => {
      if (chartType === ChartTypes.CANDLESTICK) {
        setCandleResolution(convertToCandleResolution(timespan));
      }
      setSelectedTimespan(timespan);
    },
    [chartType]
  );

  const onPresschartType = useCallback(() => {
    const selectedTimespanIndex = Object.keys(chartType === ChartTypes.LINE ? LineChartTimespans : CandlestickChartTimespans).indexOf(
      selectedTimespan
    );
    const newchartTypeEquivalentTimespan = Object.keys(chartType === ChartTypes.LINE ? CandlestickChartTimespans : LineChartTimespans)[
      selectedTimespanIndex
    ];

    setSelectedTimespan(newchartTypeEquivalentTimespan as ChartTimespan);
    useAppSettingsStore.getState().toggleChartType();
  }, [selectedTimespan, chartType]);

  const chartHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: isChartGestureActive.value && chartType === ChartTypes.CANDLESTICK ? 0 : 1,
    };
  });

  const candleConfig = useMemo(
    () => ({
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
      crosshair: isDarkMode ? undefined : { dotColor: accentColors.color, lineColor: accentColors.color },
      grid: { color: accentColors.opacity12 },
      volume: { color: accentColors.opacity24 },
    }),
    [
      accentColors.color,
      accentColors.opacity6,
      accentColors.opacity10,
      accentColors.opacity12,
      accentColors.opacity24,
      isDarkMode,
      screenWidth,
    ]
  );

  return (
    <Box gap={28}>
      <Box as={Animated.View} paddingHorizontal="24px" style={chartHeaderStyle}>
        <ChartExpandedStateHeader
          displayDate={displayDate}
          priceRelativeChange={priceRelativeChange}
          price={price}
          backgroundColor={backgroundColor}
          isChartGestureActive={isChartGestureActive}
        />
      </Box>

      <Box gap={20}>
        {chartType === ChartTypes.LINE && (
          <Box alignItems="center" height={TOTAL_CHART_HEIGHT} justifyContent="center">
            <LineChart
              strokeColor={accentColors.color}
              backgroundColor={accentColors.background}
              width={screenWidth}
              height={TOTAL_CHART_HEIGHT - CHART_VERTICAL_PADDING * 2}
              asset={asset}
              timespan={selectedTimespan as LineChartTimespan}
              chartGestureUnixTimestamp={chartGestureUnixTimestamp}
              price={chartGesturePrice}
              priceRelativeChange={chartGesturePriceRelativeChange}
              isChartGestureActive={isChartGestureActive}
            />
          </Box>
        )}

        {chartType === ChartTypes.CANDLESTICK && (
          <Box alignItems="center" height={TOTAL_CHART_HEIGHT} justifyContent="center">
            <CandlestickChart
              address={asset.address}
              backgroundColor={backgroundColor}
              chainId={asset.chainId}
              chartHeight={TOTAL_CHART_HEIGHT}
              chartWidth={screenWidth}
              config={candleConfig}
              isChartGestureActive={isChartGestureActive}
              showDataMonitor={showDataMonitor}
            />
          </Box>
        )}

        <Box width="full">
          <ScrollView
            horizontal
            contentOffset={{ x: -timespanScrollViewOffset, y: 0 }}
            contentContainerStyle={{
              alignItems: 'center',
              gap: 12,
              height: 34,
              justifyContent: 'center',
              paddingLeft: timespanScrollViewOffset,
            }}
            showsHorizontalScrollIndicator={false}
          >
            {timespanKeys.map(timespan => (
              <ButtonPressAnimation key={timespan} onPress={() => onPressTimespan(timespan as ChartTimespan)}>
                <Box
                  width={44}
                  paddingVertical={'12px'}
                  justifyContent="center"
                  alignItems="center"
                  borderRadius={20}
                  backgroundColor={timespan === selectedTimespan ? colors.alpha(accentColors.color, 0.06) : 'transparent'}
                >
                  <Text
                    color={timespan === selectedTimespan ? { custom: accentColors.color } : 'labelQuaternary'}
                    uppercase
                    size="15pt"
                    weight="heavy"
                  >
                    {ChartTimespanLabels[timespan as ChartTimespan].short}
                  </Text>
                </Box>
              </ButtonPressAnimation>
            ))}
          </ScrollView>

          {enableCandlestickCharts && (
            <Box position="absolute" right={{ custom: 12 }}>
              <ButtonPressAnimation onPress={onPresschartType}>
                <Box borderRadius={20} justifyContent="center" alignItems="center" width={44} paddingVertical={'12px'}>
                  <TextIcon color="labelQuaternary" containerSize={12} size="icon 15px" weight="heavy">
                    {chartType === ChartTypes.LINE ? '􀋪' : '􀋦'}
                  </TextIcon>
                </Box>
              </ButtonPressAnimation>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
});

// -- TODO: Temporary - clean these up
function convertToCandleResolution(timespan: ChartTimespan): CandleResolution {
  switch (timespan) {
    case 'minute':
      return CandleResolution.M1;
    case 'fiveMinute':
      return CandleResolution.M5;
    case 'hour':
      return CandleResolution.H1;
    case 'fourHour':
      return CandleResolution.H4;
    case 'day':
      return CandleResolution.D1;
    default:
      return CandleResolution.M15;
  }
}

function convertToChartTimespan(candleResolution: CandleResolution): ChartTimespan {
  switch (candleResolution) {
    case CandleResolution.M1:
      return 'minute';
    case CandleResolution.M5:
      return 'fiveMinute';
    case CandleResolution.H1:
      return 'hour';
    case CandleResolution.H4:
      return 'fourHour';
    case CandleResolution.D1:
      return 'day';
    default:
      return 'hour';
  }
}

function formatSelectedTimespan(timespan: ChartTimespan): string {
  return i18n.t(i18n.l.expanded_state.chart.past_timespan, {
    formattedTimespan: ChartTimespanLabels[timespan].long,
  });
}
