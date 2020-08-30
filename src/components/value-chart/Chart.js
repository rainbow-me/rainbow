import { debounce, invert } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import styled from 'styled-components/native';
import ActivityIndicator from '../ActivityIndicator';
import { ChartExpandedStateHeader } from '../expanded-state/chart';
import { Centered, Column } from '../layout';
import Labels from './ExtremeLabels';
import TimespanSelector from './TimespanSelector';
import ChartTypes from '@rainbow-me/helpers/chartTypes';
import { colors, position } from '@rainbow-me/styles';
import {
  ChartDot,
  ChartPath,
  ChartProvider,
} from 'react-native-animated-charts';

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

const Container = styled(Column)`
  padding-bottom: 30px;
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

const Overlay = styled(Centered).attrs({
  pointerEvents: 'none',
})`
  ${position.cover};
  background-color: ${colors.alpha(colors.white, 0.69)};
`;

function useShowLoadingState(isFetching) {
  const [isShow, setIsShow] = useState(false);
  const timeout = useRef();
  useEffect(() => {
    if (isFetching) {
      timeout.current = setTimeout(() => setIsShow(isFetching), 1000);
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
  points,
  nativePoints,
  updateChartType,
  showChart,
  showMonth,
  showYear,
  ...props
}) {
  const timespanIndex = useMemo(() => ChartTimespans.indexOf(chartType), [
    chartType,
  ]);

  const [throttledData, setThrottledData] = useState({
    nativePoints,
    points,
    strategy: 'bezier',
  });

  const debouncedSetThrottledData = useRef(debounce(setThrottledData, 30))
    .current;

  useEffect(() => {
    if (points && !fetchingCharts) {
      debouncedSetThrottledData({
        nativePoints,
        points,
        strategy: 'bezier',
      });
    }
  }, [nativePoints, fetchingCharts, points, debouncedSetThrottledData]);

  const chartTimeSharedValue = useSharedValue('');

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

  const showLoadingState = useShowLoadingState(fetchingCharts);

  return (
    <Container>
      <ChartProvider data={throttledData} enableHaptics>
        <ChartExpandedStateHeader
          {...props}
          chartTimeSharedValue={chartTimeSharedValue}
          color={color}
          showChart={showChart}
        />
        <ChartContainer showChart={showChart}>
          {showChart && (
            <>
              <Labels color={color} width={WIDTH} />
              <ChartPath
                fill="none"
                gestureEnabled={!fetchingCharts && !!throttledData}
                height={HEIGHT}
                longPressGestureHandlerProps={{
                  minDurationMs: 60,
                }}
                stroke={color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3.5}
                strokeWidthSelected={3}
                width={WIDTH}
              />
              <Dot color={colors.alpha(color, 0.03)} size={65}>
                <InnerDot color={color} />
              </Dot>
            </>
          )}
          {showLoadingState ? (
            <Overlay>
              <ActivityIndicator color={color} />
            </Overlay>
          ) : null}
        </ChartContainer>
      </ChartProvider>
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
