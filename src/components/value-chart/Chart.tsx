import { invert } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  // @ts-expect-error ts-migrate(2614) FIXME: Module '"react-native-reanimated"' has no exported... Remove this comment to see the full error message
  repeat,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import styled from 'styled-components';
import Spinner from '../../assets/chartSpinner.png';
import { nativeStackConfig } from '../../navigation/nativeStackConfig';
import { ChartExpandedStateHeader } from '../expanded-state/chart';
import { Column } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ExtremeLabels' was resolved to '/Users/n... Remove this comment to see the full error message
import Labels from './ExtremeLabels';
// @ts-expect-error ts-migrate(6142) FIXME: Module './TimespanSelector' was resolved to '/User... Remove this comment to see the full error message
import TimespanSelector from './TimespanSelector';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/animated-charts' o... Remove this comment to see the full error message
import { ChartDot, ChartPath, useChartData } from '@rainbow-me/animated-charts';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/chartTypes... Remove this comment to see the full error message
import ChartTypes from '@rainbow-me/helpers/chartTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

export const { width: WIDTH } = Dimensions.get('window');

const ChartTimespans = [
  ChartTypes.hour,
  ChartTypes.day,
  ChartTypes.week,
  ChartTypes.month,
  ChartTypes.year,
  //ChartTypes.max, todo restore after receiving proper data from zerion
];

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const ChartContainer = styled.View`
  margin-vertical: ${({ showChart }: any) => (showChart ? '17px' : '0px')};
`;

const ChartSpinner = styled(ImgixImage).attrs(({ color }) => ({
  resizeMode: ImgixImage.resizeMode.contain,
  source: Spinner,
  tintColor: color,
}))`
  height: 28;
  width: 28;
`;

const Container = styled(Column)`
  padding-bottom: 30px;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  padding-top: ${ios ? 0 : 20}px;
  width: 100%;
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const InnerDot = styled.View`
  height: 10px;
  border-radius: 5px;
  background-color: ${({ color }: any) => color};
  shadow-color: ${({ color, theme: { colors, isDarkMode } }: any) =>
    isDarkMode ? colors.shadow : color};
  shadow-offset: 0 3px;
  shadow-opacity: 0.6;
  shadow-radius: 4.5px;
  width: 10px;
`;

const Dot = styled(ChartDot)`
  align-items: center;
  background-color: ${({ color }) => color};
  justify-content: center;
`;

const HEIGHT = 146.5;

const Overlay = styled(Animated.View).attrs({
  pointerEvents: 'none',
})`
  ${position.cover};
  align-items: center;
  background-color: ${({ theme: { colors } }) =>
    colors.alpha(colors.white, 0.9)};
  justify-content: center;
`;

const rotationConfig = {
  duration: 500,
  easing: Easing.linear,
};

const timingConfig = {
  duration: 300,
};

function useShowLoadingState(isFetching: any) {
  const [isShow, setIsShow] = useState(false);
  const timeout = useRef();
  useEffect(() => {
    if (isFetching) {
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'Timeout' is not assignable to type 'undefine... Remove this comment to see the full error message
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
  testID,
  throttledData,
  overrideValue = false,
  ...props
}: any) {
  const timespanIndex = useMemo(() => ChartTimespans.indexOf(chartType), [
    chartType,
  ]);

  const { progress } = useChartData();
  const spinnerRotation = useSharedValue(0);
  const spinnerScale = useSharedValue(0);
  const chartTimeSharedValue = useSharedValue('');
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
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
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'Timeout' is not assignable to type 'undefine... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ChartExpandedStateHeader
        {...props}
        chartTimeSharedValue={chartTimeSharedValue}
        color={color}
        isPool={isPool}
        overrideValue={overrideValue}
        showChart={showChart}
        testID={testID}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ChartContainer showChart={showChart}>
        {showChart && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Labels color={color} width={WIDTH} />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
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
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Dot color={colors.alpha(color, 0.03)} size={65}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <InnerDot color={color} />
            </Dot>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Overlay style={overlayStyle}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Animated.View style={spinnerStyle}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <ChartSpinner color={color} />
              </Animated.View>
            </Overlay>
          </>
        )}
      </ChartContainer>
      {showChart ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
