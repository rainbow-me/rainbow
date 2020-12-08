import { map } from 'lodash';
import React from 'react';
import { useChartThrottledPoints } from '../../hooks';
import { magicMemo } from '../../utils';
import {
  DepositActionButton,
  SheetActionButtonRow,
  SheetDivider,
  SlackSheet,
  WithdrawActionButton,
} from '../sheet';
import {
  TokenInfoBalanceValue,
  TokenInfoItem,
  TokenInfoRow,
  TokenInfoSection,
} from '../token-info';
import Chart from '../value-chart/Chart';
import { ChartPathProvider } from '@rainbow-me/animated-charts';

const heightWithoutChart = 373 + (android && 80);
const heightWithChart = heightWithoutChart + 292;

export const initialLiquidityPoolExpandedStateSheetHeight =
  heightWithChart + (android && 40);

const LiquidityPoolExpandedState = ({ asset }) => {
  const { symbol, tokenNames, tokens, totalNativeDisplay, uniBalance } = asset;
  const uniBalanceLabel = `${uniBalance} ${symbol}`;
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
    isPool: true,
  });

  const LiquidityPoolExpandedStateSheetHeight =
    (ios || showChart ? heightWithChart : heightWithoutChart) + (android && 40);
  return (
    <SlackSheet
      additionalTopPadding={android}
      contentHeight={LiquidityPoolExpandedStateSheetHeight}
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
          isPool
          nativePoints={chart}
          showChart={showChart}
          throttledData={throttledData}
        />
      </ChartPathProvider>
      <SheetDivider />
      <TokenInfoSection>
        <TokenInfoRow>
          {map(tokens, tokenAsset => {
            return (
              <TokenInfoItem
                asset={tokenAsset}
                key={`tokeninfo-${tokenAsset.symbol}`}
                title={`${tokenAsset.symbol} balance`}
              >
                <TokenInfoBalanceValue />
              </TokenInfoItem>
            );
          })}
        </TokenInfoRow>
        <TokenInfoRow>
          <TokenInfoItem title="Pool shares">{uniBalanceLabel}</TokenInfoItem>
          <TokenInfoItem title="Total value" weight="bold">
            {totalNativeDisplay}
          </TokenInfoItem>
        </TokenInfoRow>
      </TokenInfoSection>
      <SheetActionButtonRow>
        <WithdrawActionButton symbol={tokenNames} weight="bold" />
        <DepositActionButton symbol={tokenNames} weight="bold" />
      </SheetActionButtonRow>
    </SlackSheet>
  );
};

export default magicMemo(LiquidityPoolExpandedState, 'asset');
