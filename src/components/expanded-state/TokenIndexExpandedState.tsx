import { sortBy, times, toLower } from 'lodash';
import React, { Fragment, useContext, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { AssetListItemSkeleton } from '../asset-list';
import { Column, Row } from '../layout';
import {
  BuyActionButton,
  SheetActionButtonRow,
  SheetDivider,
  SlackSheet,
  SwapActionButton,
} from '../sheet';
import { Text } from '../text';
import { Chart } from '../value-chart';
// @ts-expect-error ts-migrate(6142) FIXME: Module './unique-token/UnderlyingAsset' was resolv... Remove this comment to see the full error message
import UnderlyingAsset from './unique-token/UnderlyingAsset';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/animated-charts' o... Remove this comment to see the full error message
import { ChartPathProvider } from '@rainbow-me/animated-charts';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/assetInput... Remove this comment to see the full error message
import AssetInputTypes from '@rainbow-me/helpers/assetInputTypes';
import {
  useAccountSettings,
  useChartThrottledPoints,
  useDimensions,
  useDPI,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { ETH_ADDRESS } from '@rainbow-me/references';
import {
  convertRawAmountToNativeDisplay,
  divide,
  handleSignificantDecimals,
  multiply,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
} from '@rainbow-me/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils } from '@rainbow-me/utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-cool-modals/Nativ... Remove this comment to see the full error message
import { ModalContext } from 'react-native-cool-modals/NativeStackView';

const formatItem = (
  { address, name, price, symbol, color }: any,
  nativeCurrencySymbol: any
) => {
  const change = `${parseFloat(
    (price.relative_change_24h || 0).toFixed(2)
  )}%`.replace('-', '');

  const value = `${nativeCurrencySymbol}${handleSignificantDecimals(
    price.value,
    2
  )} `;

  return {
    address,
    change,
    color,
    isPositive: price.relative_change_24h > 0,
    name,
    price: value,
    symbol,
  };
};

export default function TokenIndexExpandedState({ asset }: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const genericAssets = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
    ({ data: { genericAssets } }) => genericAssets
  );
  const { nativeCurrency, nativeCurrencySymbol } = useAccountSettings();

  const dpi = useDPI();

  const underlying = useMemo(() => {
    if (!dpi) return [];
    const baseAsset = ethereumUtils.formatGenericAsset(
      genericAssets[toLower(dpi?.base?.address)],
      nativeCurrency
    );

    const underlyingAssets = dpi?.underlying.map((asset: any) => {
      const genericAsset = genericAssets[toLower(asset?.address)];
      if (!genericAsset) return null;
      const assetWithPrice = ethereumUtils.formatGenericAsset(
        genericAsset,
        nativeCurrency
      );

      const {
        display: pricePerUnitFormatted,
        amount: pricePerUnit,
      } = convertRawAmountToNativeDisplay(
        asset.amount,
        asset.decimals,
        assetWithPrice?.price?.value || 0,
        nativeCurrency
      );

      const percentageAllocation = Number(
        divide(multiply(pricePerUnit, 100), baseAsset.price.value)
      );

      return {
        ...formatItem(assetWithPrice, nativeCurrencySymbol),
        color: assetWithPrice.color,
        percentageAllocation,
        pricePerUnitFormatted,
      };
    });
    return sortBy(
      underlyingAssets.filter((asset: any) => asset !== null),
      'percentageAllocation'
    ).reverse();
  }, [dpi, genericAssets, nativeCurrency, nativeCurrencySymbol]);

  const hasUnderlying = underlying.length !== 0;
  const { layout } = useContext(ModalContext) || {};

  useEffect(() => {
    if (hasUnderlying) {
      layout?.();
    }
  }, [hasUnderlying, layout]);

  // If we don't have a balance for this asset
  // It's a generic asset
  const assetWithPrice = ethereumUtils.formatGenericAsset(
    genericAssets[asset?.address],
    nativeCurrency
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
    asset: assetWithPrice,
    secondStore: true,
  });

  const needsEth =
    asset?.address === ETH_ADDRESS && asset?.balance?.amount === '0';

  const duration = useRef(0);

  if (duration.current === 0) {
    duration.current = 300;
  }
  const { height: screenHeight } = useDimensions();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SlackSheet
        bottomInset={42}
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
        {...(ios
          ? { height: '100%' }
          : { additionalTopPadding: true, contentHeight: screenHeight - 80 })}
        testID="index-expanded-state"
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
            {...initialChartDataLabels}
            asset={assetWithPrice}
            chart={chart}
            chartType={chartType}
            color={color}
            fetchingCharts={fetchingCharts}
            nativePoints={chart}
            showChart={showChart}
            testID="index"
            throttledData={throttledData}
          />
        </ChartPathProvider>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SheetDivider />
        {needsEth ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <SheetActionButtonRow>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <BuyActionButton color={color} />
          </SheetActionButtonRow>
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <SheetActionButtonRow>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Column marginTop={5}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <SwapActionButton
                color={color}
                inputType={AssetInputTypes.out}
                label={`􀖅 Get ${asset?.symbol}`}
                weight="heavy"
              />
            </Column>
          </SheetActionButtonRow>
        )}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Row marginHorizontal={19} marginTop={6}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Column align="start" flex={1}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              color={colors.alpha(colors.blueGreyDark, 0.5)}
              letterSpacing="roundedMedium"
              size="smedium"
              testID="index-underlying-assets"
              weight="semibold"
            >
              Underlying tokens
            </Text>
          </Column>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Column align="end" flex={1}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              align="right"
              color={colors.alpha(colors.blueGreyDark, 0.5)}
              letterSpacing="roundedMedium"
              size="smedium"
              weight="semibold"
            >
              Makeup of 1 {assetWithPrice.symbol}
            </Text>
          </Column>
        </Row>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Column marginBottom={55} marginHorizontal={19} marginTop={12}>
          {underlying?.length
            ? underlying.map(item => (
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <UnderlyingAsset {...item} changeVisible key={item.address} />
              ))
            : times(3, index => (
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <AssetListItemSkeleton
                  animated
                  descendingOpacity
                  ignorePaddingHorizontal
                  key={`underlying-assets-skeleton-${index}`}
                />
              ))}
        </Column>
      </SlackSheet>
    </Fragment>
  );
}
