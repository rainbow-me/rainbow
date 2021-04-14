import { find } from 'lodash';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import useAdditionalAssetData from '../../hooks/useAdditionalAssetData';
import { ModalContext } from '../../react-native-cool-modals/NativeStackView';
import { CoinDividerHeight } from '../coin-divider';
import CoinDividerOpenButton from '../coin-divider/CoinDividerOpenButton';
import EdgeFade from '../discover-sheet/EdgeFade';
import UniswapPools from '../discover-sheet/UniswapPoolsSection';
import { Column } from '../layout';

import {
  BuyActionButton,
  SendActionButton,
  SheetActionButtonRow,
  SheetDivider,
  SlackSheet,
  SwapActionButton,
} from '../sheet';
import { Text } from '../text';
import {
  TokenInfoBalanceValue,
  TokenInfoItem,
  TokenInfoRow,
  TokenInfoSection,
} from '../token-info';
import { Chart } from '../value-chart';
import ExpandedStateSection from './ExpandedStateSection';
import { ChartPathProvider } from '@rainbow-me/animated-charts';
import AssetInputTypes from '@rainbow-me/helpers/assetInputTypes';
import {
  useAccountSettings,
  useChartThrottledPoints,
  useDelayedValueWithLayoutAnimation,
  useDimensions,
  useUniswapAssetsInWallet,
} from '@rainbow-me/hooks';
import { ethereumUtils, safeAreaInsetValues } from '@rainbow-me/utils';

const defaultCarouselHeight = 60;
const baseHeight =
  386 + (android && 20 - getSoftMenuBarHeight()) - defaultCarouselHeight;
const heightWithoutChart = baseHeight + (android && 30);
const heightWithChart = baseHeight + 292;

export const initialChartExpandedStateSheetHeight = undefined;

const Carousel = styled.ScrollView.attrs({
  contentContainerStyle: {
    paddingBottom: 11,
    paddingHorizontal: 7,
    paddingTop: 6,
  },
  horizontal: true,
  showsHorizontalScrollIndicator: false,
})``;

const AdditionalContentWrapper = styled.View``;

const CarouselItem = styled(TokenInfoItem).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.7),
  letterSpacing: 'roundedTighter',
  weight: 'semibold',
}))`
  margin-horizontal: 12;
`;

const TIMEOUT = 15000;

function CarouselWrapper({
  style,
  isAnyItemVisible,
  isAnyItemLoading,
  setCarouselHeight,
  ...props
}) {
  const [visible, setVisible] = useState(true);
  const timeout = useRef();
  useEffect(() => {
    clearTimeout(timeout.current);
    if (!isAnyItemVisible) {
      timeout.current = setTimeout(
        () => {
          setVisible(false);
          setCarouselHeight(0);
        },
        isAnyItemLoading ? TIMEOUT : 0
      );
    } else {
      setVisible(true);
      setCarouselHeight(defaultCarouselHeight);
    }
  }, [isAnyItemLoading, isAnyItemVisible, setCarouselHeight]);
  const delayedVisible = useDelayedValueWithLayoutAnimation(visible);
  return (
    <View
      {...props}
      style={[
        style,
        {
          opacity: delayedVisible ? 1 : 0,
        },
      ]}
    />
  );
}

const Spacer = styled.View`
  height: ${safeAreaInsetValues.bottom};
`;

export default function ChartExpandedState({ asset }) {
  const { genericAssets } = useSelector(({ data: { genericAssets } }) => ({
    genericAssets,
  }));

  const [carouselHeight, setCarouselHeight] = useState(defaultCarouselHeight);
  const { nativeCurrency } = useAccountSettings();
  const [descriptionHeight, setDescriptionHeight] = useState(0);

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

  const { height: screenHeight } = useDimensions();
  const {
    description,
    marketCap,
    totalLiquidity,
    totalVolume,
    marketCapLoading,
    totalLiquidityLoading,
    totalVolumeLoading,
  } = useAdditionalAssetData(asset?.address, assetWithPrice?.price?.value);

  const delayedDescriptions = useDelayedValueWithLayoutAnimation(description);

  const scrollableContentHeight =
    !!totalVolume || !!marketCap || !!totalLiquidity ? 68 : 0;

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
    heightWithChart: Math.min(
      carouselHeight +
        heightWithChart -
        (!hasBalance && 68) +
        descriptionHeight +
        (descriptionHeight === 0 ? 0 : scrollableContentHeight),
      screenHeight
    ),
    heightWithoutChart: Math.min(
      carouselHeight +
        heightWithoutChart -
        (!hasBalance && 68) +
        descriptionHeight +
        (descriptionHeight === 0 ? 0 : scrollableContentHeight),
      screenHeight
    ),
    shortHeightWithChart: Math.min(
      carouselHeight + heightWithChart - (!hasBalance && 68),
      screenHeight
    ),
    shortHeightWithoutChart: Math.min(
      carouselHeight + heightWithoutChart - (!hasBalance && 68),
      screenHeight
    ),
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

  const { layout } = useContext(ModalContext) || {};

  const { colors } = useTheme();

  const [morePoolsVisible, setMorePoolsVisible] = useState(false);

  const delayedMorePoolsVisible = useDelayedValueWithLayoutAnimation(
    morePoolsVisible
  );

  const MoreButton = useCallback(() => {
    return (
      <CoinDividerOpenButton
        coinDividerHeight={CoinDividerHeight}
        isActive
        isSmallBalancesOpen={delayedMorePoolsVisible}
        marginLeft={18}
        onPress={() => setMorePoolsVisible(prev => !prev)}
      />
    );
  }, [delayedMorePoolsVisible]);

  return (
    <SlackSheet
      additionalTopPadding={android}
      contentHeight={ChartExpandedStateSheetHeight}
      scrollEnabled
      {...(ios
        ? { height: '100%' }
        : { additionalTopPadding: true, contentHeight: screenHeight - 80 })}
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
      <CarouselWrapper
        isAnyItemLoading={
          totalVolumeLoading || totalLiquidityLoading || marketCapLoading
        }
        isAnyItemVisible={!!(totalVolume || totalLiquidity || marketCap)}
        setCarouselHeight={setCarouselHeight}
      >
        <Carousel>
          <CarouselItem
            loading={totalVolumeLoading}
            showDivider
            title="24h volume"
            weight="bold"
          >
            {totalVolume}
          </CarouselItem>
          <CarouselItem
            loading={totalLiquidityLoading}
            showDivider
            title="Uniswap liquidity"
            weight="bold"
          >
            {totalLiquidity}
          </CarouselItem>
          <CarouselItem
            loading={marketCapLoading}
            title="Market cap"
            weight="bold"
          >
            {marketCap}
          </CarouselItem>
        </Carousel>
        <EdgeFade />
      </CarouselWrapper>
      <AdditionalContentWrapper
        onLayout={({
          nativeEvent: {
            layout: { height },
          },
        }) => {
          setDescriptionHeight(height);
          layout?.();
        }}
      >
        <UniswapPools
          ShowMoreButton={MoreButton}
          alwaysShowMoreButton
          forceShowAll={delayedMorePoolsVisible}
          hideIfEmpty
          initialPageAmount={3}
          token={asset?.address}
        />

        {!!delayedDescriptions && (
          <ExpandedStateSection title={`About ${asset?.name}`}>
            <Column>
              <Text
                color={colors.alpha(colors.blueGreyDark, 0.5)}
                lineHeight="paragraphSmall"
                size="lmedium"
              >
                {description}
              </Text>
            </Column>
            <Spacer />
          </ExpandedStateSection>
        )}
      </AdditionalContentWrapper>
    </SlackSheet>
  );
}
