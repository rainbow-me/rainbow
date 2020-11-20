import { invert } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated, {
  cancelAnimation,
  NewEasing,
  repeat,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import styled from 'styled-components/native';
import Spinner from '../../assets/chartSpinner.png';
import { nativeStackConfig } from '../../navigation/config';
import { ChartExpandedStateHeader } from '../expanded-state/chart';
import { Column } from '../layout';
import Labels from './ExtremeLabels';
import TimespanSelector from './TimespanSelector';
import { ChartDot, ChartPath, useChartData } from '@rainbow-me/animated-charts';
import ChartTypes from '@rainbow-me/helpers/chartTypes';
import { useNavigation } from '@rainbow-me/navigation';
import { colors, position } from '@rainbow-me/styles';

export const { width: WIDTH } = Dimensions.get('window');

const ChartTimespans = [
  ChartTypes.hour,
  ChartTypes.day,
  ChartTypes.week,
  ChartTypes.month,
  ChartTypes.year,
  //ChartTypes.max, todo restore after receiving proper data from zerion
];

const ChartContainer = styled.View`
  margin-vertical: ${({ showChart }) => (showChart ? '17px' : '0px')};
`;

const ChartSpinner = styled(FastImage).attrs(({ color }) => ({
  resizeMode: FastImage.resizeMode.contain,
  source: Spinner,
  tintColor: color,
}))`
  height: 28;
  width: 28;
`;

const Container = styled(Column)`
  padding-bottom: 30px;
  padding-top: ${ios ? 0 : 20}px;
  width: 100%;
`;

const InnerDot = styled.View`
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: ${({ color }) => color};
  shadow-color: ${({ color }) => color};
  shadow-offset: 0 3px;
  shadow-opacity: 0.6;
  shadow-radius: 4.5px;
`;

const Dot = styled(ChartDot)`
  justify-content: center;
  align-items: center;
  background-color: ${({ color }) => color};
`;

const HEIGHT = 146.5;

const Overlay = styled(Animated.View).attrs({
  pointerEvents: 'none',
})`
  ${position.cover};
  align-items: center;
  background-color: ${colors.alpha(colors.white, 0.9)};
  justify-content: center;
`;

const rotationConfig = {
  duration: 500,
  easing: NewEasing.linear,
};

const timingConfig = {
  duration: 300,
};

function useShowLoadingState(isFetching) {
  const [isShow, setIsShow] = useState(false);
  const timeout = useRef();
  useEffect(() => {
    if (isFetching) {
      timeout.current = setTimeout(() => setIsShow(isFetching), 500);
    } else {
      clearTimeout(timeout.current);
      setIsShow(isFetching);
    }
  }, [isFetching]);
  return isShow;
}

export default function ChartWrapper({
  chartType,
  color,
  fetchingCharts,
  isPool,
  updateChartType,
  showChart,
  showMonth,
  showYear,
  throttledData,
  ...props
}) {
  const timespanIndex = useMemo(() => ChartTimespans.indexOf(chartType), [
    chartType,
  ]);

  const { progress } = useChartData();
  const spinnerRotation = useSharedValue(0);
  const spinnerScale = useSharedValue(0);
  const chartTimeSharedValue = useSharedValue('');

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

  const spinnerTimeout = useRef();
  useEffect(() => {
    if (showLoadingState) {
      clearTimeout(spinnerTimeout.current);
      spinnerRotation.value = 0;
      spinnerRotation.value = repeat(
        withTiming(360, rotationConfig),
        -1,
        false
      );
      spinnerScale.value = withTiming(1, timingConfig);
    } else {
      spinnerScale.value = withTiming(0, timingConfig);
      spinnerTimeout.current = setTimeout(
        () => (spinnerRotation.value = 0),
        timingConfig.duration
      );
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
      transform: [
        { rotate: `${spinnerRotation.value}deg` },
        { scale: spinnerScale.value },
      ],
    };
  });

  const timespan = invert(ChartTypes)[chartType];
  const formattedTimespan =
    timespan.charAt(0).toUpperCase() + timespan.slice(1);

  useEffect(() => {
    if (chartType === ChartTypes.day) {
      chartTimeSharedValue && (chartTimeSharedValue.value = 'Today');
    } else if (chartType === ChartTypes.max) {
      chartTimeSharedValue && (chartTimeSharedValue.value = 'All Time');
    } else {
      chartTimeSharedValue &&
        (chartTimeSharedValue.value = `Past ${formattedTimespan}`);
    }
  }, [chartTimeSharedValue, chartType, formattedTimespan]);

  return (
    <Container>
      <ChartExpandedStateHeader
        {...props}
        chartTimeSharedValue={chartTimeSharedValue}
        color={color}
        isPool={isPool}
        showChart={showChart}
      />
      <ChartContainer showChart={showChart}>
        {showChart && (
          <>
            <Labels color={color} width={WIDTH} />
            <ChartPath
              fill="none"
              gestureEnabled={!fetchingCharts && !!throttledData}
              hapticsEnabled
              height={HEIGHT}
              hitSlop={30}
              longPressGestureHandlerProps={{
                minDurationMs: 60,
              }}
              selectedStrokeWidth={3}
              stroke={color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3.5}
              width={WIDTH}
            />
            <Dot color={colors.alpha(color, 0.03)} size={65}>
              <InnerDot color={color} />
            </Dot>
            <Overlay style={overlayStyle}>
              <Animated.View style={spinnerStyle}>
                <ChartSpinner color={color} />
              </Animated.View>
            </Overlay>
          </>
        )}
      </ChartContainer>
      {showChart ? (
        <TimespanSelector
          color={color}
          defaultIndex={timespanIndex}
          // fixme temporary to fix animation
          key={`ts_${showMonth}_${showYear}`}
          reloadChart={updateChartType}
          showMonth={showMonth}
          showYear={showYear}
          timespans={ChartTimespans}
        />
      ) : null}
    </Container>
  );
}
