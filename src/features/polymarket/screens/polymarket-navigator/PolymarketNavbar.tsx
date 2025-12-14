import React from 'react';
import { Box, Text, TextShadow } from '@/design-system';
import { AccountImage } from '@/components/AccountImage';
import { Navbar } from '@/components/navbar/Navbar';
import Routes from '@/navigation/routesNames';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VirtualNavigationStore } from '@/navigation/createVirtualNavigator';
import { PolymarketRoute } from '@/navigation/types';
import * as i18n from '@/languages';
import { usePolymarketNavigationStore } from '@/features/polymarket/screens/polymarket-navigator/PolymarketNavigator';

export const PolymarketNavbar = function PolymarketNavbar() {
  const safeAreaInsets = useSafeAreaInsets();
  const title = usePolymarketNavigationStore(getPolymarketTitle);

  return (
    <Box marginTop={{ custom: safeAreaInsets.top + 8 }} width="full">
      <Navbar
        leftComponent={<AccountImage />}
        titleComponent={
          <Animated.View key={title} entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)}>
            <Box flexDirection="row" alignItems="center" gap={12} justifyContent="center">
              <TextShadow blur={20} color={'#C75DE7'} shadowOpacity={0.9}>
                <Text size="17pt" weight="bold" color={{ custom: '#C863E8' }}>
                  {'􀫸'}
                </Text>
              </TextShadow>
              <Text size="20pt" weight="heavy" color="label" align="center">
                {'Predictions'}
              </Text>
            </Box>
          </Animated.View>
        }
      />
    </Box>
  );
};

function getPolymarketTitle(state: VirtualNavigationStore<PolymarketRoute>): string {
  switch (state.activeRoute) {
    case Routes.POLYMARKET_SEARCH_SCREEN:
      return i18n.t(i18n.l.account.tab_polymarket);
    case Routes.POLYMARKET_BROWSE_EVENTS_SCREEN:
      return i18n.t(i18n.l.account.tab_polymarket);
    default:
      return i18n.t(i18n.l.account.tab_polymarket);
  }
}
