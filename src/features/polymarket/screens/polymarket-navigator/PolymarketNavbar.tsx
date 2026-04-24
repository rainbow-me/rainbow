import React from 'react';

import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountImage } from '@/components/AccountImage';
import { Navbar } from '@/components/navbar/Navbar';
import { Box, Text, TextShadow } from '@/design-system';
import { usePolymarketNavigationStore } from '@/features/polymarket/screens/polymarket-navigator/PolymarketNavigator';
import * as i18n from '@/languages';
import { type VirtualNavigationStore } from '@/navigation/createVirtualNavigator';
import Routes from '@/navigation/routesNames';
import { type PolymarketRoute } from '@/navigation/types';

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
                {i18n.t(i18n.l.predictions.navbar.title)}
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
