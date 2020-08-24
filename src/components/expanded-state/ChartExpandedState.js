import { useRoute } from '@react-navigation/native';
import { find } from 'lodash';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  useChartData,
  useChartDataLabels,
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

function useJumpingForm(isLong) {
  const { setOptions } = useNavigation();

  const { jumpToShort, jumpToLong } = useContext(ModalContext);

  useEffect(() => {
    if (!isLong) {
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
  }, [isLong, setOptions, jumpToShort, jumpToLong]);
}

export const ChartExpandedStateSheetHeight = chartExpandedAvailable
  ? heightWithChart
  : heightWithNoChart;

export default function ChartExpandedState({ asset }) {
  const { params } = useRoute();
  const color = useColorForAsset(asset);
  const [isFetchingInitially, setIsFetchingInitially] = useState(true);

  const { chart, chartType, fetchingCharts, ...chartData } = useChartData(
    asset
  );

  const points = useMemo(
    () =>
      bSpline(chart?.filter(({ y }) => y))(
        chartType === ChartTypes.hour ? 100 : 160
      ),
    [chart, chartType]
  );

  const throttledPoints = useMemo(
    () => (!points || points.length === 0 ? throttledPoints : points),
    [points]
  );

  const initialChartDataLabels = useChartDataLabels({
    asset,
    chartType,
    color,
    points: throttledPoints,
  });

  useEffect(() => {
    if (!fetchingCharts) {
      setIsFetchingInitially(false);
    }
  }, [fetchingCharts]);

  // Only show the chart if we have chart data, or if chart data is still loading
  const showChart =
    chartExpandedAvailable &&
    (!!chart || (fetchingCharts && !isFetchingInitially));
  useJumpingForm(showChart);

  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();
  const showSwapButton = find(uniswapAssetsInWallet, [
    'uniqueId',
    asset.uniqueId,
  ]);

  return (
    <SlackSheet contentHeight={params.longFormHeight} scrollEnabled={false}>
      <Chart
        {...chartData}
        {...initialChartDataLabels}
        asset={asset}
        chart={chart}
        chartType={chartType}
        color={color}
        fetchingCharts={fetchingCharts}
        points={throttledPoints}
        showChart={showChart}
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
