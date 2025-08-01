import { analytics } from '@/analytics';
import { ButtonPressAnimationTouchEvent } from '@/components/animations/ButtonPressAnimation/types';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { AccentColorProvider, Bleed, Box, Inline, Stack, Text } from '@/design-system';
import { IS_IOS } from '@/env';
import showWalletErrorAlert from '@/helpers/support';
import { useChartThrottledPoints, useColorForAsset } from '@/hooks';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';
import * as i18n from '@/languages';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { ChartDot, ChartPath, ChartPathProvider } from '@/react-native-animated-charts/src';
import { ETH_ADDRESS } from '@/references';
import { FormattedExternalAsset, useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { ChainId, Network } from '@/state/backendNetworks/types';
import { getIsDamagedWallet } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme';
import { deviceUtils } from '@/utils';
import { getUniqueId } from '@/utils/ethereumUtils';
import { useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Spinner from '../Spinner';
import { ButtonPressAnimation } from '../animations';
import Skeleton, { FakeText } from '../skeleton/Skeleton';
import { ExtremeLabels } from '@/components/value-chart/ExtremeLabels';
import { GenericCard } from './GenericCard';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

export const ETH_CARD_HEIGHT = 284.3;

export const EthCard = () => {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const { colors, isDarkMode } = useTheme();
  const { navigate } = useNavigation();
  const { data: externalEthAsset } = useExternalToken({
    address: ETH_ADDRESS,
    chainId: ChainId.mainnet,
    currency: nativeCurrency,
  });

  const ethAsset = useMemo(() => {
    return {
      ...(externalEthAsset || {}),
      address: ETH_ADDRESS,
      network: Network.mainnet,
      chainId: ChainId.mainnet,
      uniqueId: getUniqueId(ETH_ADDRESS, ChainId.mainnet),
    };
  }, [externalEthAsset]);

  const { loaded: accentColorLoaded } = useAccountAccentColor();
  const { name: routeName } = useRoute();
  const cardType = 'stretch';

  const handlePressBuy = useCallback(
    (e: ButtonPressAnimationTouchEvent) => {
      if (e && 'stopPropagation' in e) {
        e.stopPropagation();
      }

      if (getIsDamagedWallet()) {
        showWalletErrorAlert();
        return;
      }

      navigate(Routes.ADD_CASH_SHEET);

      analytics.track(analytics.event.buyButtonPressed, {
        componentName: 'EthCard',
        routeName,
      });
    },
    [navigate, routeName]
  );

  const handleAssetPress = useCallback(() => {
    if (ethAsset.native == null) return;
    navigate(Routes.EXPANDED_ASSET_SHEET_V2, {
      asset: ethAsset as FormattedExternalAsset,
      address: ETH_ADDRESS,
      chainId: ChainId.mainnet,
    });
    analytics.track(analytics.event.cardPressed, {
      cardName: 'EthCard',
      routeName,
      cardType,
    });
  }, [ethAsset, navigate, routeName]);

  let colorForAsset = useColorForAsset(
    {
      address: ETH_ADDRESS,
      mainnet_address: ETH_ADDRESS,
      type: 'token',
    },
    colors.appleBlue
  );

  if (isDarkMode) {
    colorForAsset = colors.whiteLabel;
  }

  const { throttledData } = useChartThrottledPoints({
    asset: ethAsset,
    timespan: 'day',
  });

  const CHART_WIDTH = deviceUtils.dimensions.width - 80;
  const CHART_HEIGHT = 80;

  let isNegativePriceChange = false;
  if (ethAsset.native?.change[0] === '-') {
    isNegativePriceChange = true;
  }
  const priceChangeDisplay = isNegativePriceChange ? ethAsset.native?.change.substring(1) : ethAsset.native?.change;

  const priceChangeColor = isNegativePriceChange ? colors.red : colors.green;

  const loadedPrice = accentColorLoaded && ethAsset.native?.change;
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

  const { f2c_enabled: addCashEnabled } = useRemoteConfig();

  return (
    <GenericCard onPress={IS_IOS ? handleAssetPress : handlePressBuy} type={cardType} testID="eth-card">
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
                    <ChainImage chainId={ChainId.mainnet} position="relative" size={20} />
                    <Text size="17pt" color={{ custom: colorForAsset }} weight="heavy">
                      {ethAsset.name}
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
                    <Text size="13pt" color={{ custom: priceChangeColor }} weight="heavy">
                      {isNegativePriceChange ? '􀄩' : '􀄨'}
                    </Text>
                    <Text size="17pt" color={{ custom: priceChangeColor }} weight="bold">
                      {`${priceChangeDisplay} `}
                    </Text>
                  </Inline>
                  <Text size="13pt" color={{ custom: priceChangeColor }} weight="bold">
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
              {ethAsset.native?.price.display}
            </Text>
          )}
        </Stack>
        <Box height={{ custom: CHART_HEIGHT }} width={{ custom: CHART_WIDTH }}>
          {!loadedChart ? (
            <Box height="full" width="full" alignItems="center" justifyContent="center">
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
              color={colorForAsset}
              selectedColor={colorForAsset}
              endPadding={32}
            >
              <ChartPath
                fill="none"
                gestureEnabled={false}
                height={CHART_HEIGHT}
                hitSlop={0}
                longPressGestureHandlerProps={undefined}
                selectedStrokeWidth={3}
                stroke={colorForAsset}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={4}
                width={CHART_WIDTH}
                isCard
              />
              <ChartDot
                size={10}
                color={colorForAsset}
                isCard
                dotStyle={{
                  shadowColor: isDarkMode ? colors.shadow : colorForAsset,
                  shadowOffset: { height: 3, width: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 4.5,
                }}
              />
              <ExtremeLabels color={colorForAsset} isCard />
            </ChartPathProvider>
          )}
        </Box>
        {!loadedPrice ? (
          <Box height={{ custom: 36 }}>
            <Skeleton>
              <FakeText width={CHART_WIDTH} height={36} />
            </Skeleton>
          </Box>
        ) : addCashEnabled ? (
          <ButtonPressAnimation onPress={handlePressBuy} testID="buy-eth-button" scaleTo={0.92}>
            <AccentColorProvider color={colors.alpha(colorForAsset, 0.1)}>
              <Box width="full" height={{ custom: 36 }} borderRadius={99} alignItems="center" justifyContent="center" background="accent">
                <Text color={{ custom: colorForAsset }} containsEmoji size="15pt" weight="bold">
                  {`􀍯 ${i18n.t(i18n.l.button.buy_eth)}`}
                </Text>
              </Box>
            </AccentColorProvider>
          </ButtonPressAnimation>
        ) : null}
      </Stack>
    </GenericCard>
  );
};
