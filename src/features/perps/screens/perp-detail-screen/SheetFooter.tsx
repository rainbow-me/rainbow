import React, { useMemo } from 'react';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { Box, Text, useColorMode } from '@/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HyperliquidButton } from '@/features/perps/components/HyperliquidButton';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import Routes from '@/navigation/routesNames';
import Navigation from '@/navigation/Navigation';
import { navigateToNewPositionScreen } from '@/features/perps/utils';
import { PerpMarket } from '@/features/perps/types';
import { useNavigation } from '@react-navigation/native';
import { InteractionManager } from 'react-native';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import * as i18n from '@/languages';

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

  const noPositionButton = useMemo(() => {
    if (!hasUserAssets) {
      return {
        onPress: () => {
          Navigation.handleAction(Routes.ADD_CASH_SHEET);
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
        navigation.goBack();
        setTimeout(() => {
          InteractionManager.runAfterInteractions(() => {
            navigateToNewPositionScreen(market);
          });
        }, 150);
      },
      text: i18n.t(i18n.l.perps.actions.open_position),
    };
  }, [hasUserAssets, hasPerpsBalance, market, navigation]);

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
            <HyperliquidButton
              buttonProps={{ style: { flex: 1 } }}
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
            <HyperliquidButton
              buttonProps={{ style: { flex: 1 } }}
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
