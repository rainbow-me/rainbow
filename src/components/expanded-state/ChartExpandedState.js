import { find } from 'lodash';
import React, { useRef } from 'react';
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
import Chart from '../value-chart/Chart';
import { ChartPathProvider } from '@rainbow-me/animated-charts';
import AssetInputTypes from '@rainbow-me/helpers/assetInputTypes';
import { deviceUtils } from '@rainbow-me/utils';

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
      {needsEth ? (
        <SheetActionButtonRow>
          <BuyActionButton
            // FIXME
            androidWidth={deviceUtils.dimensions.width - 39}
            color={color}
          />
        </SheetActionButtonRow>
      ) : (
        <SheetActionButtonRow>
          {showSwapButton && (
            <SwapActionButton color={color} inputType={AssetInputTypes.in} />
          )}
          <SendActionButton
            androidWidth={
              // FIXME
              showSwapButton ? 160 : deviceUtils.dimensions.width - 39
            }
            color={color}
          />
        </SheetActionButtonRow>
      )}
    </SlackSheet>
  );
}
