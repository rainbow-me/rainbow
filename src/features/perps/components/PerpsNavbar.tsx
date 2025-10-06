import React from 'react';
import { Box, Text } from '@/design-system';
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

export const PerpsNavbar = function PerpsNavbar() {
  const safeAreaInsets = useSafeAreaInsets();
  const title = usePerpsNavigationStore(getPerpsTitle);

  return (
    <Box marginTop={{ custom: safeAreaInsets.top + 8 }} width="full">
      <Navbar
        leftComponent={<AccountImage />}
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
