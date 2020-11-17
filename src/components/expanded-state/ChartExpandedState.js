import { debounce, find } from 'lodash';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
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
import {
  ChartPathProvider,
  monotoneCubicInterpolation,
} from '@rainbow-me/animated-charts';
import AssetInputTypes from '@rainbow-me/helpers/assetInputTypes';

import { useNavigation } from '@rainbow-me/navigation';

import { ModalContext } from 'react-native-cool-modals/NativeStackView';

const heightWithChart = 606;
const heightWithNoChart = 309;

const ActionRowAndroid = styled.View`
  flex-direction: row;
  height: 44;
  margin-vertical: 12;
  margin-horizontal: 12;
  justify-content: space-around;
`;

const ActionRow = android ? ActionRowAndroid : SheetActionButtonRow;

const traverseData = (prev, data) => {
  if (!data || data.length === 0) {
    return prev;
  }
  const filtered = data.filter(({ y }) => y);
  if (
    filtered[0].y === prev?.nativePoints[0]?.y &&
    filtered[0].x === prev?.nativePoints[0]?.x
  ) {
    return prev;
  }
  const points = monotoneCubicInterpolation({
    data: filtered,
    includeExtremes: true,
    range: 100,
  });
  return {
    nativePoints: filtered,
    points,
  };
};

function useJumpingForm(isLong) {
  const isInitial = useRef(true);
  const { setOptions } = useNavigation();

  const { jumpToShort, jumpToLong } = useContext(ModalContext) || {};

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    if (!isLong) {
      setOptions({
        isShortFormEnabled: true,
      });
      setImmediate(() => {
        jumpToShort?.();
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

export const ChartExpandedStateSheetHeight = heightWithChart;

export default function ChartExpandedState({ asset }) {
  const color = useColorForAsset(asset);
  const [isFetchingInitially, setIsFetchingInitially] = useState(true);

  const { chart, chartType, fetchingCharts, ...chartData } = useChartData(
    asset
  );

  const [throttledPoints, setThrottledPoints] = useState(() =>
    traverseData({ nativePoints: [], points: [] }, chart)
  );
  useEffect(() => {
    setThrottledPoints(prev => traverseData(prev, chart));
  }, [chart]);

  const initialChartDataLabels = useChartDataLabels({
    asset,
    chartType,
    color,
    points: throttledPoints?.points ?? [],
  });

  useEffect(() => {
    if (!fetchingCharts) {
      setIsFetchingInitially(false);
    }
  }, [fetchingCharts]);

  // Only show the chart if we have chart data, or if chart data is still loading
  const showChart = useMemo(
    () =>
      throttledPoints?.points.length > 5 ||
      throttledPoints?.points.length > 5 ||
      (fetchingCharts && !isFetchingInitially),
    [fetchingCharts, isFetchingInitially, throttledPoints]
  );

  useJumpingForm(showChart);

  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();
  const showSwapButton = find(uniswapAssetsInWallet, [
    'uniqueId',
    asset.uniqueId,
  ]);

  const [throttledData, setThrottledData] = useState({
    nativePoints: throttledPoints.nativePoints,
    points: throttledPoints.points,
    smoothingStrategy: 'bezier',
  });

  const debouncedSetThrottledData = useRef(debounce(setThrottledData, 30))
    .current;

  useEffect(() => {
    if (throttledPoints.points && !fetchingCharts) {
      debouncedSetThrottledData({
        nativePoints: throttledPoints.nativePoints,
        points: throttledPoints.points,
        smoothingStrategy: 'bezier',
      });
    }
  }, [throttledPoints, fetchingCharts, debouncedSetThrottledData]);

  const duration = useRef(0);

  if (duration.current === 0) {
    duration.current = 300;
  }

  return (
    <SlackSheet
      contentHeight={ChartExpandedStateSheetHeight}
      scrollEnabled={false}
    >
      <ChartPathProvider data={throttledData}>
        <Chart
          {...chartData}
          {...initialChartDataLabels}
          asset={asset}
          chart={chart}
          chartType={chartType}
          color={color}
          fetchingCharts={fetchingCharts}
          nativePoints={chart}
          showChart={showChart}
          throttledData={throttledData}
        />
      </ChartPathProvider>
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
      <ActionRow key={`row${showChart}`}>
        {showSwapButton && (
          <SwapActionButton
            color={color}
            inputType={AssetInputTypes.in}
            radiusAndroid={24}
            radiusWrapperStyle={{ flex: 1, marginRight: 10 }}
            wrapperProps={{
              containerStyle: { flex: 1 },
              style: { flex: 1 },
            }}
          />
        )}
        <SendActionButton
          color={color}
          radiusAndroid={24}
          radiusWrapperStyle={{ flex: 1, marginLeft: 10 }}
          wrapperProps={{
            containerStyle: { flex: 1 },
            style: { flex: 1 },
          }}
        />
      </ActionRow>
    </SlackSheet>
  );
}
