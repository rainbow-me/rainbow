import { isEmpty } from 'lodash';
import React, { useMemo } from 'react';
import ChartTypes from '../../helpers/chartTypes';
import { useCharts } from '../../hooks';
import { Column } from '../layout';
import TimespanSelector from './TimespanSelector';
import ValueChart from './ValueChart';
import { colors } from '@rainbow-me/styles';

const chartStroke = { detailed: 1.5, simplified: 3 };

const Chart = ({ asset, color, latestPrice, setChartPrice, ...props }) => {
  const { chart, chartType, updateChartType } = useCharts(asset);

  const hasChart = !isEmpty(chart);

  const chartData = useMemo(() => {
    if (!chart || !hasChart) return [];
    return [[chart, chart]].map((sectionsData, index) => {
      return {
        name: index,
        segments: sectionsData.map((data, i) => ({
          color: colors.green,
          line: i * 5,
          points: data.map(([x, y]) => ({ x, y })),
          renderStartSeparator: undefined,
        })),
      };
    });
  }, [chart, hasChart]);

  const currentChartIndex = Object.values(ChartTypes).indexOf(chartType);
  const amountOfPathPoints = 30; // 👈️ TODO make this dynamic

  return (
    <Column
      overflow="hidden"
      paddingBottom={21}
      paddingTop={19}
      width="100%"
      {...props}
    >
      <ValueChart
        amountOfPathPoints={amountOfPathPoints}
        barColor={color}
        currentDataSource={currentChartIndex}
        currentValue={latestPrice}
        data={chartData}
        enableSelect
        importantPointsIndexInterval={amountOfPathPoints}
        mode="gesture-managed"
        onValueUpdate={setChartPrice}
        stroke={chartStroke}
      />
      <TimespanSelector
        color={color}
        defaultIndex={currentChartIndex}
        isLoading={false}
        reloadChart={updateChartType}
      />
    </Column>
  );
};

export default React.memo(Chart);
