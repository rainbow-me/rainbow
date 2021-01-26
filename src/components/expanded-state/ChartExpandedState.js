import { find } from 'lodash';
import React, { useMemo, useRef } from 'react';
import { useChartThrottledPoints, useUniswapAssetsInWallet } from '../../hooks';
import {
  BuyActionButton,
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
import { Chart } from '../value-chart';
import { ChartPathProvider } from '@rainbow-me/animated-charts';
import AssetInputTypes from '@rainbow-me/helpers/assetInputTypes';
import { colors_NOT_REACTIVE } from '@rainbow-me/styles';

//add's StatusBar height to android
const heightWithoutChart = 309 + (android && 24);
const heightWithChart = heightWithoutChart + 297;

export const initialChartExpandedStateSheetHeight =
  heightWithChart + (android && 40);

export default function ChartExpandedState({ asset }) {
  const {
    chart,
    chartData,
    chartType,
    color,
    fetchingCharts,
    initialChartDataLabels,
    showChart,
    throttledData,
  } = useChartThrottledPoints({
    asset,
    heightWithChart,
    heightWithoutChart,
  });

  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();
  const showSwapButton = find(uniswapAssetsInWallet, [
    'uniqueId',
    asset.uniqueId,
  ]);
  const colorWithDarkModeOverride = useMemo(
    () =>
      colors_NOT_REACTIVE.isColorDark(color)
        ? colors_NOT_REACTIVE.brighten(color)
        : color,
    [color]
  );

  const needsEth = asset.address === 'eth' && asset.balance.amount === '0';

  const duration = useRef(0);

  if (duration.current === 0) {
    duration.current = 300;
  }
  const ChartExpandedStateSheetHeight =
    (ios || showChart ? heightWithChart : heightWithoutChart) + (android && 40);

  return (
    <SlackSheet
      additionalTopPadding={android}
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
          color={colorWithDarkModeOverride}
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
      {needsEth ? (
        <SheetActionButtonRow>
          <BuyActionButton color={colorWithDarkModeOverride} fullWidth />
        </SheetActionButtonRow>
      ) : (
        <SheetActionButtonRow>
          {showSwapButton && (
            <SwapActionButton
              color={colorWithDarkModeOverride}
              inputType={AssetInputTypes.in}
            />
          )}
          <SendActionButton
            color={colorWithDarkModeOverride}
            fullWidth={!showSwapButton}
          />
        </SheetActionButtonRow>
      )}
    </SlackSheet>
  );
}
