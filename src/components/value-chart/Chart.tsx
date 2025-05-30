import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as i18n from '@/languages';
import { Dimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Spinner from '../../assets/chartSpinner.png';
import { nativeStackConfig } from '../../navigation/nativeStackConfig';
import { ChartExpandedStateHeader } from '../expanded-state/chart/ChartExpandedStateHeader';
import { Column } from '../layout';
import { Text, Box, Bleed, TextIcon, useColorMode } from '@/design-system';
import Labels from './ExtremeLabels';
import TimespanSelector from './TimespanSelector';
import { ChartDot, ChartPath, useChartData } from '@/react-native-animated-charts/src';
import ChartTypes, { ChartType } from '@/helpers/chartTypes';
import { ImgixImage } from '@/components/images';
import { useNavigation } from '@/navigation';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { IS_IOS } from '@/env';
import { useTheme } from '@/theme';

export const { width: WIDTH } = Dimensions.get('window');

const ChartTimespans = [
  ChartTypes.hour,
  ChartTypes.day,
  ChartTypes.week,
  ChartTypes.month,
  ChartTypes.year,
  // ChartTypes.max, todo restore after receiving proper data from zerion
];

const ChartContainer = styled(View)({
  marginVertical: ({ showChart }: { showChart: boolean }) => (showChart ? 17 : 0),
});

const CHART_DOT_SIZE = 10;

const ChartSpinner = styled(ImgixImage).attrs(({ color }: { color: string }) => ({
  resizeMode: ImgixImage.resizeMode.contain,
  source: Spinner,
  tintColor: color,
  size: 30,
}))({
  height: 28,
  width: 28,
});

const Container = styled(Column)({
  paddingBottom: 32,
  paddingTop: IS_IOS ? 0 : 4,
  width: '100%',
});

const HEIGHT = 146.5;

const Overlay = styled(Animated.View).attrs({
  pointerEvents: 'none',
})({
  ...position.coverAsObject,
  alignItems: 'center',
  justifyContent: 'center',
});

const rotationConfig = {
  duration: 500,
  easing: Easing.linear,
};

const timingConfig = {
  duration: 300,
};

function useShowLoadingState(isFetching: boolean) {
  const [isShow, setIsShow] = useState(false);
  const timeout = useRef<NodeJS.Timeout | undefined>(undefined);
  useEffect(() => {
    if (isFetching) {
      timeout.current = setTimeout(() => setIsShow(isFetching), 500);
    } else {
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = undefined;
      }
      setIsShow(isFetching);
    }
  }, [isFetching]);
  return isShow;
}

const longPressGestureHandlerProps = {
  minDurationMs: 60,
};

type ChartProps = {
  chartType: ChartType;
  fetchingCharts: boolean;
  isPool: boolean;
  latestChange: SharedValue<string | undefined>;
  updateChartType: (chartType: ChartType) => void;
  showChart: boolean;
  throttledData: any;
  latestPrice: number;
  asset: any;
};

export default function Chart({
  chartType,
  fetchingCharts,
  isPool,
  latestChange,
  updateChartType,
  showChart,
  throttledData,
  latestPrice,
  asset,
}: ChartProps) {
  const timespanIndex = useMemo(() => ChartTimespans.indexOf(chartType), [chartType]);

  const { progress, color } = useChartData();
  const spinnerRotation = useSharedValue(0);
  const spinnerScale = useSharedValue(0);

  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();

  const { setOptions } = useNavigation();
  useEffect(
    () =>
      setOptions({
        onWillDismiss: () => {
          cancelAnimation(progress);
          cancelAnimation(spinnerRotation);
          cancelAnimation(spinnerScale);
          nativeStackConfig.screenOptions.onWillDismiss();
        },
      }),
    [setOptions, progress, spinnerRotation, spinnerScale]
  );

  const showLoadingState = useShowLoadingState(fetchingCharts);

  const spinnerTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  useEffect(() => {
    if (showLoadingState) {
      if (spinnerTimeout.current) {
        clearTimeout(spinnerTimeout.current);
        spinnerTimeout.current = undefined;
      }
      spinnerRotation.value = 0;
      spinnerRotation.value = withRepeat(withTiming(360, rotationConfig), -1, false);
      spinnerScale.value = withTiming(1, timingConfig);
    } else {
      spinnerScale.value = withTiming(0, timingConfig);
      spinnerTimeout.current = setTimeout(() => (spinnerRotation.value = 0), timingConfig.duration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLoadingState]);

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: spinnerScale.value,
    };
  });

  const spinnerStyle = useAnimatedStyle(() => {
    return {
      opacity: spinnerScale.value,
      transform: [{ rotate: `${spinnerRotation.value}deg` }, { scale: spinnerScale.value }],
    };
  });

  return (
    <Container>
      <ChartExpandedStateHeader
        asset={asset}
        chartType={chartType}
        color={color}
        isPool={isPool}
        latestChange={latestChange}
        latestPrice={latestPrice.toString()}
        showChart={showChart}
      />
      <ChartContainer showChart={showChart}>
        {showChart && (
          <>
            <Labels color={color} width={WIDTH} isCard={false} />
            <ChartPath
              fill="none"
              gestureEnabled={!fetchingCharts && !!throttledData}
              hapticsEnabled
              height={HEIGHT}
              hitSlop={30}
              longPressGestureHandlerProps={longPressGestureHandlerProps}
              selectedStrokeWidth={3}
              stroke={color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3.5}
              width={WIDTH}
            />
            <ChartDot
              size={CHART_DOT_SIZE}
              color={color}
              dotStyle={{
                shadowColor: isDarkMode ? colors.shadow : color,
                shadowOffset: { height: 3, width: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 4.5,
              }}
            />
            <Overlay style={overlayStyle}>
              <Animated.View style={spinnerStyle}>
                <ChartSpinner color={color} />
              </Animated.View>
            </Overlay>
          </>
        )}
        {!showChart && (
          <Bleed bottom="24px">
            <Box
              height={HEIGHT + 48}
              alignItems="center"
              flexDirection="row"
              gap={8}
              justifyContent="center"
              paddingBottom="32px"
              style={{ opacity: 0.8 }}
            >
              <TextIcon color="labelQuaternary" containerSize={12} size="icon 15px" weight="heavy">
                􀋪
              </TextIcon>
              <Text align="center" color="labelQuaternary" size="17pt" weight="heavy">
                {i18n.t(i18n.l.expanded_state.chart.no_chart_data)}
              </Text>
            </Box>
          </Bleed>
        )}
      </ChartContainer>
      {showChart ? (
        <TimespanSelector
          color={color}
          defaultIndex={timespanIndex}
          key={`ts_${chartType}`}
          reloadChart={updateChartType}
          timespans={ChartTimespans}
        />
      ) : null}
    </Container>
  );
}
