import { KeyboardProvider } from 'react-native-keyboard-controller';
import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SmoothPager, usePagerNavigation } from '@/components/SmoothPager/SmoothPager';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { SheetHandle } from '@/components/sheet';
import { Box, useColorMode } from '@/design-system';
import { PerpsNavbar } from '@/features/perps/components/PerpsNavbar';
import { PerpsNavigatorFooter } from '@/features/perps/components/PerpsNavigatorFooter';
import { PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT } from '@/features/perps/constants';
import { PerpsAccentColorContextProvider } from '@/features/perps/context/PerpsAccentColorContext';
import { PerpsSearchScreen } from '@/features/perps/screens/PerpsSearchScreen';
import { PerpsAccountScreen } from '@/features/perps/screens/perps-account-screen/PerpsAccountScreen';
import { PerpsNewPositionScreen } from '@/features/perps/screens/perps-new-position-screen/PerpsNewPositionScreen';
import { useCleanup } from '@/hooks/useCleanup';
import { useStableValue } from '@/hooks/useStableValue';
import { createVirtualNavigator } from '@/navigation/createVirtualNavigator';
import Routes from '@/navigation/routesNames';
import { PerpsRoute } from '@/navigation/types';
import { useListen } from '@/state/internal/hooks/useListen';

const Navigator = createVirtualNavigator<PerpsRoute>({
  initialRoute: Routes.PERPS_ACCOUNT_SCREEN,
  routes: [Routes.PERPS_ACCOUNT_SCREEN, Routes.PERPS_SEARCH_SCREEN, Routes.PERPS_NEW_POSITION_SCREEN],
});

export const PerpsNavigation = Navigator.Navigation;
export const usePerpsNavigationStore = Navigator.useNavigationStore;

export const PerpsNavigator = memo(function PerpsNavigator() {
  const { isDarkMode } = useColorMode();
  const { ref, goToPage } = usePagerNavigation();
  const insets = useSafeAreaInsets();

  const screenBackgroundColor = isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT;

  useListen(
    usePerpsNavigationStore,
    state => state.activeRoute,
    route => goToPage(route)
  );

  useCleanup(PerpsNavigation.resetNavigationState);

  return (
    <KeyboardProvider>
      <PerpsAccentColorContextProvider>
        <Box backgroundColor={screenBackgroundColor} style={styles.container}>
          <Box backgroundColor={screenBackgroundColor} style={styles.sheetHandle} top={{ custom: insets.top }}>
            <SheetHandle />
          </Box>

          <PerpsNavbar />

          {useStableValue(() => (
            <SmoothPager
              enableSwipeToGoBack={true}
              enableSwipeToGoForward={true}
              initialPage={Routes.PERPS_ACCOUNT_SCREEN}
              onNewIndex={Navigator.handlePagerIndexChange}
              ref={ref}
              scaleTo={1}
              springConfig={SPRING_CONFIGS.snappyMediumSpringConfig}
            >
              <SmoothPager.Page
                component={
                  <Navigator.Route name={Routes.PERPS_ACCOUNT_SCREEN}>
                    <PerpsAccountScreen />
                  </Navigator.Route>
                }
                id={Routes.PERPS_ACCOUNT_SCREEN}
              />

              <SmoothPager.Page
                component={
                  <Navigator.Route name={Routes.PERPS_SEARCH_SCREEN}>
                    <PerpsSearchScreen />
                  </Navigator.Route>
                }
                id={Routes.PERPS_SEARCH_SCREEN}
              />

              <SmoothPager.Page
                component={
                  <Navigator.Route name={Routes.PERPS_NEW_POSITION_SCREEN}>
                    <PerpsNewPositionScreen />
                  </Navigator.Route>
                }
                id={Routes.PERPS_NEW_POSITION_SCREEN}
                lazy
              />
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
  sheetHandle: {
    alignSelf: 'center',
    position: 'absolute',
    zIndex: 10,
  },
});
