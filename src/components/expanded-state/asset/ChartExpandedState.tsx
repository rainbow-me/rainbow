import { find } from 'lodash';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { LayoutAnimation, View } from 'react-native';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import useAdditionalAssetData from '../../../hooks/useAdditionalAssetData';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../../react-native-cool-modals/NativeSt... Remove this comment to see the full error message
import { ModalContext } from '../../../react-native-cool-modals/NativeStackView';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../L2Disclaimer' was resolved to '/User... Remove this comment to see the full error message
import L2Disclaimer from '../../L2Disclaimer';
import { ButtonPressAnimation } from '../../animations';
import { CoinDividerHeight } from '../../coin-divider';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../coin-divider/CoinDividerOpenButton' ... Remove this comment to see the full error message
import CoinDividerOpenButton from '../../coin-divider/CoinDividerOpenButton';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../discover-sheet/EdgeFade' was resolve... Remove this comment to see the full error message
import EdgeFade from '../../discover-sheet/EdgeFade';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../discover-sheet/UniswapPoolsSection' ... Remove this comment to see the full error message
import UniswapPools from '../../discover-sheet/UniswapPoolsSection';
import {
  BuyActionButton,
  SendActionButton,
  SheetActionButtonRow,
  SheetDivider,
  SlackSheet,
  SwapActionButton,
} from '../../sheet';
import { Text } from '../../text';
import {
  TokenInfoBalanceValue,
  TokenInfoItem,
  TokenInfoRow,
  TokenInfoSection,
} from '../../token-info';
import { Chart } from '../../value-chart';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../ExpandedStateSection' was resolved to '... Remove this comment to see the full error message
import ExpandedStateSection from '../ExpandedStateSection';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SocialLinks' was resolved to '/Users/nic... Remove this comment to see the full error message
import SocialLinks from './SocialLinks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/animated-charts' o... Remove this comment to see the full error message
import { ChartPathProvider } from '@rainbow-me/animated-charts';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
import { isL2Network } from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/assetInput... Remove this comment to see the full error message
import AssetInputTypes from '@rainbow-me/helpers/assetInputTypes';
import {
  useAccountSettings,
  useChartThrottledPoints,
  useDelayedValueWithLayoutAnimation,
  useDimensions,
  useUniswapAssetsInWallet,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { ETH_ADDRESS } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils, safeAreaInsetValues } from '@rainbow-me/utils';

const defaultCarouselHeight = 60;
const baseHeight =
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  386 + (android && 20 - getSoftMenuBarHeight()) - defaultCarouselHeight;
// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const heightWithoutChart = baseHeight + (android && 30);
const heightWithChart = baseHeight + 292;

export const initialChartExpandedStateSheetHeight = undefined;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'ScrollView' does not exist on type 'Styl... Remove this comment to see the full error message
const Carousel = styled.ScrollView.attrs({
  contentContainerStyle: {
    paddingBottom: 11,
    paddingHorizontal: 7,
    paddingTop: 6,
  },
  horizontal: true,
  showsHorizontalScrollIndicator: false,
})``;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const AdditionalContentWrapper = styled.View``;

const CarouselItem = styled(TokenInfoItem).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.7),
  letterSpacing: 'roundedTighter',
  weight: 'semibold',
}))`
  margin-horizontal: 12;
`;

const TIMEOUT = 15000;

const ReadMoreButton = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.8),
  lineHeight: 37,
  size: 'lmedium',
  weight: 'heavy',
}))``;

function CarouselWrapper({
  style,
  isAnyItemVisible,
  isAnyItemLoading,
  setCarouselHeight,
  ...props
}: any) {
  const [visible, setVisible] = useState(true);
  const timeout = useRef();
  useEffect(() => {
    clearTimeout(timeout.current);
    if (!isAnyItemVisible) {
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'Timeout' is not assignable to type 'undefine... Remove this comment to see the full error message
      timeout.current = setTimeout(
        () => {
          setVisible(false);
          setCarouselHeight?.(0);
        },
        isAnyItemLoading ? TIMEOUT : 0
      );
    } else {
      setVisible(true);
      setCarouselHeight?.(defaultCarouselHeight);
    }
  }, [isAnyItemLoading, isAnyItemVisible, setCarouselHeight]);
  const delayedVisible = useDelayedValueWithLayoutAnimation(visible);
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Spacer = styled.View`
  height: ${safeAreaInsetValues.bottom + 20 + getSoftMenuBarHeight()};
`;

// truncate after the first paragraph or 4th dot
function truncate(text: any) {
  const firstParagraph = text?.split('\n')[0];
  const first4Sentences = text?.split('.').slice(0, 4).join('.') + '.';
  const shorterOne =
    first4Sentences.length < firstParagraph.length
      ? first4Sentences
      : firstParagraph;
  // If there is not much to expand, return the whole text
  if (text.length < shorterOne.length * 1.5) {
    return text;
  }

  return shorterOne;
}

function Description({ text }: any) {
  const truncatedText = truncate(text);
  const needToTruncate = truncatedText.length !== text.length;
  const [truncated, setTruncated] = useState(true);
  const delayedTruncated = useDelayedValueWithLayoutAnimation(
    truncated,
    LayoutAnimation.Properties.scaleXY
  );

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      disabled={!needToTruncate || !truncated}
      onPress={() => setTruncated(prev => !prev)}
      scaleTo={1}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Text
        color={colors.alpha(colors.blueGreyDark, 0.5)}
        lineHeight="big"
        size="large"
      >
        {delayedTruncated ? truncatedText : text}
      </Text>
      {truncated && needToTruncate && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ReadMoreButton>Read more 􀯼</ReadMoreButton>
      )}
    </ButtonPressAnimation>
  );
}

export default function ChartExpandedState({ asset }: any) {
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
  const { genericAssets } = useSelector(({ data: { genericAssets } }) => ({
    genericAssets,
  }));

  const [carouselHeight, setCarouselHeight] = useState(defaultCarouselHeight);
  const { nativeCurrency } = useAccountSettings();
  const [additionalContentHeight, setAdditionalContentHeight] = useState(0);

  // If we don't have a balance for this asset
  // It's a generic asset
  const hasBalance = asset?.balance;
  const assetWithPrice = hasBalance
    ? { ...asset }
    : genericAssets[asset?.address]
    ? ethereumUtils.formatGenericAsset(
        genericAssets[asset?.address],
        nativeCurrency
      )
    : { ...asset };
  if (assetWithPrice?.mainnet_address) {
    assetWithPrice.l2Address = assetWithPrice.address;
    assetWithPrice.address = assetWithPrice.mainnet_address;
  }

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const isL2 = useMemo(() => isL2Network(assetWithPrice.type), [
    assetWithPrice.type,
  ]);
  // This one includes the original l2 address if exists
  const ogAsset = {
    ...assetWithPrice,
    address: isL2 ? assetWithPrice.l2Address : assetWithPrice.address,
  };

  const { height: screenHeight } = useDimensions();
  const {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'description' does not exist on type '{ d... Remove this comment to see the full error message
    description,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'marketCap' does not exist on type '{ des... Remove this comment to see the full error message
    marketCap,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'totalLiquidity' does not exist on type '... Remove this comment to see the full error message
    totalLiquidity,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'totalVolume' does not exist on type '{ d... Remove this comment to see the full error message
    totalVolume,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'marketCapLoading' does not exist on type... Remove this comment to see the full error message
    marketCapLoading,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'totalLiquidityLoading' does not exist on... Remove this comment to see the full error message
    totalLiquidityLoading,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'totalVolumeLoading' does not exist on ty... Remove this comment to see the full error message
    totalVolumeLoading,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'links' does not exist on type '{ descrip... Remove this comment to see the full error message
    links,
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
        // @ts-expect-error ts-migrate(2363) FIXME: The right-hand side of an arithmetic operation mus... Remove this comment to see the full error message
        (!hasBalance && 68) +
        additionalContentHeight +
        (additionalContentHeight === 0 ? 0 : scrollableContentHeight),
      screenHeight
    ),
    heightWithoutChart: Math.min(
      carouselHeight +
        heightWithoutChart -
        // @ts-expect-error ts-migrate(2363) FIXME: The right-hand side of an arithmetic operation mus... Remove this comment to see the full error message
        (!hasBalance && 68) +
        additionalContentHeight +
        (additionalContentHeight === 0 ? 0 : scrollableContentHeight),
      screenHeight
    ),
    shortHeightWithChart: Math.min(
      // @ts-expect-error ts-migrate(2363) FIXME: The right-hand side of an arithmetic operation mus... Remove this comment to see the full error message
      carouselHeight + heightWithChart - (!hasBalance && 68),
      screenHeight
    ),
    shortHeightWithoutChart: Math.min(
      // @ts-expect-error ts-migrate(2363) FIXME: The right-hand side of an arithmetic operation mus... Remove this comment to see the full error message
      carouselHeight + heightWithoutChart - (!hasBalance && 68),
      screenHeight
    ),
  });

  const uniswapAssetsInWallet = useUniswapAssetsInWallet();
  const showSwapButton =
    !isL2 && find(uniswapAssetsInWallet, ['address', assetWithPrice.address]);

  const needsEth =
    asset?.address === ETH_ADDRESS && asset?.balance?.amount === '0';

  const duration = useRef(0);

  if (duration.current === 0) {
    duration.current = 300;
  }

  let ChartExpandedStateSheetHeight =
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    ios || showChart ? heightWithChart : heightWithoutChart;

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  if (android && !hasBalance) {
    ChartExpandedStateSheetHeight -= 60;
  }

  const { navigate } = useNavigation();

  const handleL2DisclaimerPress = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      type: assetWithPrice.type,
    });
  }, [assetWithPrice.type, navigate]);

  const { layout } = useContext(ModalContext) || {};

  const [morePoolsVisible, setMorePoolsVisible] = useState(false);

  const delayedMorePoolsVisible = useDelayedValueWithLayoutAnimation(
    morePoolsVisible
  );

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  const MoreButton = useCallback(() => {
    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <CoinDividerOpenButton
        coinDividerHeight={CoinDividerHeight}
        isActive
        isSendSheet
        isSmallBalancesOpen={delayedMorePoolsVisible}
        marginLeft={19}
        marginTop={5}
        onPress={() => setMorePoolsVisible(prev => !prev)}
      />
    );
  }, [delayedMorePoolsVisible]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <SlackSheet
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      additionalTopPadding={android}
      contentHeight={ChartExpandedStateSheetHeight}
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
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SheetDivider />
      {hasBalance && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <TokenInfoSection>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TokenInfoRow>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <TokenInfoItem asset={assetWithPrice} title="Balance">
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TokenInfoBalanceValue asset={asset} />
            </TokenInfoItem>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <TokenInfoItem
              title={asset?.native?.balance.display ? 'Value' : ' '}
              weight="bold"
            >
              {asset?.native?.balance.display || ' '}
            </TokenInfoItem>
          </TokenInfoRow>
        </TokenInfoSection>
      )}
      {needsEth ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <SheetActionButtonRow paddingBottom={isL2 && 19}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <BuyActionButton color={color} />
        </SheetActionButtonRow>
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <SheetActionButtonRow paddingBottom={isL2 && 19}>
          {showSwapButton && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <SwapActionButton color={color} inputType={AssetInputTypes.in} />
          )}
          {hasBalance ? (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <SendActionButton asset={ogAsset} color={color} />
          ) : (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <SwapActionButton
              color={color}
              inputType={AssetInputTypes.out}
              label={`􀖅 Get ${asset?.symbol}`}
              requireVerification
              verified={asset?.isVerified}
              weight="heavy"
            />
          )}
        </SheetActionButtonRow>
      )}
      {isL2 && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <L2Disclaimer
          assetType={assetWithPrice.type}
          colors={colors}
          onPress={handleL2DisclaimerPress}
          symbol={assetWithPrice.symbol}
        />
      )}
      {!isL2 && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <CarouselWrapper
          isAnyItemLoading={
            totalVolumeLoading || totalLiquidityLoading || marketCapLoading
          }
          isAnyItemVisible={!!(totalVolume || totalLiquidity || marketCap)}
          setCarouselHeight={setCarouselHeight}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Carousel>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <CarouselItem
              loading={totalVolumeLoading}
              showDivider
              title="24h volume"
              weight="bold"
            >
              {totalVolume}
            </CarouselItem>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <CarouselItem
              loading={totalLiquidityLoading}
              showDivider
              title="Uniswap liquidity"
              weight="bold"
            >
              {totalLiquidity}
            </CarouselItem>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <CarouselItem
              loading={marketCapLoading}
              title="Market cap"
              weight="bold"
            >
              {marketCap}
            </CarouselItem>
          </Carousel>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <EdgeFade />
        </CarouselWrapper>
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <AdditionalContentWrapper
        onLayout={({
          nativeEvent: {
            layout: { height },
          },
        }: any) => {
          setAdditionalContentHeight(height);
          layout?.();
        }}
      >
        {!isL2 && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <UniswapPools
            ShowMoreButton={MoreButton}
            alwaysShowMoreButton
            forceShowAll={delayedMorePoolsVisible}
            hideIfEmpty
            initialPageAmount={3}
            token={asset?.address}
          />
        )}
        {!!delayedDescriptions && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <ExpandedStateSection isL2 title={`About ${asset?.name}`}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Description text={description} />
          </ExpandedStateSection>
        )}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SocialLinks
          address={ogAsset.address}
          color={color}
          isNativeAsset={assetWithPrice?.isNativeAsset}
          links={links}
          marginTop={!delayedDescriptions && 19}
          type={asset?.type}
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Spacer />
      </AdditionalContentWrapper>
    </SlackSheet>
  );
}
