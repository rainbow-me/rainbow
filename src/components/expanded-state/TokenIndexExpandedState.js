import { sortBy, times, toLower } from 'lodash';
import React, {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { ButtonPressAnimation } from '../animations';
import { AssetListItemSkeleton } from '../asset-list';
import { UnderlyingAssetCoinRow } from '../coin-row';
import { initialChartExpandedStateSheetHeight } from '../expanded-state/ChartExpandedState';
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
import { ChartPathProvider } from '@rainbow-me/animated-charts';
import AssetInputTypes from '@rainbow-me/helpers/assetInputTypes';
import {
  useAccountAssets,
  useAccountSettings,
  useChartThrottledPoints,
  useDimensions,
  useDPI,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { ETH_ADDRESS } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { position } from '@rainbow-me/styles';
import {
  convertRawAmountToNativeDisplay,
  divide,
  handleSignificantDecimals,
  multiply,
} from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';
import { ModalContext } from 'react-native-cool-modals/NativeStackView';
import ShadowStack from 'react-native-shadow-stack';

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
  const { colors, isDarkMode } = useTheme();
  const { allAssets } = useAccountAssets();
  const { navigate } = useNavigation();
  const { genericAssets } = useSelector(({ data: { genericAssets } }) => ({
    genericAssets,
  }));
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
    dpi: true,
  });

  const needsEth =
    asset?.address === ETH_ADDRESS && asset?.balance?.amount === '0';

  const duration = useRef(0);

  if (duration.current === 0) {
    duration.current = 300;
  }
  const { height: screenHeight } = useDimensions();

  const handlePress = useCallback(
    item => {
      const asset =
        ethereumUtils.getAsset(allAssets, toLower(item.address)) ||
        ethereumUtils.formatGenericAsset(
          genericAssets[toLower(item.address)],
          nativeCurrency
        );

      navigate(
        ios ? Routes.EXPANDED_ASSET_SHEET : Routes.EXPANDED_ASSET_SCREEN,
        {
          asset,
          longFormHeight: initialChartExpandedStateSheetHeight,
          type: 'token',
        }
      );
    },
    [allAssets, genericAssets, nativeCurrency, navigate]
  );

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
              testID="index-underlying-assets"
              weight="semibold"
            >
              Underlying Assets
            </Text>
          </Column>
          <Column align="end" flex={1}>
            <Text
              align="right"
              color={colors.alpha(colors.blueGreyDark, 0.5)}
              letterSpacing="roundedMedium"
              weight="semibold"
            >
              Makeup of 1 {assetWithPrice.symbol}
            </Text>
          </Column>
        </Row>
        <Column marginBottom={55} marginHorizontal={19} marginTop={12}>
          {underlying?.length
            ? underlying.map(item => (
                <Row
                  as={ButtonPressAnimation}
                  key={`dpi-${item?.address}`}
                  onPress={() => handlePress(item)}
                  scaleTo={0.95}
                  testID={`underlying-asset-${item.symbol}`}
                >
                  <Column align="start" flex={1}>
                    <UnderlyingAssetCoinRow {...item} />
                  </Column>
                  <Column aling="end">
                    <Row key={`allocation-${item.symbol}`}>
                      <Text
                        align="right"
                        color={colors.alpha(colors.blueGreyDark, 0.7)}
                        letterSpacing="roundedTight"
                        size="large"
                        weight="medium"
                      >
                        {item.pricePerUnitFormatted}
                      </Text>
                      <Column
                        align="end"
                        backgroundColor={colors.white}
                        height={30}
                        marginLeft={6}
                      >
                        <Column
                          height={16}
                          marginTop={android ? 8 : 3}
                          width={item.percentageAllocation * 2}
                        >
                          <ShadowStack
                            backgroundColor={item.color}
                            borderRadius={8}
                            shadows={[
                              [
                                0,
                                3,
                                9,
                                isDarkMode ? colors.shadow : item.color,
                                0.2,
                              ],
                            ]}
                            style={{
                              height: 16,
                              width: '100%',
                            }}
                          >
                            <LinearGradient
                              colors={[
                                colors.alpha(
                                  colors.whiteLabel,
                                  isDarkMode ? 0.2 : 0.3
                                ),
                                colors.alpha(colors.whiteLabel, 0),
                              ]}
                              end={{ x: 1, y: 0.5 }}
                              overflow="hidden"
                              pointerEvents="none"
                              start={{ x: 0, y: 0.5 }}
                              style={position.coverAsObject}
                            />
                          </ShadowStack>
                        </Column>
                      </Column>
                    </Row>
                  </Column>
                </Row>
              ))
            : times(3, index => (
                <AssetListItemSkeleton
                  animated
                  descendingOpacity
                  key={`underlying-assets-skeleton-${index}`}
                />
              ))}
        </Column>
      </SlackSheet>
    </Fragment>
  );
}
