import { invert } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import styled from 'styled-components/native';
import { ChartExpandedStateHeader } from '../expanded-state/chart';
import { Column } from '../layout';
import TimespanSelector from './TimespanSelector';
import ChartTypes from '@rainbow-me/helpers/chartTypes';
import { padding } from '@rainbow-me/styles';
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

const Container = styled(Column)`
  ${padding(19, 0, 21)};
  overflow: hidden;
  width: 100%;
`;

const InnerDot = styled.View`
  width: 6px;
  height: 6px;
  border-radius: 5px;
  background-color: white;
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

  const [throttledData, setThrottledData] = useState(points);

  // TODO from some reason it happens twice on click /shrug. Probably fetching something.

  useEffect(() => {
    if (points && !fetchingCharts) {
      setTimeout(() => setThrottledData({ points }), 50);
    }
  }, [fetchingCharts, points, setThrottledData]);

  const chartTimeSharedValue = useSharedValue('');

  useEffect(() => {
    if (chartType === ChartTypes.day) {
      chartTimeSharedValue.value = 'Today';
    } else if (chartType === ChartTypes.max) {
      chartTimeSharedValue.value = 'All time';
    } else {
      chartTimeSharedValue.value = `Past ${invert(ChartTypes)[chartType]}`;
    }
  }, [chartTimeSharedValue, chartType]);

  return (
    <Container>
      <Chart data={throttledData}>
        <ChartExpandedStateHeader
          {...TEMP}
          chartTimeSharedValue={chartTimeSharedValue}
        />
        <View>
          <ChartPath
            fill="none"
            height={SIZE / 2}
            panGestureHandlerProps={{
              activeOffsetY: [-1, 3],
              failOffsetY: [-1000, 1],
            }}
            stroke={color}
            strokeWidth="1.5"
            width={SIZE}
          />
          <Dot color={color} size={16}>
            <InnerDot />
          </Dot>
        </View>
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
