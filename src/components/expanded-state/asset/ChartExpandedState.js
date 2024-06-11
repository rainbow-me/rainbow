import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutAnimation, View } from 'react-native';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { ModalContext } from '../../../react-native-cool-modals/NativeStackView';
import L2Disclaimer from '../../L2Disclaimer';
import { ButtonPressAnimation } from '../../animations';
import EdgeFade from '../../EdgeFade';
import useExperimentalFlag, { CROSSCHAIN_SWAPS } from '@/config/experimentalHooks';
import { BuyActionButton, SendActionButton, SheetActionButtonRow, SheetDivider, SlackSheet, SwapActionButton } from '../../sheet';
import { Text } from '../../text';
import { TokenInfoBalanceValue, TokenInfoItem, TokenInfoRow, TokenInfoSection } from '../../token-info';
import { Chart } from '../../value-chart';
import ExpandedStateSection from '../ExpandedStateSection';
import SocialLinks from './SocialLinks';
import { ChartPathProvider } from '@/react-native-animated-charts/src';
import { isL2Network, isTestnetNetwork } from '@/handlers/web3';
import AssetInputTypes from '@/helpers/assetInputTypes';
import {
  useAccountSettings,
  useAdditionalAssetData,
  useChartThrottledPoints,
  useDelayedValueWithLayoutAnimation,
  useDimensions,
} from '@/hooks';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useNavigation } from '@/navigation';
import { ETH_ADDRESS } from '@/references';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { safeAreaInsetValues } from '@/utils';
import AvailableNetworksv2 from '@/components/expanded-state/AvailableNetworksv2';
import AvailableNetworksv1 from '@/components/expanded-state/AvailableNetworks';
import { Box } from '@/design-system';
import { getNetworkObj } from '@/networks';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { bigNumberFormat } from '@/helpers/bigNumberFormat';
import { greaterThanOrEqualTo } from '@/helpers/utilities';
import { Network } from '@/networks/types';

const defaultCarouselHeight = 60;
const baseHeight = 386 + (android && 20 - getSoftMenuBarHeight()) - defaultCarouselHeight;
const heightWithoutChart = baseHeight + (android && 30);
const heightWithChart = baseHeight + 292;

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

function CarouselWrapper({ style, isAnyItemVisible, isAnyItemLoading, setCarouselHeight, ...props }) {
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
  const shorterOne = first4Sentences.length < firstParagraph?.length ? first4Sentences : firstParagraph;
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
  const delayedTruncated = useDelayedValueWithLayoutAnimation(truncated, LayoutAnimation.Properties.scaleXY);

  const { colors } = useTheme();
  return (
    <ButtonPressAnimation disabled={!needToTruncate || !truncated} onPress={() => setTruncated(prev => !prev)} scaleTo={1}>
      <Text color={colors.alpha(colors.blueGreyDark, 0.5)} lineHeight="big" size="large">
        {delayedTruncated ? truncatedText : text}
      </Text>
      {truncated && needToTruncate && <ReadMoreButton>{lang.t('expanded_state.asset.read_more_button')} 􀯼</ReadMoreButton>}
    </ButtonPressAnimation>
  );
}

export default function ChartExpandedState({ asset }) {
  const { nativeCurrency, network: currentNetwork } = useAccountSettings();

  const { data: genericAsset } = useExternalToken({
    address: asset?.address,
    network: asset?.network,
    currency: nativeCurrency,
  });
  const {
    params: { fromDiscover = false },
  } = useRoute();

  const [carouselHeight, setCarouselHeight] = useState(defaultCarouselHeight);
  const [additionalContentHeight, setAdditionalContentHeight] = useState(0);

  // If we don't have a balance for this asset
  // It's a generic asset
  const hasBalance = asset?.balance;
  const assetWithPrice = useMemo(() => {
    return hasBalance
      ? asset
      : genericAsset
        ? {
            ...genericAsset,
            network: asset.network,
            address: asset.address,
            mainnetAddress: asset?.networks?.[getNetworkObj(Network.mainnet)]?.address,
          }
        : asset;
  }, [asset, genericAsset, hasBalance]);

  const isL2 = useMemo(() => isL2Network(assetWithPrice.network), [assetWithPrice.network]);
  const isTestnet = isTestnetNetwork(currentNetwork);

  const { data, isLoading: additionalAssetDataLoading } = useAdditionalAssetData({
    address: asset?.address,
    network: asset?.network,
    currency: nativeCurrency,
  });

  const { height: screenHeight } = useDimensions();

  const delayedDescriptions = useDelayedValueWithLayoutAnimation(data?.description?.replace(/\s+/g, ''));

  const scrollableContentHeight = true;
  const { chart, chartType, color, fetchingCharts, updateChartType, initialChartDataLabels, showChart, throttledData } =
    useChartThrottledPoints({
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
      shortHeightWithChart: Math.min(carouselHeight + heightWithChart - (!hasBalance && 68), screenHeight),
      shortHeightWithoutChart: Math.min(carouselHeight + heightWithoutChart - (!hasBalance && 68), screenHeight),
    });

  const needsEth = asset?.address === ETH_ADDRESS && asset?.balance?.amount === '0';

  const duration = useRef(0);

  if (duration.current === 0) {
    duration.current = 300;
  }

  let ChartExpandedStateSheetHeight = ios || showChart ? heightWithChart : heightWithoutChart;

  if (android && !hasBalance) {
    ChartExpandedStateSheetHeight -= 60;
  }

  const { navigate } = useNavigation();

  const handleL2DisclaimerPress = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      type: assetWithPrice.network,
    });
  }, [assetWithPrice.network, navigate]);

  const { layout } = useContext(ModalContext) || {};

  const { colors } = useTheme();

  const crosschainEnabled = useExperimentalFlag(CROSSCHAIN_SWAPS);
  const AvailableNetworks = !crosschainEnabled ? AvailableNetworksv1 : AvailableNetworksv2;

  const assetNetwork = assetWithPrice.network;

  const { swagg_enabled, f2c_enabled } = useRemoteConfig();
  const swapEnabled = swagg_enabled && getNetworkObj(assetNetwork).features.swaps;
  const addCashEnabled = f2c_enabled;

  const format = useCallback(
    value => {
      const test = bigNumberFormat(value, nativeCurrency, greaterThanOrEqualTo(value, 10000));

      return test;
    },
    [nativeCurrency]
  );

  return (
    <SlackSheet
      additionalTopPadding={android}
      contentHeight={ChartExpandedStateSheetHeight}
      scrollEnabled
      {...(ios ? { height: '100%' } : { additionalTopPadding: true, contentHeight: screenHeight - 80 })}
    >
      <ChartPathProvider data={throttledData}>
        <Chart
          {...initialChartDataLabels}
          updateChartType={updateChartType}
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
            <TokenInfoItem asset={assetWithPrice} title={lang.t('expanded_state.asset.balance')}>
              <TokenInfoBalanceValue asset={asset} />
            </TokenInfoItem>
            <TokenInfoItem title={asset?.native?.balance.display ? lang.t('expanded_state.asset.value') : ' '} weight="bold">
              {asset?.native?.balance?.display || ' '}
            </TokenInfoItem>
          </TokenInfoRow>
        </TokenInfoSection>
      )}
      {!needsEth ? (
        <SheetActionButtonRow paddingBottom={isL2 ? 19 : undefined}>
          {hasBalance && !isTestnet && swapEnabled && (
            <SwapActionButton asset={assetWithPrice} color={color} inputType={AssetInputTypes.in} />
          )}
          {hasBalance ? (
            <SendActionButton asset={assetWithPrice} color={color} fromDiscover={fromDiscover} />
          ) : swapEnabled ? (
            <SwapActionButton
              asset={assetWithPrice}
              color={color}
              fromDiscover={fromDiscover}
              inputType={AssetInputTypes.out}
              label={`􀖅 ${lang.t('expanded_state.asset.get_asset', {
                assetSymbol: asset?.symbol,
              })}`}
              requireVerification
              verified={asset?.isVerified}
              weight="heavy"
            />
          ) : null}
        </SheetActionButtonRow>
      ) : addCashEnabled ? (
        <SheetActionButtonRow paddingBottom={isL2 ? 19 : undefined}>
          <BuyActionButton color={color} asset={assetWithPrice} />
        </SheetActionButtonRow>
      ) : null}
      {!data?.networks && isL2 && (
        <L2Disclaimer network={assetWithPrice.network} colors={colors} onPress={handleL2DisclaimerPress} symbol={assetWithPrice.symbol} />
      )}
      {data?.networks && !hasBalance && (
        <Box paddingBottom={{ custom: 27 }}>
          <AvailableNetworks asset={assetWithPrice} networks={data?.networks} />
        </Box>
      )}
      <CarouselWrapper
        isAnyItemLoading={additionalAssetDataLoading}
        isAnyItemVisible={!!(data?.volume1d || data?.marketCap)}
        setCarouselHeight={setCarouselHeight}
      >
        <Carousel>
          <CarouselItem
            loading={additionalAssetDataLoading}
            showDivider
            title={lang.t('expanded_state.asset.volume_24_hours')}
            weight="bold"
          >
            {format(data?.volume1d)}
          </CarouselItem>
          <CarouselItem
            loading={additionalAssetDataLoading}
            showDivider
            title={lang.t('expanded_state.asset.uniswap_liquidity')}
            weight="bold"
          >
            {data?.totalLiquidity}
          </CarouselItem>
          <CarouselItem loading={additionalAssetDataLoading} title={lang.t('expanded_state.asset.market_cap')} weight="bold">
            {format(data?.marketCap)}
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
          setAdditionalContentHeight(height);
          layout?.();
        }}
      >
        {data?.description && (
          <ExpandedStateSection
            isL2
            title={lang.t('expanded_state.asset.about_asset', {
              assetName: asset?.name,
            })}
          >
            <Description text={data?.description || delayedDescriptions} />
          </ExpandedStateSection>
        )}
        <SocialLinks
          address={assetWithPrice.address}
          color={color}
          isNativeAsset={assetWithPrice?.isNativeAsset}
          links={data?.links}
          marginTop={!delayedDescriptions && 19}
          type={asset?.network}
        />
        <Spacer />
      </AdditionalContentWrapper>
    </SlackSheet>
  );
}
