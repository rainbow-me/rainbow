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
import UnderlyingAsset from './unique-token/UnderlyingAsset';
import { ChartPathProvider } from '@rainbow-me/animated-charts';
import AssetInputTypes from '@rainbow-me/helpers/assetInputTypes';
import {
  useAccountSettings,
  useChartThrottledPoints,
  useDimensions,
  useDPI,
} from '@rainbow-me/hooks';
import { ETH_ADDRESS } from '@rainbow-me/references';
import {
  convertRawAmountToNativeDisplay,
  divide,
  handleSignificantDecimals,
  multiply,
} from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';
import { ModalContext } from 'react-native-cool-modals/NativeStackView';

const formatItem = (
  { address, name, price, symbol, color },
  nativeCurrencySymbol
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

export default function TokenIndexExpandedState({ asset }) {
  const { colors } = useTheme();
  const genericAssets = useSelector(
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

    const underlyingAssets = dpi?.underlying.map(asset => {
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
      underlyingAssets.filter(asset => asset !== null),
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
    <Fragment>
      <SlackSheet
        bottomInset={42}
        {...(ios
          ? { height: '100%' }
          : { additionalTopPadding: true, contentHeight: screenHeight - 80 })}
        testID="index-expanded-state"
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
            testID="index"
            throttledData={throttledData}
          />
        </ChartPathProvider>
        <SheetDivider />
        {needsEth ? (
          <SheetActionButtonRow>
            <BuyActionButton color={color} fullWidth />
          </SheetActionButtonRow>
        ) : (
          <SheetActionButtonRow>
            <Column marginTop={5}>
              <SwapActionButton
                color={color}
                fullWidth
                inputType={AssetInputTypes.out}
                label={`􀖅 Get ${asset?.symbol}`}
                weight="heavy"
              />
            </Column>
          </SheetActionButtonRow>
        )}
        <Row marginHorizontal={19} marginTop={6}>
          <Column align="start" flex={1}>
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
          <Column align="end" flex={1}>
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
        <Column marginBottom={55} marginHorizontal={19} marginTop={12}>
          {underlying?.length
            ? underlying.map(item => (
                <UnderlyingAsset {...item} changeVisible key={item.address} />
              ))
            : times(3, index => (
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
