import React, { useMemo } from 'react';
import styled from 'styled-components/primitives';
import { Column } from '../layout';
import TimespanSelector from './TimespanSelector';
import ValueChart from './ValueChart';
import ChartTypes from '@rainbow-me/helpers/chartTypes';
import { padding } from '@rainbow-me/styles';

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

export default function Chart({
  chartType,
  color,
  fetchingCharts,
  points,
  updateChartDataLabels,
  updateChartType,
  ...props
}) {
  const timespanIndex = useMemo(() => ChartTimespans.indexOf(chartType), [
    chartType,
  ]);

  return (
    <Container>
      <ValueChart
        color={color}
        enableSelect
        isLoading={fetchingCharts}
        points={points}
        updateChartDataLabels={updateChartDataLabels}
        {...props}
      />
      <TimespanSelector
        color={color}
        defaultIndex={timespanIndex}
        reloadChart={updateChartType}
        timespans={ChartTimespans}
      />
    </Container>
  );
}
