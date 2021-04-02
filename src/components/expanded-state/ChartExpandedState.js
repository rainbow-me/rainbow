import { find } from 'lodash';
import React, { useRef, useState } from 'react';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import useAdditionalAssetData from '../../hooks/useAdditionalAssetData';
import EdgeFade from '../discover-sheet/EdgeFade';
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
  useDimensions,
  useUniswapAssetsInWallet,
} from '@rainbow-me/hooks';
import { ethereumUtils } from '@rainbow-me/utils';

const baseHeight = 317 + (android && 20 - getSoftMenuBarHeight());
const heightWithoutChart = baseHeight + (android && 30);
const heightWithChart = baseHeight + 307;

export const initialChartExpandedStateSheetHeight = undefined;

const Carousel = styled.ScrollView.attrs({
  contentContainerStyle: { paddingHorizontal: 5 },
  horizontal: true,
  showsHorizontalScrollIndicator: false,
})``;

const CarouselItem = styled(TokenInfoItem).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.5),
  letterSpacing: 'roundedTighter',
}))`
  margin-horizontal: ${({ hidden }) => (hidden ? 0 : 13)};
`;

const CarouselWrapper = styled.View``;

export default function ChartExpandedState({ asset }) {
  const { genericAssets } = useSelector(({ data: { genericAssets } }) => ({
    genericAssets,
  }));
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
  } = useAdditionalAssetData(asset?.address, assetWithPrice?.price?.value);

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
      heightWithChart -
        (!hasBalance && 68) +
        descriptionHeight +
        scrollableContentHeight,
      screenHeight
    ),
    heightWithoutChart: Math.min(
      heightWithoutChart -
        (!hasBalance && 68) +
        descriptionHeight +
        scrollableContentHeight,
      screenHeight
    ),
    shortHeightWithChart: Math.min(
      heightWithChart - (!hasBalance && 68),
      screenHeight
    ),
    shortHeightWithoutChart: Math.min(
      heightWithoutChart - (!hasBalance && 68),
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

  const { colors } = useTheme();

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
      <CarouselWrapper>
        <Carousel>
          <CarouselItem hidden={!totalVolume} title="24h volume" weight="bold">
            {totalVolume}
          </CarouselItem>
          <CarouselItem hidden={!marketCap} title="Market cap" weight="bold">
            {marketCap}
          </CarouselItem>
          <CarouselItem
            hidden={!totalLiquidity}
            title="Uniswap liquidity"
            weight="bold"
          >
            {totalLiquidity}
          </CarouselItem>
        </Carousel>
        <EdgeFade />
      </CarouselWrapper>
      {!!description && (
        <ExpandedStateSection
          onLayout={({
            nativeEvent: {
              layout: { height },
            },
          }) => setDescriptionHeight(height)}
          title={`About ${asset?.name}`}
        >
          <Column>
            <Text
              color={colors.alpha(colors.blueGreyDark, 0.5)}
              lineHeight="paragraphSmall"
              size="lmedium"
            >
              {description}
            </Text>
          </Column>
        </ExpandedStateSection>
      )}
    </SlackSheet>
  );
}
