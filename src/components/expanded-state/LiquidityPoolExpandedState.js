import { useRoute } from '@react-navigation/core';
import { map, toLower } from 'lodash';
import React, { Fragment, useMemo } from 'react';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import styled from 'styled-components';
import { UniBalanceHeightDifference } from '../../hooks/charts/useChartThrottledPoints';
import useNativeCurrencyToUSD from '../../hooks/useNativeCurrencyToUSD';
import { useUsersPositions } from '../../hooks/useUsersPositions';
import { renderPoolValue } from '../investment-cards/renderPoolValue';

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
import { useTheme } from '@rainbow-me/context';
import { toChecksumAddress } from '@rainbow-me/handlers/web3';
import chartTypes from '@rainbow-me/helpers/chartTypes';
import {
  useAccountSettings,
  useChartThrottledPoints,
  usePoolDetails,
} from '@rainbow-me/hooks';
import { ETH_ADDRESS } from '@rainbow-me/references';
import { magicMemo } from '@rainbow-me/utils';

const heightWithoutChart = 452 + (android ? 20 - getSoftMenuBarHeight() : 0);
const heightWithChart = heightWithoutChart + 293;

export const initialLiquidityPoolExpandedStateSheetHeight = heightWithChart;

const formatTokenAddress = address => {
  if (!address || toLower(address) === ETH_ADDRESS) {
    return 'ETH';
  }
  return toChecksumAddress(address);
};

const APYWrapper = styled.View`
  padding-top: 5;
  flex: 1;
`;

const Carousel = styled.ScrollView.attrs({
  horizontal: true,
})``;

const LiquidityPoolExpandedState = () => {
  const { params } = useRoute();
  const { asset } = params;
  const { tokenNames, tokens, totalNativeDisplay, type, uniBalance } = asset;

  const tokenType = type === 'uniswap' ? 'UNI-V1' : 'UNI-V2';
  const uniBalanceLabel = `${uniBalance} ${tokenType}`;
  const { nativeCurrency } = useAccountSettings();

  const positions = useUsersPositions();

  const totalFeeEarned = useMemo(
    () =>
      nativeCurrency === 'USD'
        ? positions
            ?.find(({ pair: { id } }) => id === asset.address)
            ?.fees.sum.toLocaleString('en-US', {
              currency: 'USD',
              style: 'currency',
            })
        : '',
    [asset.address, nativeCurrency, positions]
  );

  useNativeCurrencyToUSD();

  const details = usePoolDetails(asset.address);
  const { annualized_fees: fee, oneDayVolumeUSD } = details || {};

  const volume = useMemo(
    () =>
      oneDayVolumeUSD?.toLocaleString('en-US', {
        currency: 'USD',
        style: 'currency',
      }),
    [oneDayVolumeUSD]
  );

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
    uniBalance: !!uniBalance,
  });

  const liquidityPoolExpandedStateSheetHeight =
    (ios || showChart ? heightWithChart : heightWithoutChart) +
    (android && 44) -
    (uniBalance ? 0 : UniBalanceHeightDifference);

  const tokenAddresses = useMemo(() => {
    return tokens?.map(token => formatTokenAddress(token.address));
  }, [tokens]);

  const chartDataLabels = useMemo(() => {
    if (chartType === chartTypes.month && params?.asset?.profit30d) {
      let overrideChartDataLabels = { ...initialChartDataLabels };
      overrideChartDataLabels.latestChange = params.asset.profit30d;
      return overrideChartDataLabels;
    }
    return initialChartDataLabels;
  }, [chartType, initialChartDataLabels, params?.asset?.profit30d]);

  const { colors } = useTheme();

  return (
    <SlackSheet
      additionalTopPadding={android}
      contentHeight={liquidityPoolExpandedStateSheetHeight}
      {...(ios && { height: '100%' })}
      scrollEnabled
    >
      <ChartPathProvider data={throttledData}>
        <Chart
          {...chartData}
          {...chartDataLabels}
          asset={asset}
          chart={chart}
          chartType={chartType}
          color={color}
          fetchingCharts={fetchingCharts}
          isPool
          nativePoints={chart}
          overrideValue={
            chartType === chartTypes.month && params?.asset?.profit30d
          }
          showChart={showChart}
          throttledData={throttledData}
        />
      </ChartPathProvider>
      {uniBalance ? (
        <Fragment>
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
              <TokenInfoItem title="Pool shares">
                {uniBalanceLabel}
              </TokenInfoItem>
              <TokenInfoItem title="Total value" weight="bold">
                {totalNativeDisplay}
              </TokenInfoItem>
            </TokenInfoRow>
            <Carousel>
              <TokenInfoItem hidden={!fee} title="Annualized fees">
                <APYWrapper>
                  {renderPoolValue(
                    'annualized_fees',
                    Number(fee),
                    nativeCurrency,
                    colors
                  )}
                </APYWrapper>
              </TokenInfoItem>
              <TokenInfoItem
                hidden={!totalFeeEarned}
                title="Total fee earned"
                weight="bold"
              >
                {totalFeeEarned} 🤑
              </TokenInfoItem>
              <TokenInfoItem
                hidden={!totalFeeEarned}
                title="Pool volume 24h"
                weight="bold"
              >
                {volume}
              </TokenInfoItem>
              <TokenInfoItem
                hidden={!totalFeeEarned}
                title="30d profit"
                weight="bold"
              >
                {volume}
              </TokenInfoItem>
            </Carousel>
          </TokenInfoSection>
          <SheetActionButtonRow>
            {tokenAddresses?.length > 0 && (
              <WithdrawActionButton
                symbol={tokenNames}
                token1Address={tokenAddresses[0]}
                token2Address={tokenAddresses[1]}
                weight="bold"
              />
            )}
            {tokenAddresses?.length > 0 && (
              <DepositActionButton
                symbol={tokenNames}
                token1Address={tokenAddresses[0]}
                token2Address={tokenAddresses[1]}
                weight="bold"
              />
            )}
          </SheetActionButtonRow>
        </Fragment>
      ) : (
        <SheetActionButtonRow>
          <DepositActionButton
            fullWidth
            symbol={tokenNames}
            token1Address={tokenAddresses[0]}
            token2Address={tokenAddresses[1]}
            weight="bold"
          />
        </SheetActionButtonRow>
      )}
    </SlackSheet>
  );
};

export default magicMemo(LiquidityPoolExpandedState, 'asset');
