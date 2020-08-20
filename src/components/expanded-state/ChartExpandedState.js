import { useRoute } from '@react-navigation/native';
import { find } from 'lodash';
import React, { useContext, useEffect, useMemo } from 'react';
import {
  useChartData,
  useChartDataLabels,
  useChartGestures,
  useColorForAsset,
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
import ChartTypes from '@rainbow-me/helpers/chartTypes';

import { useNavigation } from '@rainbow-me/navigation';
import { default as bSpline } from 'react-native-animated-charts/interpolations/bSplineInterpolation';
import { ModalContext } from 'react-native-cool-modals/NativeStackView';

const heightWithChart = 606;
const heightWithNoChart = 309;

export const ChartExpandedStateSheetHeight = chartExpandedAvailable
  ? heightWithChart
  : heightWithNoChart;

export default function ChartExpandedState({ asset }) {
  const { params } = useRoute();
  const { setOptions } = useNavigation();
  const color = useColorForAsset(asset);

  const { chart, chartType, fetchingCharts, ...chartData } = useChartData(
    asset
  );

  const points = useMemo(
    () => (chartType === ChartTypes.hour ? bSpline(chart)(40) : chart),
    [chart, chartType]
  );

  const throttledPoints = useMemo(
    () =>
      (!points || points.length === 0
        ? throttledPoints
        : points
      )?.map(({ y, ...rest }) => ({ y: y ? y : undefined, ...rest })),
    [points]
  );

  const { updateChartDataLabels, ...chartDataLabels } = useChartDataLabels({
    asset,
    chartType,
    color,
    points: throttledPoints,
  });
  const { isScrubbing, ...chartGestures } = useChartGestures(
    updateChartDataLabels
  );

  const { jumpToShort, jumpToLong } = useContext(ModalContext);
  // Only show the chart if we have chart data, or if chart data is still loading
  const showChart = chartExpandedAvailable && (!!chart || fetchingCharts);
  useEffect(() => {
    if (!showChart) {
      setOptions({
        isShortFormEnabled: true,
      });
      setImmediate(() => {
        jumpToShort();
        setOptions({
          isShortFormEnabled: false,
          longFormHeight: heightWithNoChart,
        });
      });
    } else {
      setOptions({
        longFormHeight: heightWithChart,
      });
      setImmediate(jumpToLong);
    }
  }, [showChart, setOptions, jumpToShort, jumpToLong]);

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
        points={throttledPoints}
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
