import { map } from 'lodash';
import React from 'react';
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
import { Chart } from '../value-chart';
import { ChartPathProvider } from '@rainbow-me/animated-charts';
import { useChartThrottledPoints } from '@rainbow-me/hooks';
import { magicMemo } from '@rainbow-me/utils';

const heightWithoutChart = 373 + (android && 80);
const heightWithChart = heightWithoutChart + 292;

export const initialLiquidityPoolExpandedStateSheetHeight =
  heightWithChart + (android && 40);

const LiquidityPoolExpandedState = ({ asset }) => {
  const { tokenNames, tokens, totalNativeDisplay, type, uniBalance } = asset;

  const tokenType = type === 'uniswap' ? 'UNI-V1' : 'UNI-V2';
  const uniBalanceLabel = `${uniBalance} ${tokenType}`;

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

  const liquidityPoolExpandedStateSheetHeight =
    (ios || showChart ? heightWithChart : heightWithoutChart) + (android && 40);

  return (
    <SlackSheet
      additionalTopPadding={android}
      contentHeight={liquidityPoolExpandedStateSheetHeight}
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
          {map(tokens, tokenAsset => (
            <TokenInfoItem
              asset={tokenAsset}
              key={`tokeninfo-${tokenAsset.symbol}`}
              title={`${tokenAsset.symbol} balance`}
            >
              <TokenInfoBalanceValue />
            </TokenInfoItem>
          ))}
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
