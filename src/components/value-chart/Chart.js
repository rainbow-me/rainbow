import { invert } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import styled from 'styled-components/native';
import { ChartExpandedStateHeader } from '../expanded-state/chart';
import { Column } from '../layout';
import TimespanSelector from './TimespanSelector';
import ChartTypes from '@rainbow-me/helpers/chartTypes';
import { colors } from '@rainbow-me/styles';
import { Chart, ChartDot, ChartPath } from 'react-native-animated-charts';

export const { width: SIZE } = Dimensions.get('window');

const ChartTimespans = [
  ChartTypes.hour,
  ChartTypes.day,
  ChartTypes.week,
  ChartTypes.month,
  ChartTypes.year,
  ChartTypes.max,
];

const ChartContainer = styled.View`
  margin-vertical: 17px;
`;

const Container = styled(Column)`
  padding-bottom: 30px;
  overflow: hidden;
  width: 100%;
`;

const InnerDot = styled.View`
  width: 10px;
  height: 10px;
  border-radius: 6px;
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

export default function ChartWrapper({
  chartType,
  color,
  fetchingCharts,
  points,
  updateChartType,
  TEMP,
}) {
  const timespanIndex = useMemo(() => ChartTimespans.indexOf(chartType), [
    chartType,
  ]);

  const [throttledData, setThrottledData] = useState({ points });

  // TODO from some reason it happens twice on click /shrug. Probably fetching something.

  useEffect(() => {
    if (points && !fetchingCharts) {
      setTimeout(() => setThrottledData({ points }), 50);
    }
  }, [fetchingCharts, points, setThrottledData]);

  const chartTimeSharedValue = useSharedValue('');

  const timespan = invert(ChartTypes)[chartType];
  const formattedTimespan =
    timespan.charAt(0).toUpperCase() + timespan.slice(1);

  useEffect(() => {
    if (chartType === ChartTypes.day) {
      chartTimeSharedValue.value = 'Today';
    } else if (chartType === ChartTypes.max) {
      chartTimeSharedValue.value = 'All Time';
    } else {
      chartTimeSharedValue.value = `Past ${formattedTimespan}`;
    }
  }, [chartTimeSharedValue, chartType, formattedTimespan]);

  return (
    <Container>
      <Chart data={throttledData}>
        <ChartExpandedStateHeader
          {...TEMP}
          chartTimeSharedValue={chartTimeSharedValue}
        />
        <ChartContainer>
          <ChartPath
            fill="none"
            height={146.5}
            longPressGestureHandlerProps={{
              maxDist: 200,
              minDurationMs: 60,
            }}
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3.5"
            width={SIZE}
          />
          <Dot color={colors.alpha(color, 0.02)} size={65}>
            <InnerDot color={color} />
          </Dot>
        </ChartContainer>
      </Chart>
      <TimespanSelector
        color={color}
        defaultIndex={timespanIndex}
        reloadChart={updateChartType}
        timespans={ChartTimespans}
      />
    </Container>
  );
}
