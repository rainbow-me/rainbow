import { isEmpty } from 'lodash';
import React, { useMemo } from 'react';
import styled from 'styled-components/primitives';
import ChartTypes from '../../helpers/chartTypes';
import { toFixedDecimals } from '../../helpers/utilities';
import { Column } from '../layout';
import TimespanSelector from './TimespanSelector';
import ValueChart from './ValueChart';
import { useAccountSettings, useCharts } from '@rainbow-me/hooks';
import { colors, padding } from '@rainbow-me/styles';

const Container = styled(Column)`
  ${padding(19, 0, 21)};
  overflow: hidden;
  width: 100%;
`;

const timespans = [
  ChartTypes.hour,
  ChartTypes.day,
  ChartTypes.week,
  ChartTypes.month,
  ChartTypes.year,
  ChartTypes.max,
];

const formatChartData = (sectionsData = [], index) => ({
  name: index,
  segments: sectionsData.map((data, i) => ({
    color: colors.green,
    line: i * 5,
    points: data.map(([x, y]) => ({ x, y })),
    renderStartSeparator: undefined,
  })),
});

export default function Chart({
  asset,
  chartDateRef,
  chartPriceRef,
  color,
  latestPrice,
}) {
  const { nativeCurrency } = useAccountSettings();
  const { chart, chartType, updateChartType, fetchingCharts } = useCharts(
    asset
  );

  const change = useMemo(
    () => toFixedDecimals(asset?.price?.relative_change_24h || 0, 2),
    [asset]
  );

  const timespanIndex = useMemo(() => timespans.indexOf(chartType), [
    chartType,
  ]);

  const chartData = useMemo(() => {
    if (!chart || isEmpty(chart)) return [];
    return [[chart]].map(formatChartData);
  }, [chart]);

  const amountOfPathPoints = 175; // 👈️ TODO make this dynamic

  return (
    <Container>
      <ValueChart
        amountOfPathPoints={amountOfPathPoints}
        change={change}
        chartDateRef={chartDateRef}
        chartPriceRef={chartPriceRef}
        color={color}
        currentDataSource={timespanIndex}
        currentValue={latestPrice}
        data={chartData}
        enableSelect
        isLoading={fetchingCharts}
        nativeCurrency={nativeCurrency}
      />
      <TimespanSelector
        color={color}
        defaultIndex={timespanIndex}
        reloadChart={updateChartType}
        timespans={timespans}
      />
    </Container>
  );
}
