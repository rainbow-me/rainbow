import { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { SmoothPager } from '@/components/SmoothPager/SmoothPager';
import { Box, useColorMode } from '@/design-system';
import { POLYMARKET_BACKGROUND_DARK, POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';
import { PolymarketAccountScreen } from '@/features/polymarket/screens/polymarket-account-screen/PolymarketAccountScreen';
import { PolymarketBrowseEventsScreen } from '@/features/polymarket/screens/polymarket-browse-events-screen/PolymarketBrowseEventsScreen';
import { PolymarketProvider, usePolymarketContext } from '@/features/polymarket/screens/polymarket-navigator/PolymarketContext';
import { PolymarketNavbar } from '@/features/polymarket/screens/polymarket-navigator/PolymarketNavbar';
import { PolymarketNavigatorFooter } from '@/features/polymarket/screens/polymarket-navigator/PolymarketNavigatorFooter';
import { PolymarketSheetHandle } from '@/features/polymarket/screens/polymarket-navigator/PolymarketSheetHandle';
import { PolymarketSearchScreen } from '@/features/polymarket/screens/polymarket-search-screen/PolymarketSearchScreen';
import { useCleanup } from '@/hooks/useCleanup';
import { useStableValue } from '@/hooks/useStableValue';
import { createVirtualNavigator } from '@/navigation/createVirtualNavigator';
import { useRoute } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { type PolymarketRoute } from '@/navigation/types';

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
  const { categorySelectorRef, eventsListRef } = usePolymarketContext();

  const screenBackgroundColor = isDarkMode ? POLYMARKET_BACKGROUND_DARK : POLYMARKET_BACKGROUND_LIGHT;

  useCleanup(PolymarketNavigation.resetNavigationState);

  // Apply a deep-link route intent passed through the outer navigation params: reset stale
  // virtual history, then switch the virtual navigator to the requested inner tab. Keyed on
  // routeRequestKey so a repeated request to the same route still re-applies.
  const { params } = useRoute<typeof Routes.POLYMARKET_NAVIGATOR>();
  const requestedRoute = params?.initialRoute;
  const routeRequestKey = params?.routeRequestKey;

  useEffect(() => {
    if (!requestedRoute) return;
    PolymarketNavigation.resetNavigationState();
    PolymarketNavigation.navigate(requestedRoute);
    // Reset list scroll too: a repeated deep link to the same league leaves
    // selectedLeagueId unchanged, so the value-based useListen won't fire.
    eventsListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [eventsListRef, requestedRoute, routeRequestKey]);

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
            navigation={Navigator.Pager}
            scaleTo={1}
            springConfig={SPRING_CONFIGS.snappyMediumSpringConfig}
            waitFor={categorySelectorRef}
          >
            <SmoothPager.Page id={Routes.POLYMARKET_BROWSE_EVENTS_SCREEN}>
              <Navigator.Route name={Routes.POLYMARKET_BROWSE_EVENTS_SCREEN}>
                <PolymarketBrowseEventsScreen />
              </Navigator.Route>
            </SmoothPager.Page>

            <SmoothPager.Page id={Routes.POLYMARKET_ACCOUNT_SCREEN} lazy>
              <Navigator.Route name={Routes.POLYMARKET_ACCOUNT_SCREEN}>
                <PolymarketAccountScreen />
              </Navigator.Route>
            </SmoothPager.Page>

            <SmoothPager.Page id={Routes.POLYMARKET_SEARCH_SCREEN} lazy>
              <Navigator.Route name={Routes.POLYMARKET_SEARCH_SCREEN}>
                <PolymarketSearchScreen />
              </Navigator.Route>
            </SmoothPager.Page>
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
