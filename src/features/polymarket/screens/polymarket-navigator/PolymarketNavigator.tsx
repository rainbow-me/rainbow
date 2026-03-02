import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { SmoothPager, usePagerNavigation } from '@/components/SmoothPager/SmoothPager';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box, useColorMode } from '@/design-system';
import { useCleanup } from '@/hooks/useCleanup';
import { useStableValue } from '@/hooks/useStableValue';
import { createVirtualNavigator } from '@/navigation/createVirtualNavigator';
import Routes from '@/navigation/routesNames';
import { type PolymarketRoute } from '@/navigation/types';
import { useListen } from '@/state/internal/hooks/useListen';
import { PolymarketAccountScreen } from '@/features/polymarket/screens/polymarket-account-screen/PolymarketAccountScreen';
import { PolymarketSearchScreen } from '@/features/polymarket/screens/polymarket-search-screen/PolymarketSearchScreen';
import { POLYMARKET_BACKGROUND_DARK, POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';
import { PolymarketSheetHandle } from '@/features/polymarket/screens/polymarket-navigator/PolymarketSheetHandle';
import { PolymarketNavbar } from '@/features/polymarket/screens/polymarket-navigator/PolymarketNavbar';
import { PolymarketBrowseEventsScreen } from '@/features/polymarket/screens/polymarket-browse-events-screen/PolymarketBrowseEventsScreen';
import { PolymarketNavigatorFooter } from '@/features/polymarket/screens/polymarket-navigator/PolymarketNavigatorFooter';
import { PolymarketProvider, usePolymarketContext } from '@/features/polymarket/screens/polymarket-navigator/PolymarketContext';

const Navigator = createVirtualNavigator<PolymarketRoute>({
  initialRoute: Routes.POLYMARKET_BROWSE_EVENTS_SCREEN,
  routes: [Routes.POLYMARKET_BROWSE_EVENTS_SCREEN, Routes.POLYMARKET_ACCOUNT_SCREEN, Routes.POLYMARKET_SEARCH_SCREEN],
});

export const PolymarketNavigation = Navigator.Navigation;
export const usePolymarketNavigationStore = Navigator.useNavigationStore;

export const PolymarketNavigator = memo(function PolymarketNavigator() {
  return (
    <PolymarketProvider>
      <PolymarketNavigatorContent />
    </PolymarketProvider>
  );
});

const PolymarketNavigatorContent = () => {
  const { isDarkMode } = useColorMode();
  const { ref, goToPage } = usePagerNavigation();
  const { categorySelectorRef } = usePolymarketContext();

  const screenBackgroundColor = isDarkMode ? POLYMARKET_BACKGROUND_DARK : POLYMARKET_BACKGROUND_LIGHT;

  useListen(
    usePolymarketNavigationStore,
    state => state.activeRoute,
    route => goToPage(route)
  );

  useCleanup(PolymarketNavigation.resetNavigationState);

  return (
    <>
      <Box backgroundColor={screenBackgroundColor} style={styles.container}>
        <Box alignItems="center" backgroundColor={screenBackgroundColor} width="full">
          <PolymarketSheetHandle />
          <PolymarketNavbar />
        </Box>

        {useStableValue(() => (
          <SmoothPager
            enableSwipeToGoBack
            enableSwipeToGoForward="always"
            initialPage={usePolymarketNavigationStore.getState().activeRoute}
            onNewIndex={Navigator.handlePagerIndexChange}
            ref={ref}
            scaleTo={1}
            springConfig={SPRING_CONFIGS.snappyMediumSpringConfig}
            waitFor={categorySelectorRef}
          >
            <SmoothPager.Page
              component={
                <Navigator.Route name={Routes.POLYMARKET_BROWSE_EVENTS_SCREEN}>
                  <PolymarketBrowseEventsScreen />
                </Navigator.Route>
              }
              id={Routes.POLYMARKET_BROWSE_EVENTS_SCREEN}
            />

            <SmoothPager.Page
              component={
                <Navigator.Route name={Routes.POLYMARKET_ACCOUNT_SCREEN}>
                  <PolymarketAccountScreen />
                </Navigator.Route>
              }
              id={Routes.POLYMARKET_ACCOUNT_SCREEN}
              lazy
            />

            <SmoothPager.Page
              component={
                <Navigator.Route name={Routes.POLYMARKET_SEARCH_SCREEN}>
                  <PolymarketSearchScreen />
                </Navigator.Route>
              }
              id={Routes.POLYMARKET_SEARCH_SCREEN}
              lazy
            />
          </SmoothPager>
        ))}
      </Box>

      <PolymarketNavigatorFooter />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
});
