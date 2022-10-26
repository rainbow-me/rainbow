import lang from 'i18n-js';
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
import React, { useCallback, useMemo } from 'react';
import { GenericCard } from './GenericCard';
import { ButtonPressAnimation } from '../animations';
import {
  useAccountAsset,
  useAccountSettings,
  useChartThrottledPoints,
  useColorForAsset,
  useWallets,
} from '@/hooks';
import { deviceUtils, ethereumUtils } from '@/utils';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { analytics } from '@/analytics';
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

export const AssetCardHeight = 284.3;

export const AssetCard = () => {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const { colors, isDarkMode } = useTheme();
  const { navigate } = useNavigation();
  const { isDamaged } = useWallets();
  const genericAsset = useAccountAsset(ETH_ADDRESS);

  emitChartsRequest([ETH_ADDRESS], chartTypes.day, nativeCurrency);

  const handlePressBuy = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }

    if (IS_IOS) {
      navigate(Routes.ADD_CASH_FLOW);
    } else {
      navigate(Routes.WYRE_WEBVIEW_NAVIGATOR, () => ({
        params: {
          address: accountAddress,
        },
        screen: Routes.WYRE_WEBVIEW,
      }));
    }

    analytics.track('Tapped Add Cash', {
      category: 'add cash',
      source: 'BuyCard',
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
  }, [assetWithPrice, navigate]);

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

  const loadedPrice = assetWithPrice.native.change;
  const loadedChart = throttledData?.points.length && loadedPrice;

  return (
    <GenericCard
      onPress={IS_IOS ? handleAssetPress : handlePressBuy}
      type="stretch"
    >
      <Stack space={{ custom: 41 }}>
        <Stack space="12px">
          <Bleed top="4px">
            <Inline alignVertical="center" alignHorizontal="justify">
              {!loadedPrice ? (
                <Box height={{ custom: 17 }} width={{ custom: 100 }}>
                  <Skeleton>
                    <FakeText height={17} width={100} />
                  </Skeleton>
                </Box>
              ) : (
                <Inline alignVertical="center" space="6px">
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
                </Inline>
              )}
              {/* </Bleed>
              </Column> */}
              {/* <Column width="content"> */}
              {!loadedPrice ? (
                <Box height={{ custom: 17 }} width={{ custom: 80 }}>
                  <Skeleton>
                    <FakeText height={17} width={80} />
                  </Skeleton>
                </Box>
              ) : (
                <Inline alignVertical="bottom">
                  <Text
                    size="17pt"
                    color={{ custom: priceChangeColor }}
                    weight="bold"
                  >
                    {`${
                      isNegativePriceChange ? '􀄩' : '􀄨'
                    }${priceChangeDisplay}`}
                  </Text>
                  <Text
                    size="13pt"
                    color={{ custom: priceChangeColor }}
                    weight="bold"
                  >
                    {` ${lang.t('expanded_state.chart.today').toLowerCase()}`}
                  </Text>
                </Inline>
              )}
            </Inline>
          </Bleed>
          {!loadedPrice ? (
            <Box height={{ custom: 26 }} width={{ custom: 120 }}>
              <Skeleton>
                <FakeText height={26} width={120} />
              </Skeleton>
            </Box>
          ) : (
            <Text size="26pt" color={{ custom: colorForAsset }} weight="heavy">
              {assetWithPrice.native.price.display}
            </Text>
          )}
        </Stack>
        <Box height={{ custom: CHART_HEIGHT }}>
          {!loadedChart ? (
            <Box
              height="full"
              width={{ custom: CHART_WIDTH }}
              alignItems="center"
              justifyContent="center"
            >
              <Spinner color={colorForAsset} size={30} />
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
          <Box height={{ custom: 30 }} justifyContent="center">
            <Skeleton>
              <FakeText width={310} height={30} />
            </Skeleton>
          </Box>
        ) : (
          <ButtonPressAnimation onPress={handlePressBuy}>
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
                  􀍯 Buy Ethereum
                </Text>
              </Box>
            </AccentColorProvider>
          </ButtonPressAnimation>
        )}
      </Stack>
    </GenericCard>
  );
};
