import {
  Box,
  Inline,
  Stack,
  Text,
  AccentColorProvider,
  Bleed,
} from '@/design-system';
import { useTheme } from '@/theme';
import { initialChartExpandedStateSheetHeight } from '../expanded-state/asset/ChartExpandedState';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GenericCard } from './GenericCard';
import { ButtonPressAnimation } from '../animations';
import {
  useAccountSettings,
  useChartThrottledPoints,
  useColorForAsset,
  useGenericAsset,
  useWallets,
} from '@/hooks';
import { deviceUtils, ethereumUtils } from '@/utils';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { analyticsV2 } from '@/analytics';
import { ETH_ADDRESS, ETH_SYMBOL } from '@/references';
import {
  ChartPath,
  ChartPathProvider,
} from '@/react-native-animated-charts/src';
import { CoinIcon } from '../coin-icon';
import { AssetType } from '@/entities';
import Labels from '../value-chart/ExtremeLabels';
import showWalletErrorAlert from '@/helpers/support';
import { IS_IOS } from '@/env';
import { emitChartsRequest } from '@/redux/explorer';
import chartTypes from '@/helpers/chartTypes';
import Spinner from '../Spinner';
import Skeleton, { FakeText } from '../skeleton/Skeleton';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';
import { useRoute } from '@react-navigation/core';
import * as i18n from '@/languages';

export const EthCardHeight = 284.3;

export const EthCard = () => {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const { colors, isDarkMode } = useTheme();
  const { navigate } = useNavigation();
  const { isDamaged } = useWallets();
  const genericAsset = useGenericAsset(ETH_ADDRESS);
  const { loaded: accentColorLoaded } = useAccountAccentColor();
  const { name: routeName } = useRoute();
  const cardType = 'stretch';

  useEffect(() => {
    emitChartsRequest([ETH_ADDRESS], chartTypes.day, nativeCurrency);
  }, []);

  const handlePressBuy = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }

    if (IS_IOS) {
      navigate(Routes.ADD_CASH_FLOW);
    } else {
      navigate(Routes.WYRE_WEBVIEW_NAVIGATOR, {
        params: {
          address: accountAddress,
        },
        screen: Routes.WYRE_WEBVIEW,
      });
    }
    analyticsV2.track(analyticsV2.event.buyButtonPressed, {
      componentName: 'EthCard',
      routeName,
    });
  }, [accountAddress, isDamaged, navigate]);

  const assetWithPrice = useMemo(() => {
    return {
      ...ethereumUtils.formatGenericAsset(genericAsset, nativeCurrency),
      address: ETH_ADDRESS,
      symbol: ETH_SYMBOL,
    };
  }, [genericAsset, nativeCurrency]);

  const handleAssetPress = useCallback(() => {
    navigate(Routes.EXPANDED_ASSET_SHEET, {
      asset: assetWithPrice,
      longFormHeight: initialChartExpandedStateSheetHeight,
      type: 'token',
    });
    analyticsV2.track(analyticsV2.event.cardPressed, {
      cardName: 'EthCard',
      routeName,
      cardType,
    });
  }, [assetWithPrice, navigate, routeName]);

  let colorForAsset = useColorForAsset(
    {
      address: assetWithPrice.address,
      mainnet_address: assetWithPrice?.mainnet_address,
      type: assetWithPrice?.mainnet_address
        ? AssetType.token
        : assetWithPrice.type,
    },
    assetWithPrice?.address ? undefined : colors.appleBlue
  );

  if (isDarkMode && assetWithPrice?.address === ETH_ADDRESS) {
    colorForAsset = colors.whiteLabel;
  }

  const { throttledData } = useChartThrottledPoints({
    asset: assetWithPrice,
  });

  const CHART_WIDTH = deviceUtils.dimensions.width - 80;
  const CHART_HEIGHT = 80;

  let isNegativePriceChange = false;
  if (assetWithPrice.native.change[0] === '-') {
    isNegativePriceChange = true;
  }
  const priceChangeDisplay = isNegativePriceChange
    ? assetWithPrice.native.change.substring(1)
    : assetWithPrice.native.change;

  const priceChangeColor = isNegativePriceChange ? colors.red : colors.green;

  const loadedPrice = accentColorLoaded && assetWithPrice.native.change;
  const loadedChart = throttledData?.points.length && loadedPrice;

  const [noChartData, setNoChartData] = useState(false);

  // If we cant load chart data we should tell the user
  useEffect(() => {
    setTimeout(() => {
      if (!loadedChart) {
        setNoChartData(true);
      } else {
        setNoChartData(false);
      }
    }, 20000);
  }, [loadedChart]);

  return (
    <GenericCard
      onPress={IS_IOS ? handleAssetPress : handlePressBuy}
      type={cardType}
      testID="eth-card"
    >
      <Stack space={{ custom: 41 }}>
        <Stack space="12px">
          <Bleed top="4px">
            <Inline alignVertical="center" alignHorizontal="justify">
              <Inline alignVertical="center" space="6px">
                {!loadedPrice ? (
                  <>
                    <Box height={{ custom: 20 }} width={{ custom: 20 }}>
                      <Skeleton>
                        <FakeText height={20} width={20} />
                      </Skeleton>
                    </Box>
                    <Box height={{ custom: 12 }} width={{ custom: 100 }}>
                      <Skeleton>
                        <FakeText height={12} width={100} />
                      </Skeleton>
                    </Box>
                  </>
                ) : (
                  <>
                    {/* @ts-expect-error – JS component */}
                    <CoinIcon
                      address={assetWithPrice.address}
                      size={20}
                      symbol={assetWithPrice.symbol}
                    />
                    <Text
                      size="17pt"
                      color={{ custom: colorForAsset }}
                      weight="heavy"
                    >
                      {assetWithPrice.name}
                    </Text>
                  </>
                )}
              </Inline>
              {!loadedPrice ? (
                <Box height={{ custom: 12 }} width={{ custom: 110 }}>
                  <Skeleton>
                    <FakeText height={12} width={110} />
                  </Skeleton>
                </Box>
              ) : (
                <Inline alignVertical="bottom">
                  <Inline alignVertical="center">
                    <Text
                      size="13pt"
                      color={{ custom: priceChangeColor }}
                      weight="heavy"
                    >
                      {isNegativePriceChange ? '􀄩' : '􀄨'}
                    </Text>
                    <Text
                      size="17pt"
                      color={{ custom: priceChangeColor }}
                      weight="bold"
                    >
                      {`${priceChangeDisplay} `}
                    </Text>
                  </Inline>
                  <Text
                    size="13pt"
                    color={{ custom: priceChangeColor }}
                    weight="bold"
                  >
                    {i18n.t(i18n.l.cards.eth.today)}
                  </Text>
                </Inline>
              )}
            </Inline>
          </Bleed>
          {!loadedPrice ? (
            <Box height={{ custom: 18 }} width={{ custom: 130 }}>
              <Skeleton>
                <FakeText height={18} width={130} />
              </Skeleton>
            </Box>
          ) : (
            <Text size="26pt" color={{ custom: colorForAsset }} weight="heavy">
              {assetWithPrice.native.price.display}
            </Text>
          )}
        </Stack>
        <Box height={{ custom: CHART_HEIGHT }} width={{ custom: CHART_WIDTH }}>
          {!loadedChart ? (
            <Box
              height="full"
              width="full"
              alignItems="center"
              justifyContent="center"
            >
              {noChartData ? (
                <Text color="label" size="20pt" weight="semibold">
                  {!loadedPrice ? 'No Price Data' : 'No Chart Data'}
                </Text>
              ) : (
                <Spinner color={colorForAsset} size={30} />
              )}
            </Box>
          ) : (
            <ChartPathProvider
              data={throttledData}
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
            >
              <ChartPath
                fill="none"
                gestureEnabled={false}
                height={CHART_HEIGHT}
                hitSlop={0}
                longPressGestureHandlerProps={undefined}
                selectedStrokeWidth={3}
                stroke={colorForAsset}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore - prop is accepted via prop spreading
                strokeLinecap="round"
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore - prop is accepted via prop spreading
                strokeLinejoin="round"
                strokeWidth={4}
                width={CHART_WIDTH}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore - prop is accepted via prop spreading
                chartXOffset={0}
                isCard
              />
              <Labels color={colorForAsset} width={CHART_WIDTH} isCard />
            </ChartPathProvider>
          )}
        </Box>
        {!loadedPrice ? (
          <Box height={{ custom: 36 }}>
            <Skeleton>
              <FakeText width={CHART_WIDTH} height={36} />
            </Skeleton>
          </Box>
        ) : (
          <ButtonPressAnimation
            onPress={handlePressBuy}
            testID="buy-eth-button"
            scaleTo={0.92}
          >
            <AccentColorProvider color={colors.alpha(colorForAsset, 0.1)}>
              <Box
                width="full"
                height={{ custom: 36 }}
                borderRadius={99}
                alignItems="center"
                justifyContent="center"
                background="accent"
              >
                <Text
                  color={{ custom: colorForAsset }}
                  containsEmoji
                  size="15pt"
                  weight="bold"
                >
                  {`􀍯 ${i18n.t(i18n.l.button.buy_eth)}`}
                </Text>
              </Box>
            </AccentColorProvider>
          </ButtonPressAnimation>
        )}
      </Stack>
    </GenericCard>
  );
};
