import { useRoute } from '@react-navigation/native';
import React, { useEffect } from 'react';
import {
  SendActionButton,
  SheetActionButtonRow,
  SheetDivider,
  SlackSheet,
  SwapActionButton,
} from '../sheet';
import {
  TokenInfoBalanceValue,
  TokenInfoItem,
  TokenInfoRow,
  TokenInfoSection,
} from '../token-info';
import Chart from '../value-chart/Chart';
import { ChartExpandedStateHeader } from './chart';
import { chartExpandedAvailable } from '@rainbow-me/config/experimental';
import AssetInputTypes from '@rainbow-me/helpers/assetInputTypes';
import {
  useChartData,
  useChartDataLabels,
  useChartGestures,
  useColorForAsset,
  usePointsFromChartData,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';

const amountOfPathPoints = 175; // 👈️ TODO make this dynamic

const heightWithChart = 622;
const heightWithNoChart = 309;

export const ChartExpandedStateSheetHeight = chartExpandedAvailable
  ? heightWithChart
  : heightWithNoChart;

export default function ChartExpandedState({ asset }) {
  const { params } = useRoute();
  const { setParams } = useNavigation();
  const color = useColorForAsset(asset);

  const { chart, chartType, fetchingCharts, ...chartData } = useChartData(
    asset
  );
  const points = usePointsFromChartData({ amountOfPathPoints, chart });
  const { updateChartDataLabels, ...chartDataLabels } = useChartDataLabels({
    asset,
    chartType,
    color,
    points,
  });
  const { isScrubbing, ...chartGestures } = useChartGestures(
    updateChartDataLabels
  );

  // Only show the chart if we have chart data, or if chart data is still loading
  const showChart = chartExpandedAvailable && (!!chart || fetchingCharts);
  useEffect(() => {
    if (!showChart) {
      setParams({ longFormHeight: heightWithNoChart });
    }
  }, [showChart, setParams]);

  return (
    <SlackSheet contentHeight={params.longFormHeight} scrollEnabled={false}>
      <ChartExpandedStateHeader
        {...chartDataLabels}
        asset={asset}
        color={color}
        isScrubbing={isScrubbing}
      />
      {showChart && (
        <Chart
          {...chartData}
          {...chartDataLabels}
          {...chartGestures}
          asset={asset}
          chart={chart}
          chartType={chartType}
          color={color}
          fetchingCharts={fetchingCharts}
          isScrubbing={isScrubbing}
          points={points}
          updateChartDataLabels={updateChartDataLabels}
        />
      )}
      <SheetDivider />
      <TokenInfoSection>
        <TokenInfoRow>
          <TokenInfoItem asset={asset} title="Balance">
            <TokenInfoBalanceValue />
          </TokenInfoItem>
          {asset?.native?.price.display && (
            <TokenInfoItem title="Value" weight="bold">
              {asset?.native?.balance.display}
            </TokenInfoItem>
          )}
        </TokenInfoRow>
      </TokenInfoSection>
      <SheetActionButtonRow>
        <SwapActionButton color={color} inputType={AssetInputTypes.in} />
        <SendActionButton color={color} />
      </SheetActionButtonRow>
    </SlackSheet>
  );
}
