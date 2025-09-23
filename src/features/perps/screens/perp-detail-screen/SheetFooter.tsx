import React, { useCallback } from 'react';
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

// 32px for the easing gradient + 48px for the buttons + 12px for the extra bottom padding away from the area inset
export const SHEET_FOOTER_HEIGHT = 32 + 48 + 12;

type SheetFooterProps = {
  backgroundColor: string;
  market: PerpMarket;
};

export function SheetFooter({ backgroundColor, market }: SheetFooterProps) {
  const { isDarkMode } = useColorMode();
  const navigation = useNavigation();
  const position = useHyperliquidAccountStore(state => state.getPosition(market.symbol));
  const safeAreaInsets = useSafeAreaInsets();

  const navigateToClosePosition = useCallback(() => {
    Navigation.handleAction(Routes.CLOSE_POSITION_BOTTOM_SHEET, {
      symbol: market.symbol,
    });
  }, [market.symbol]);

  const navigateToNewPosition = useCallback(() => {
    navigation.goBack();
    InteractionManager.runAfterInteractions(() => {
      // Arbitrary delay to avoid being visually jarring
      setTimeout(() => {
        InteractionManager.runAfterInteractions(() => {
          navigateToNewPositionScreen(market);
        });
      }, 150);
    });
  }, [market, navigation]);

  const onPress = position ? navigateToClosePosition : navigateToNewPosition;
  const buttonText = position ? 'Close Position' : 'Open Position';

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
        <HyperliquidButton onPress={onPress}>
          <Text size="20pt" weight="black" color={isDarkMode ? 'black' : 'white'}>
            {buttonText}
          </Text>
        </HyperliquidButton>
      </Box>
    </Box>
  );
}
