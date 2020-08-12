import { useRoute } from '@react-navigation/native';
import { find } from 'lodash';
import React, { useEffect, useMemo } from 'react';
import {
  useChartData,
  useChartDataLabels,
  useChartGestures,
  useColorForAsset,
  usePointsFromChartData,
  useUniswapAssetsInWallet,
} from '../../hooks';
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
import { chartExpandedAvailable } from '@rainbow-me/config/experimental';
import AssetInputTypes from '@rainbow-me/helpers/assetInputTypes';

import { useNavigation } from '@rainbow-me/navigation';

const amountOfPathPoints = 175; // 👈️ TODO make this dynamic

const heightWithChart = 606;
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

  const TEMP = useMemo(
    () => ({
      ...chartDataLabels,
      asset,
      color,
      isScrubbing,
    }),
    [asset, chartDataLabels, color, isScrubbing]
  );
  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();
  const showSwapButton = find(uniswapAssetsInWallet, [
    'uniqueId',
    asset.uniqueId,
  ]);

  return (
    <SlackSheet contentHeight={params.longFormHeight} scrollEnabled={false}>
      <Chart
        TEMP={TEMP}
        {...chartData}
        {...chartGestures}
        asset={asset}
        chart={chart}
        chartType={chartType}
        color={color}
        fetchingCharts={fetchingCharts}
        isScrubbing={isScrubbing}
        points={points}
        showChart={showChart}
        updateChartDataLabels={updateChartDataLabels}
      />
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
        {showSwapButton && (
          <SwapActionButton color={color} inputType={AssetInputTypes.in} />
        )}
        <SendActionButton color={color} />
      </SheetActionButtonRow>
    </SlackSheet>
  );
}
