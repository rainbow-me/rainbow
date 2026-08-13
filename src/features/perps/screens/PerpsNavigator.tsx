import { memo } from 'react';
import { StyleSheet } from 'react-native';

import { KeyboardProvider } from 'react-native-keyboard-controller';

import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { SmoothPager } from '@/components/SmoothPager/SmoothPager';
import { Box, useColorMode } from '@/design-system';
import { PerpsNavbar } from '@/features/perps/components/PerpsNavbar';
import { PerpsNavigatorFooter } from '@/features/perps/components/PerpsNavigatorFooter';
import { SheetHandle } from '@/features/perps/components/SheetHandle';
import { PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT } from '@/features/perps/constants';
import { PerpsAccentColorContextProvider } from '@/features/perps/context/PerpsAccentColorContext';
import { PerpsAccountScreen } from '@/features/perps/screens/perps-account-screen/PerpsAccountScreen';
import { PerpsNewPositionScreen } from '@/features/perps/screens/perps-new-position-screen/PerpsNewPositionScreen';
import { PerpsSearchScreen } from '@/features/perps/screens/PerpsSearchScreen';
import { useCleanup } from '@/hooks/useCleanup';
import { useStableValue } from '@/hooks/useStableValue';
import { createVirtualNavigator } from '@/navigation/createVirtualNavigator';
import Routes from '@/navigation/routesNames';
import { type PerpsRoute } from '@/navigation/types';

const Navigator = createVirtualNavigator<PerpsRoute>({
  initialRoute: Routes.PERPS_ACCOUNT_SCREEN,
  routes: [Routes.PERPS_ACCOUNT_SCREEN, Routes.PERPS_SEARCH_SCREEN, Routes.PERPS_NEW_POSITION_SCREEN],
});

export const { Navigation: PerpsNavigation, useNavigationStore: usePerpsNavigationStore } = Navigator;

export const PerpsNavigator = memo(function PerpsNavigator() {
  const { isDarkMode } = useColorMode();
  const screenBackgroundColor = isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT;

  useCleanup(PerpsNavigation.resetNavigationState);

  return (
    <KeyboardProvider>
      <PerpsAccentColorContextProvider>
        <Box backgroundColor={screenBackgroundColor} style={styles.container}>
          <Box alignItems="center" backgroundColor={screenBackgroundColor} width="full">
            <SheetHandle />
            <PerpsNavbar />
          </Box>

          {useStableValue(() => (
            <SmoothPager
              enableSwipeToGoBack={true}
              enableSwipeToGoForward={true}
              navigation={Navigator.Pager}
              scaleTo={1}
              springConfig={SPRING_CONFIGS.snappyMediumSpringConfig}
            >
              <SmoothPager.Page id={Routes.PERPS_ACCOUNT_SCREEN}>
                <Navigator.Route name={Routes.PERPS_ACCOUNT_SCREEN}>
                  <PerpsAccountScreen />
                </Navigator.Route>
              </SmoothPager.Page>

              <SmoothPager.Page id={Routes.PERPS_SEARCH_SCREEN}>
                <Navigator.Route name={Routes.PERPS_SEARCH_SCREEN}>
                  <PerpsSearchScreen />
                </Navigator.Route>
              </SmoothPager.Page>

              <SmoothPager.Page id={Routes.PERPS_NEW_POSITION_SCREEN} lazy>
                <Navigator.Route name={Routes.PERPS_NEW_POSITION_SCREEN}>
                  <PerpsNewPositionScreen />
                </Navigator.Route>
              </SmoothPager.Page>
            </SmoothPager>
          ))}

          <PerpsNavigatorFooter />
        </Box>
      </PerpsAccentColorContextProvider>
    </KeyboardProvider>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
