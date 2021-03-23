import { find } from 'lodash';
import React, { useRef } from 'react';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { useSelector } from 'react-redux';
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
import {
  useAccountSettings,
  useChartThrottledPoints,
  useUniswapAssetsInWallet,
} from '@rainbow-me/hooks';
import { ethereumUtils } from '@rainbow-me/utils';

const baseHeight = 317 + (android && 20 - getSoftMenuBarHeight());
const heightWithoutChart = baseHeight + (android && 30);
const heightWithChart = baseHeight + 307;

export const initialChartExpandedStateSheetHeight = heightWithChart;

export default function ChartExpandedState({ asset }) {
  const { genericAssets } = useSelector(({ data: { genericAssets } }) => ({
    genericAssets,
  }));
  const { nativeCurrency } = useAccountSettings();

  // If we don't have a balance for this asset
  // It's a generic asset
  const hasBalance = asset?.balance;
  const assetWithPrice = hasBalance
    ? asset
    : genericAssets[asset?.address]
    ? ethereumUtils.formatGenericAsset(
        genericAssets[asset?.address],
        nativeCurrency
      )
    : asset;

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
    asset: assetWithPrice,
    heightWithChart: heightWithChart - (!hasBalance && 68),
    heightWithoutChart: heightWithoutChart - (!hasBalance && 68),
  });

  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();
  const showSwapButton = find(uniswapAssetsInWallet, [
    'uniqueId',
    asset?.uniqueId,
  ]);

  const needsEth = asset?.address === 'eth' && asset?.balance?.amount === '0';

  const duration = useRef(0);

  if (duration.current === 0) {
    duration.current = 300;
  }

  let ChartExpandedStateSheetHeight =
    ios || showChart ? heightWithChart : heightWithoutChart;

  if (android && !hasBalance) {
    ChartExpandedStateSheetHeight -= 60;
  }

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
          asset={assetWithPrice}
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
      {hasBalance && (
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
      )}
      {needsEth ? (
        <SheetActionButtonRow>
          <BuyActionButton color={color} fullWidth />
        </SheetActionButtonRow>
      ) : (
        <SheetActionButtonRow>
          {showSwapButton && (
            <SwapActionButton color={color} inputType={AssetInputTypes.in} />
          )}
          {hasBalance ? (
            <SendActionButton color={color} fullWidth={!showSwapButton} />
          ) : (
            <SwapActionButton
              color={color}
              fullWidth={!showSwapButton}
              inputType={AssetInputTypes.out}
              label={`􀖅 Get ${asset?.symbol}`}
              weight="heavy"
            />
          )}
        </SheetActionButtonRow>
      )}
    </SlackSheet>
  );
}
