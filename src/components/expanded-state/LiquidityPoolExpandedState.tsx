import { useRoute } from '@react-navigation/core';
import { toLower } from 'lodash';
import React, { Fragment, useEffect, useMemo } from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { UniBalanceHeightDifference } from '../../hooks/charts/useChartThrottledPoints';
import deviceUtils from '../../utils/deviceUtils';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../discover-sheet/EdgeFade' was resolved t... Remove this comment to see the full error message
import EdgeFade from '../discover-sheet/EdgeFade';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../investment-cards/PoolValue' was resolve... Remove this comment to see the full error message
import { PoolValue } from '../investment-cards/PoolValue';
import { Column, Row } from '../layout';

import {
  DepositActionButton,
  SheetActionButtonRow,
  SheetDivider,
  SlackSheet,
  WithdrawActionButton,
} from '../sheet';
import { Text } from '../text';
import { TokenInfoItem, TokenInfoRow, TokenInfoSection } from '../token-info';
import { Chart } from '../value-chart';
// @ts-expect-error ts-migrate(6142) FIXME: Module './unique-token/UnderlyingAsset' was resolv... Remove this comment to see the full error message
import UnderlyingAsset from './unique-token/UnderlyingAsset';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/animated-charts' o... Remove this comment to see the full error message
import { ChartPathProvider } from '@rainbow-me/animated-charts';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/context' or its co... Remove this comment to see the full error message
import { useTheme } from '@rainbow-me/context';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
import { toChecksumAddress } from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/bigNumberF... Remove this comment to see the full error message
import { bigNumberFormat } from '@rainbow-me/helpers/bigNumberFormat';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/chartTypes... Remove this comment to see the full error message
import chartTypes from '@rainbow-me/helpers/chartTypes';
import {
  useAccountSettings,
  useAsset,
  useChartThrottledPoints,
  useColorForAsset,
  useDimensions,
  usePoolDetails,
  useTotalFeeEarnedPerAsset,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/explorer' or... Remove this comment to see the full error message
import { emitAssetRequest } from '@rainbow-me/redux/explorer';

// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { ETH_ADDRESS } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { magicMemo, safeAreaInsetValues } from '@rainbow-me/utils';

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Spacer = styled.View`
  height: ${safeAreaInsetValues.bottom + 20};
`;

export const underlyingAssetsHeight = 70;
// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const heightWithoutChart = 452 + (android ? 20 - getSoftMenuBarHeight() : 0);
const heightWithChart = heightWithoutChart + 293;

export const initialLiquidityPoolExpandedStateSheetHeight = heightWithoutChart;

const formatTokenAddress = (address: any) => {
  if (!address || toLower(address) === ETH_ADDRESS) {
    return 'ETH';
  }
  return toChecksumAddress(address);
};

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const APYWrapper = styled.View`
  flex: 1;
  height: 23;
  padding-top: 3;
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const UnderlyingAssetsWrapper = styled.View`
  margin-horizontal: 19;
  margin-top: 12;
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const CarouselWrapper = styled.View`
  margin-top: 6;
`;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'ScrollView' does not exist on type 'Styl... Remove this comment to see the full error message
const Carousel = styled.ScrollView.attrs({
  contentContainerStyle: { paddingHorizontal: 7 },
  horizontal: true,
  showsHorizontalScrollIndicator: false,
})``;

const CarouselItem = styled(TokenInfoItem).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.7),
  letterSpacing: 'roundedTighter',
}))`
  margin-horizontal: 12;
`;

const LiquidityPoolExpandedState = () => {
  const { params } = useRoute();
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'asset' does not exist on type 'Readonly<... Remove this comment to see the full error message
  const { asset } = params;
  const { tokenNames, tokens, totalNativeDisplay, uniBalance } = asset;
  const dispatch = useDispatch();
  const { height: screenHeight } = useDimensions();

  const tokenAddresses = useMemo(() => {
    return tokens?.map((token: any) => formatTokenAddress(token.address));
  }, [tokens]);

  useEffect(() => {
    dispatch(emitAssetRequest(tokenAddresses.map(toLower)));
  }, [dispatch, tokenAddresses]);

  const { nativeCurrency } = useAccountSettings();

  const earnedFee = useTotalFeeEarnedPerAsset(asset?.address);
  const totalFeeEarned = useMemo(
    () =>
      earnedFee?.toLocaleString('en-US', {
        currency: nativeCurrency,
        style: 'currency',
      }),
    [earnedFee, nativeCurrency]
  );

  const details = usePoolDetails(asset.address);
  const { annualized_fees: fee, volume, nativeLiquidity } = details || {};

  const token0 = useAsset({
    address: toLower(tokenAddresses?.[0]),
    type: 'token',
  });

  const token1 = useAsset({
    address: toLower(tokenAddresses?.[1]),
    type: 'token',
  });

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
    heightWithChart: Math.min(
      heightWithChart + (token1 && token0 ? underlyingAssetsHeight : 0),
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'dimensions' does not exist on type '{}'.
      deviceUtils.dimensions.height
    ),
    heightWithoutChart: Math.min(
      heightWithoutChart + (token1 && token0 ? underlyingAssetsHeight : 0),
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'dimensions' does not exist on type '{}'.
      deviceUtils.dimensions.height
    ),
    isPool: true,
    secondStore: true,
    uniBalance: !!uniBalance,
  });

  const liquidityPoolExpandedStateSheetHeight =
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    (ios || showChart ? heightWithChart : heightWithoutChart) +
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    (android && 44) -
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    (uniBalance || android ? 0 : UniBalanceHeightDifference);

  const chartDataLabels = useMemo(() => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'asset' does not exist on type 'object'.
    if (chartType === chartTypes.month && params?.asset?.profit30d) {
      let overrideChartDataLabels = { ...initialChartDataLabels };
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'asset' does not exist on type 'object'.
      overrideChartDataLabels.latestChange = params.asset.profit30d;
      return overrideChartDataLabels;
    }
    return initialChartDataLabels;
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'asset' does not exist on type 'object'.
  }, [chartType, initialChartDataLabels, params?.asset?.profit30d]);

  const { colors } = useTheme();

  const color0 = useColorForAsset(token0);
  const color1 = useColorForAsset(token1);

  const half0 = token0?.price?.value * tokens[0].value;
  const half1 = token1?.price?.value * tokens[1].value;

  const token0Change = token0?.price?.relative_change_24h
    ?.toFixed(2)
    .replace('-', '')
    .concat('%');
  const token1Change = token1?.price?.relative_change_24h
    ?.toFixed(2)
    .replace('-', '')
    .concat('%');

  const formattedHalf0 = half0
    ? bigNumberFormat(half0, nativeCurrency, half0 >= 10000)
    : 'Half';
  const formattedHalf1 = half1
    ? bigNumberFormat(half1, nativeCurrency, half1 >= 10000)
    : 'Half';

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <SlackSheet
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      additionalTopPadding={android}
      contentHeight={liquidityPoolExpandedStateSheetHeight}
      scrollEnabled
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      {...(ios
        ? { height: '100%' }
        : { additionalTopPadding: true, contentHeight: screenHeight - 80 })}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ChartPathProvider data={throttledData}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'asset' does not exist on type 'object'.
            chartType === chartTypes.month && params?.asset?.profit30d
          }
          showChart={showChart}
          throttledData={throttledData}
        />
      </ChartPathProvider>
      {uniBalance ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Fragment>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <SheetDivider />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TokenInfoSection>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <TokenInfoRow>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TokenInfoItem title="Pool shares">{uniBalance}</TokenInfoItem>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TokenInfoItem title="Total value" weight="bold">
                {totalNativeDisplay}
              </TokenInfoItem>
            </TokenInfoRow>
          </TokenInfoSection>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <SheetActionButtonRow>
            {tokenAddresses?.length > 0 && (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <WithdrawActionButton
                symbol={tokenNames}
                token1Address={tokenAddresses[0]}
                token2Address={tokenAddresses[1]}
                type={asset.type}
                weight="bold"
              />
            )}
            {tokenAddresses?.length > 0 && (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <DepositActionButton
                symbol={tokenNames}
                token1Address={tokenAddresses[0]}
                token2Address={tokenAddresses[1]}
                type={asset.type}
                weight="bold"
              />
            )}
          </SheetActionButtonRow>
        </Fragment>
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <SheetActionButtonRow>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <DepositActionButton
            symbol={tokenNames}
            token1Address={tokenAddresses[0]}
            token2Address={tokenAddresses[1]}
            type={asset.type}
            weight="heavy"
          />
        </SheetActionButtonRow>
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <CarouselWrapper>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Carousel>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <CarouselItem loading={!fee} showDivider title="Annualized fees">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <APYWrapper>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <PoolValue
                simple
                size="larger"
                type="annualized_fees"
                value={Number(fee)}
              />
            </APYWrapper>
          </CarouselItem>
          {totalFeeEarned && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <CarouselItem
              loading={!totalFeeEarned}
              showDivider
              title="Fees earned"
            >
              {totalFeeEarned}
            </CarouselItem>
          )}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <CarouselItem loading={!volume} showDivider title="24h pool volume">
            {volume}
          </CarouselItem>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <CarouselItem loading={!nativeLiquidity} title="Pool size">
            {nativeLiquidity}
          </CarouselItem>
        </Carousel>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <EdgeFade />
      </CarouselWrapper>
      {token0 && token1 && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Row marginHorizontal={19} marginTop={27}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Column align="start" flex={1}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Text
                color={colors.alpha(colors.blueGreyDark, 0.5)}
                letterSpacing="roundedMedium"
                size="smedium"
                weight="semibold"
              >
                Underlying tokens
              </Text>
            </Column>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Column align="end" flex={1}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Text
                align="right"
                color={colors.alpha(colors.blueGreyDark, 0.5)}
                letterSpacing="roundedMedium"
                size="smedium"
                weight="semibold"
              >
                Pool makeup
              </Text>
            </Column>
          </Row>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <UnderlyingAssetsWrapper>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <UnderlyingAsset
              address={tokenAddresses[0]}
              change={token0Change}
              changeVisible={!uniBalance}
              color={color0}
              isPositive={token0?.price?.relative_change_24h > 0}
              name={
                uniBalance
                  ? `${tokens[0].value} ${tokens[0].symbol}`
                  : tokens[0].name
              }
              percentageAllocation={15}
              pricePerUnitFormatted={formattedHalf0}
              symbol={tokens[0].symbol}
            />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <UnderlyingAsset
              address={tokenAddresses[1]}
              change={token1Change}
              changeVisible={!uniBalance}
              color={color1}
              isPositive={token1?.price?.relative_change_24h > 0}
              name={
                uniBalance
                  ? `${tokens[1].value} ${tokens[1].symbol}`
                  : tokens[1].name
              }
              percentageAllocation={15}
              pricePerUnitFormatted={formattedHalf1}
              symbol={tokens[1].symbol}
            />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Spacer />
          </UnderlyingAssetsWrapper>
        </>
      )}
    </SlackSheet>
  );
};

export default magicMemo(LiquidityPoolExpandedState, 'asset');
