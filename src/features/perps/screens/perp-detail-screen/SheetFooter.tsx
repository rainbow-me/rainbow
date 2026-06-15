import React, { useMemo } from 'react';
import { View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { Box, Text, useColorMode } from '@/design-system';
import { useAddCashRoute } from '@/features/cash/navigation/useAddCashRoute';
import { HyperliquidButton } from '@/features/perps/components/HyperliquidButton';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { type PerpMarket } from '@/features/perps/types';
import { navigateToNewPositionScreen } from '@/features/perps/utils';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useUserAssetsStore } from '@/state/assets/userAssets';

// 32px for the easing gradient + 48px for the buttons + 12px for the extra bottom padding away from the area inset
export const SHEET_FOOTER_HEIGHT = 32 + 48 + 12;

type SheetFooterProps = {
  backgroundColor: string;
  market: PerpMarket;
};

export function SheetFooter({ backgroundColor, market }: SheetFooterProps) {
  const { isDarkMode } = useColorMode();
  const navigation = useNavigation();
  const safeAreaInsets = useSafeAreaInsets();

  const position = useHyperliquidAccountStore(state => state.getPosition(market.symbol));
  const hasPosition = !!position;
  const hasPerpsBalance = useHyperliquidAccountStore(state => Number(state.getBalance()) !== 0);
  const hasUserAssets = useUserAssetsStore(state => state.getFilteredUserAssetIds().length > 0);
  const { route: addCashRoute } = useAddCashRoute();

  const noPositionButton = useMemo(() => {
    if (!hasUserAssets) {
      return {
        onPress: () => {
          Navigation.handleAction(addCashRoute);
        },
        text: i18n.t(i18n.l.perps.actions.fund_wallet),
      };
    }
    if (!hasPerpsBalance) {
      return {
        onPress: () => {
          Navigation.handleAction(Routes.PERPS_DEPOSIT_SCREEN);
        },
        text: i18n.t(i18n.l.perps.deposit.title),
      };
    }
    return {
      onPress: () => {
        navigateToNewPositionScreen(market);
        if (isPerpsNavigatorBehindCurrentRoute()) {
          navigation.goBack();
        } else {
          Navigation.replace(Routes.PERPS_NAVIGATOR, {
            initialPerpsPage: Routes.PERPS_NEW_POSITION_SCREEN,
          });
        }
      },
      text: i18n.t(i18n.l.perps.actions.open_position),
    };
  }, [addCashRoute, hasUserAssets, hasPerpsBalance, market, navigation]);

  return (
    <Box pointerEvents="box-none" position="absolute" bottom="0px" width="full">
      <EasingGradient
        endColor={backgroundColor}
        startColor={backgroundColor}
        endOpacity={1}
        startOpacity={0}
        style={{ height: 32, width: '100%', pointerEvents: 'none' }}
      />
      <Box paddingHorizontal={'24px'} backgroundColor={backgroundColor} width="full" paddingBottom={{ custom: safeAreaInsets.bottom + 12 }}>
        {hasPosition && (
          <Box flexDirection="row" gap={12}>
            <View style={{ flex: 1 }}>
              <HyperliquidButton
                onPress={() => {
                  Navigation.handleAction(Routes.CLOSE_POSITION_BOTTOM_SHEET, {
                    symbol: market.symbol,
                  });
                }}
              >
                <Text size="20pt" weight="black" color={isDarkMode ? 'black' : 'white'}>
                  {i18n.t(i18n.l.perps.common.close)}
                </Text>
              </HyperliquidButton>
            </View>
            <View style={{ flex: 1 }}>
              <HyperliquidButton
                onPress={() => {
                  Navigation.handleAction(Routes.PERPS_ADD_TO_POSITION_SHEET, {
                    market,
                    position,
                  });
                }}
              >
                <Text size="20pt" weight="black" color={isDarkMode ? 'black' : 'white'}>
                  {i18n.t(i18n.l.perps.common.add)}
                </Text>
              </HyperliquidButton>
            </View>
          </Box>
        )}
        {!hasPosition && (
          <HyperliquidButton buttonProps={{ style: { flex: 1 } }} onPress={noPositionButton.onPress}>
            <Text size="20pt" weight="black" color={isDarkMode ? 'black' : 'white'}>
              {noPositionButton.text}
            </Text>
          </HyperliquidButton>
        )}
      </Box>
    </Box>
  );
}

function isPerpsNavigatorBehindCurrentRoute(): boolean {
  const state = Navigation.getState();
  if (!state) return false;
  const currentIndex = state.index ?? state.routes.length - 1;
  return state.routes[currentIndex - 1]?.name === Routes.PERPS_NAVIGATOR;
}
