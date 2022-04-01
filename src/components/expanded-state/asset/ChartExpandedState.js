import lang from 'i18n-js';
import { find, get } from 'lodash';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LayoutAnimation, View } from 'react-native';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { ModalContext } from '../../../react-native-cool-modals/NativeStackView';
import L2Disclaimer from '../../L2Disclaimer';
import { ButtonPressAnimation } from '../../animations';
import { CoinDividerHeight } from '../../coin-divider';
import CoinDividerOpenButton from '../../coin-divider/CoinDividerOpenButton';
import EdgeFade from '../../discover-sheet/EdgeFade';
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
import ExpandedStateSection from '../ExpandedStateSection';
import SocialLinks from './SocialLinks';
import { ChartPathProvider } from '@rainbow-me/animated-charts';
import { isL2Network } from '@rainbow-me/handlers/web3';
import AssetInputTypes from '@rainbow-me/helpers/assetInputTypes';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import {
  useAccountSettings,
  useAdditionalAssetData,
  useChartThrottledPoints,
  useDelayedValueWithLayoutAnimation,
  useDimensions,
  useGenericAsset,
  useUniswapAssetsInWallet,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { ETH_ADDRESS } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
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
})({});

const AdditionalContentWrapper = styled.View({});

const CarouselItem = styled(TokenInfoItem).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.7),
  letterSpacing: 'roundedTighter',
  weight: 'semibold',
}))({
  marginHorizontal: 12,
});

const TIMEOUT = 15000;

const ReadMoreButton = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.8),
  lineHeight: 37,
  size: 'lmedium',
  weight: 'heavy',
}))({});

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

const Spacer = styled.View({
  height: safeAreaInsetValues.bottom + 20 + getSoftMenuBarHeight(),
});

// truncate after the first paragraph or 4th dot
function truncate(text) {
  const firstParagraph = text.split('\n')[0];
  const first4Sentences = text.split('.').slice(0, 4).join('.') + '.';
  const shorterOne =
    first4Sentences.length < firstParagraph?.length
      ? first4Sentences
      : firstParagraph;
  // If there is not much to expand, return the whole text
  if (text.length < shorterOne.length * 1.5) {
    return text;
  }

  return shorterOne;
}

function Description({ text = '' }) {
  const truncatedText = truncate(text);
  const needToTruncate = truncatedText.length !== text.length;
  const [truncated, setTruncated] = useState(true);
  const delayedTruncated = useDelayedValueWithLayoutAnimation(
    truncated,
    LayoutAnimation.Properties.scaleXY
  );

  const { colors } = useTheme();
  return (
    <ButtonPressAnimation
      disabled={!needToTruncate || !truncated}
      onPress={() => setTruncated(prev => !prev)}
      scaleTo={1}
    >
      <Text
        color={colors.alpha(colors.blueGreyDark, 0.5)}
        lineHeight="big"
        size="large"
      >
        {delayedTruncated ? truncatedText : text}
      </Text>
      {truncated && needToTruncate && (
        <ReadMoreButton>
          {lang.t('expanded_state.asset.read_more_button')} 􀯼
        </ReadMoreButton>
      )}
    </ButtonPressAnimation>
  );
}

export default function ChartExpandedState({ asset }) {
  const genericAsset = useGenericAsset(asset?.address);

  const [carouselHeight, setCarouselHeight] = useState(defaultCarouselHeight);
  const { nativeCurrency, network: currentNetwork } = useAccountSettings();
  const [additionalContentHeight, setAdditionalContentHeight] = useState(0);

  // If we don't have a balance for this asset
  // It's a generic asset
  const hasBalance = asset?.balance;
  const assetWithPrice = useMemo(() => {
    return hasBalance
      ? { ...asset }
      : genericAsset
      ? ethereumUtils.formatGenericAsset(genericAsset, nativeCurrency)
      : { ...asset };
  }, [asset, genericAsset, hasBalance, nativeCurrency]);

  if (assetWithPrice?.mainnet_address) {
    assetWithPrice.l2Address = assetWithPrice.address;
    assetWithPrice.address = assetWithPrice.mainnet_address;
  }

  const isL2 = useMemo(() => isL2Network(assetWithPrice.type), [
    assetWithPrice.type,
  ]);
  // This one includes the original l2 address if exists
  const ogAsset = useMemo(() => {
    return {
      ...assetWithPrice,
      address: isL2
        ? assetWithPrice.l2Address || asset?.address
        : assetWithPrice.address,
    };
  }, [assetWithPrice, isL2, asset]);

  const { height: screenHeight } = useDimensions();
  const {
    description,
    marketCap,
    totalLiquidity,
    totalVolume,
    loading: additionalAssetDataLoading,
    links,
  } = useAdditionalAssetData(asset?.address, assetWithPrice?.price?.value);

  const delayedDescriptions = useDelayedValueWithLayoutAnimation(
    description?.replace(/\s+/g, '')
  );

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
        additionalContentHeight +
        (additionalContentHeight === 0 ? 0 : scrollableContentHeight),
      screenHeight
    ),
    heightWithoutChart: Math.min(
      carouselHeight +
        heightWithoutChart -
        (!hasBalance && 68) +
        additionalContentHeight +
        (additionalContentHeight === 0 ? 0 : scrollableContentHeight),
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

  const uniswapAssetsInWallet = useUniswapAssetsInWallet();
  const showSwapButton = useMemo(
    () =>
      !!get(networkInfo[currentNetwork], 'exchange_enabled') &&
      !isL2 &&
      find(uniswapAssetsInWallet, ['address', assetWithPrice.address]),
    [assetWithPrice.address, currentNetwork, isL2, uniswapAssetsInWallet]
  );

  const needsEth =
    asset?.address === ETH_ADDRESS && asset?.balance?.amount === '0';

  const duration = useRef(0);

  if (duration.current === 0) {
    duration.current = 300;
  }

  let ChartExpandedStateSheetHeight =
    ios || showChart ? heightWithChart : heightWithoutChart;

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

  const { colors } = useTheme();

  const MoreButton = useCallback(() => {
    return (
      <View marginTop={-10}>
        <CoinDividerOpenButton
          coinDividerHeight={CoinDividerHeight}
          isActive
          isSmallBalancesOpen={delayedMorePoolsVisible}
          onPress={() => setMorePoolsVisible(prev => !prev)}
        />
      </View>
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
            <TokenInfoItem
              asset={assetWithPrice}
              title={lang.t('expanded_state.asset.balance')}
            >
              <TokenInfoBalanceValue asset={asset} />
            </TokenInfoItem>
            <TokenInfoItem
              title={
                asset?.native?.balance.display
                  ? lang.t('expanded_state.asset.value')
                  : ' '
              }
              weight="bold"
            >
              {asset?.native?.balance?.display || ' '}
            </TokenInfoItem>
          </TokenInfoRow>
        </TokenInfoSection>
      )}
      {needsEth ? (
        <SheetActionButtonRow paddingBottom={isL2 ? 19 : undefined}>
          <BuyActionButton color={color} />
        </SheetActionButtonRow>
      ) : (
        <SheetActionButtonRow paddingBottom={isL2 ? 19 : undefined}>
          {showSwapButton && (
            <SwapActionButton color={color} inputType={AssetInputTypes.in} />
          )}
          {hasBalance ? (
            <SendActionButton asset={ogAsset} color={color} />
          ) : (
            <SwapActionButton
              color={color}
              inputType={AssetInputTypes.out}
              label={`􀖅 ${lang.t('expanded_state.asset.get_asset', {
                assetSymbol: asset?.symbol,
              })}`}
              requireVerification
              verified={asset?.isVerified}
              weight="heavy"
            />
          )}
        </SheetActionButtonRow>
      )}
      {isL2 && (
        <L2Disclaimer
          assetType={assetWithPrice.type}
          colors={colors}
          onPress={handleL2DisclaimerPress}
          symbol={assetWithPrice.symbol}
        />
      )}

      {!isL2 && (
        <CarouselWrapper
          isAnyItemLoading={additionalAssetDataLoading}
          isAnyItemVisible={!!(totalVolume || totalLiquidity || marketCap)}
          setCarouselHeight={setCarouselHeight}
        >
          <Carousel>
            <CarouselItem
              loading={additionalAssetDataLoading}
              showDivider
              title={lang.t('expanded_state.asset.volume_24_hours')}
              weight="bold"
            >
              {totalVolume}
            </CarouselItem>
            <CarouselItem
              loading={additionalAssetDataLoading}
              showDivider
              title={lang.t('expanded_state.asset.uniswap_liquidity')}
              weight="bold"
            >
              {totalLiquidity}
            </CarouselItem>
            <CarouselItem
              loading={additionalAssetDataLoading}
              title={lang.t('expanded_state.asset.market_cap')}
              weight="bold"
            >
              {marketCap}
            </CarouselItem>
          </Carousel>
          <EdgeFade />
        </CarouselWrapper>
      )}
      <AdditionalContentWrapper
        onLayout={({
          nativeEvent: {
            layout: { height },
          },
        }) => {
          setAdditionalContentHeight(height);
          layout?.();
        }}
      >
        {!isL2 && (
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
          <ExpandedStateSection
            isL2
            title={lang.t('expanded_state.asset.about_asset', {
              assetName: asset?.name,
            })}
          >
            <Description text={description || delayedDescriptions} />
          </ExpandedStateSection>
        )}
        <SocialLinks
          address={ogAsset.address}
          color={color}
          isNativeAsset={assetWithPrice?.isNativeAsset}
          links={links}
          marginTop={!delayedDescriptions && 19}
          type={asset?.type}
        />
        <Spacer />
      </AdditionalContentWrapper>
    </SlackSheet>
  );
}
