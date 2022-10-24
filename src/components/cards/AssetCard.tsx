import lang from 'i18n-js';
import {
  Box,
  Inline,
  Inset,
  Rows,
  Row,
  Stack,
  Text,
  Columns,
  Column,
  AccentColorProvider,
  DebugLayout,
} from '@/design-system';

import { useTheme } from '@/theme';
import { initialChartExpandedStateSheetHeight } from '../expanded-state/asset/ChartExpandedState';
import React, { useCallback, useMemo } from 'react';
import GenericCard from './GenericCard';
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
import { analytics } from '@/analytics';

import { ETH_ADDRESS } from '@/references';
import {
  ChartPath,
  ChartPathProvider,
} from '@/react-native-animated-charts/src';

import { CoinIcon } from '../coin-icon';
import { AssetType } from '@/entities';
import Labels from '../value-chart/ExtremeLabels';
import showWalletErrorAlert from '@/helpers/support';

import { IS_ANDROID, IS_IOS } from '@/env';
import { emitChartsRequest } from '@/redux/explorer';
import chartTypes from '@/helpers/chartTypes';
import { View } from 'react-native';

export const AssetCardHeight = 274;
const AssetCard = () => {
  const { accountAddress, nativeCurrency } = useAccountSettings();

  emitChartsRequest([ETH_ADDRESS], chartTypes.day, nativeCurrency);

  const { colors, isDarkMode } = useTheme();

  const { navigate } = useNavigation();
  const { isDamaged } = useWallets();

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

  const genericAsset = useGenericAsset(ETH_ADDRESS);

  // If we don't have a balance for this asset
  // It's a generic asset
  const assetWithPrice = useMemo(() => {
    return {
      ...ethereumUtils.formatGenericAsset(genericAsset, nativeCurrency),
      address: ETH_ADDRESS,
    };
  }, [genericAsset, nativeCurrency]);

  if (IS_ANDROID) {
    console.log(assetWithPrice);
  }

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

  return (
    <ButtonPressAnimation onPress={IS_IOS ? handleAssetPress : handlePressBuy}>
      <GenericCard type="stretch">
        <Stack space="20px">
          <Stack space="12px">
            <Box style={{ marginTop: -4 }}>
              <Columns alignHorizontal="justify" alignVertical="center">
                <Column>
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
                </Column>
                <Column width="content">
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
                </Column>
              </Columns>
            </Box>
            <Text size="26pt" color={{ custom: colorForAsset }} weight="heavy">
              {assetWithPrice.native.price.display}
            </Text>
          </Stack>
          <Inset vertical="16px">
            <Box height={{ custom: CHART_HEIGHT }}>
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
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={4}
                  width={CHART_WIDTH}
                  chartXOffset={0}
                  disableOnPress
                  isCard
                />
                <Labels color={colorForAsset} width={CHART_WIDTH} isCard />
              </ChartPathProvider>
            </Box>
          </Inset>
          <ButtonPressAnimation onPress={handlePressBuy} scaleTo={0.8}>
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
        </Stack>
      </GenericCard>
    </ButtonPressAnimation>
  );
};

export default AssetCard;
