import React, { useMemo } from 'react';
import { Box, Text, useBackgroundColor } from '@/design-system';
import { AccountImage } from '@/components/AccountImage';
import { Navbar } from '@/components/navbar/Navbar';
import { HyperliquidLogo } from '@/features/perps/components/HyperliquidLogo';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import Routes from '@/navigation/routesNames';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export const PerpsNavbar = function PerpsNavbar() {
  const { activeRoute } = useNavigationStore();
  const screenBackgroundColor = useBackgroundColor('surfacePrimary');

  const title = useMemo(() => {
    switch (activeRoute) {
      case Routes.PERPS_SEARCH_SCREEN:
        return 'Markets';
      case Routes.PERPS_NEW_POSITION_SEARCH_SCREEN:
        return 'New Position';
      case Routes.PERPS_NEW_POSITION_SCREEN:
        return 'New Position';
      default:
        return 'Perps';
    }
  }, [activeRoute]);

  return (
    <Box paddingTop={{ custom: 72 }} width="full" paddingHorizontal="20px" backgroundColor={screenBackgroundColor}>
      <Navbar
        leftComponent={<AccountImage />}
        titleComponent={
          <Animated.View key={title} entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)}>
            <Box flexDirection="row" alignItems="center" gap={10}>
              <HyperliquidLogo />
              <Text size="20pt" weight="heavy" color="label">
                {title}
              </Text>
            </Box>
          </Animated.View>
        }
      />
    </Box>
  );
};
