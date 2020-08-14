import { invert } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import styled from 'styled-components/native';
import { colors } from '../../styles';
import { ChartExpandedStateHeader } from '../expanded-state/chart';
import { Column } from '../layout';
import Labels from './ExtremeLabels';
import TimespanSelector from './TimespanSelector';
import ChartTypes from '@rainbow-me/helpers/chartTypes';
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
  ChartTypes.max,
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

const HEIGHT = 146.5;

export default function ChartWrapper({
  chartType,
  color,
  fetchingCharts,
  points,
  updateChartType,
  showChart,
  TEMP,
}) {
  const timespanIndex = useMemo(() => ChartTimespans.indexOf(chartType), [
    chartType,
  ]);

  const [throttledData, setThrottledData] = useState({
    points,
    smoothing: 0.1,
    strategy: 'simple',
  });

  useEffect(() => {
    if (points && !fetchingCharts) {
      setThrottledData({ points, smoothing: 0.1, strategy: 'simple' });
    }
  }, [fetchingCharts, points, setThrottledData]);

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

  return (
    <Container>
      <ChartProvider data={throttledData}>
        <ChartExpandedStateHeader
          {...TEMP}
          chartTimeSharedValue={chartTimeSharedValue}
          showChart={showChart}
        />
        <ChartContainer showChart={showChart}>
          {showChart && (
            <>
              <Labels color={color} width={WIDTH} />
              <ChartPath
                fill="none"
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
        </ChartContainer>
      </ChartProvider>
      {showChart && (
        <TimespanSelector
          color={color}
          defaultIndex={timespanIndex}
          reloadChart={updateChartType}
          timespans={ChartTimespans}
        />
      )}
    </Container>
  );
}
