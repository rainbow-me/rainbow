import React from 'react';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Text, TextIcon } from '@/design-system';
import { AccountImage } from '@/components/AccountImage';
import { Navbar } from '@/components/navbar/Navbar';
import { HyperliquidLogo } from '@/features/perps/components/HyperliquidLogo';
import Routes from '@/navigation/routesNames';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePerpsNavigationStore } from '@/features/perps/screens/PerpsNavigator';
import { VirtualNavigationStore } from '@/navigation/createVirtualNavigator';
import { PerpsRoute } from '@/navigation/types';
import * as i18n from '@/languages';
import { Navigation } from '@/navigation';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';

export const PerpsNavbar = function PerpsNavbar() {
  const safeAreaInsets = useSafeAreaInsets();
  const title = usePerpsNavigationStore(getPerpsTitle);
  const activeRoute = usePerpsNavigationStore(state => state.activeRoute);
  const shouldShowHistoryButton = activeRoute === Routes.PERPS_ACCOUNT_SCREEN;

  return (
    <Box marginTop={{ custom: safeAreaInsets.top + 8 }} width="full">
      <Navbar
        leftComponent={<AccountImage />}
        rightComponent={
          shouldShowHistoryButton ? (
            <ButtonPressAnimation onPress={navigateToTradeHistory} style={{ padding: 4 }}>
              <Box
                alignItems="center"
                background="fillTertiary"
                borderColor="separatorSecondary"
                borderRadius={20}
                borderWidth={THICK_BORDER_WIDTH}
                height={40}
                justifyContent="center"
                width={40}
              >
                <TextIcon color="label" size="icon 17px" weight="heavy">
                  {'􀐫'}
                </TextIcon>
              </Box>
            </ButtonPressAnimation>
          ) : (
            <Box width={{ custom: 40 }} />
          )
        }
        titleComponent={
          <Animated.View key={title} entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)}>
            <Box flexDirection="row" alignItems="center" justifyContent="center" gap={10}>
              <HyperliquidLogo />
              <Text align="center" color="label" size="20pt" weight="heavy">
                {title}
              </Text>
            </Box>
          </Animated.View>
        }
      />
    </Box>
  );
};

function getPerpsTitle(state: VirtualNavigationStore<PerpsRoute>): string {
  switch (state.activeRoute) {
    case Routes.PERPS_SEARCH_SCREEN:
      return state.getParams(Routes.PERPS_SEARCH_SCREEN)?.type === 'search'
        ? i18n.t(i18n.l.perps.markets.title)
        : i18n.t(i18n.l.perps.actions.new_position);
    case Routes.PERPS_NEW_POSITION_SCREEN:
      return i18n.t(i18n.l.perps.actions.new_position);
    default:
      return i18n.t(i18n.l.perps.common.title);
  }
}

function navigateToTradeHistory() {
  Navigation.handleAction(Routes.PERPS_TRADE_HISTORY_SCREEN);
}
