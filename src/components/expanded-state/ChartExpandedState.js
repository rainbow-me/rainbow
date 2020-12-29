import { find, includes, toLower } from 'lodash';
import React, { Fragment, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components/primitives';
import { Column } from '../layout';
import {
  BuyActionButton,
  SendActionButton,
  SheetActionButtonRow,
  SheetDivider,
  SlackSheet,
  SwapActionButton,
} from '../sheet';
import { ToggleStateToast } from '../toasts';
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
  useChartThrottledPoints,
  useUniswapAssets,
  useUniswapAssetsInWallet,
} from '@rainbow-me/hooks';

//add's StatusBar height to android
const heightWithoutChart = 309 + (android && 24);
const heightWithChart = heightWithoutChart + 297;

export const initialChartExpandedStateSheetHeight =
  heightWithChart + (android && 40);

const ToastWrapper = styled(Column)`
  width: 100%;
  height: 320;
  z-index: 9;
`;

const formatGenericAsset = asset => {
  if (asset?.price?.value) {
    return {
      ...asset,
      native: { price: { amount: asset?.price?.value } },
    };
  }
  return asset;
};

export default function ChartExpandedState({ asset }) {
  const { genericAssets } = useSelector(({ data: { genericAssets } }) => ({
    genericAssets,
  }));
  // If we don't have a balance for this asset
  // It's a generic asset
  const assetWithPrice = asset.balance
    ? asset
    : genericAssets[asset.address]
    ? formatGenericAsset(genericAssets[asset.address])
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
    heightWithChart,
    heightWithoutChart,
  });

  const { lists } = useUniswapAssets();
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
  const assetWithWatchlistInfo = useMemo(() => {
    const watchlist = lists.find(list => list.id === 'watchlist');
    if (includes(watchlist.tokens, toLower(asset.address))) {
      return {
        ...assetWithPrice,
        isInWatchlist: true,
      };
    }
    return {
      ...assetWithPrice,
      isInWatchlist: false,
    };
  }, [lists, asset.address, assetWithPrice]);

  return (
    <Fragment>
      <SlackSheet
        additionalTopPadding={android}
        contentHeight={ChartExpandedStateSheetHeight}
        scrollEnabled={false}
      >
        <ChartPathProvider data={throttledData}>
          <Chart
            {...chartData}
            {...initialChartDataLabels}
            asset={assetWithWatchlistInfo}
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
        {asset.balance && (
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
            {asset.balance ? (
              <SendActionButton color={color} fullWidth={!showSwapButton} />
            ) : (
              <Column marginTop={70}>
                <SwapActionButton
                  color={color}
                  inputType={AssetInputTypes.out}
                  label={`􀖅 Get ${asset.symbol}`}
                  weight="heavy"
                />
              </Column>
            )}
          </SheetActionButtonRow>
        )}
      </SlackSheet>
      <ToastWrapper>
        <ToggleStateToast
          addCopy="Added to watchlist"
          isAdded={assetWithWatchlistInfo.isInWatchlist}
          removeCopy="Removed from watchlist"
        />
      </ToastWrapper>
    </Fragment>
  );
}
