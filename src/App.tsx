import '@/languages';
import * as Sentry from '@sentry/react-native';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { Provider as ReduxProvider, useSelector } from 'react-redux';
import lang from 'i18n-js';
import { AppRegistry, Dimensions, LogBox, StyleSheet, View } from 'react-native';
import { Toaster } from 'sonner-native';
import { MobileWalletProtocolProvider } from '@coinbase/mobile-wallet-protocol-host';
import { DeeplinkHandler } from '@/components/DeeplinkHandler';
import { useApplicationSetup } from '@/hooks/useApplicationSetup';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { RecoilRoot } from 'recoil';
import ErrorBoundary from '@/components/error-boundary/ErrorBoundary';
import { OfflineToast } from '@/components/toasts';
import { designSystemPlaygroundEnabled, reactNativeDisableYellowBox, showNetworkRequests, showNetworkResponses } from '@/config/debug';
import monitorNetwork from '@/debugging/network';
import { Playground } from '@/design-system/playground/Playground';
import RainbowContextWrapper from '@/helpers/RainbowContext';
import { Navigation } from '@/navigation';
import { PersistQueryClientProvider, persistOptions, queryClient } from '@/react-query';
import store, { AppState } from '@/redux/store';
import { MainThemeProvider } from '@/theme/ThemeContext';
import { InitialRouteContext } from '@/navigation/initialRoute';
import { NotificationsHandler } from '@/notifications/NotificationsHandler';
import { analytics } from '@/analytics';
import { getOrCreateDeviceId } from '@/analytics/utils';
import { logger, RainbowError } from '@/logger';
import * as ls from '@/storage';
import { migrate } from '@/migrations';
import { initializeReservoirClient } from '@/resources/reservoir/client';
import { initializeRemoteConfig } from '@/model/remoteConfig';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { IS_DEV, IS_PROD, IS_TEST } from '@/env';
import Routes from '@/navigation/Routes';
import { BackupsSync } from '@/state/sync/BackupsSync';
import { AbsolutePortalRoot } from './components/AbsolutePortal';
import { PerformanceProfiler } from '@shopify/react-native-performance';
import { PerformanceReports, PerformanceReportSegments, PerformanceTracking } from './performance/tracking';
import { TestDeeplinkHandler } from './components/TestDeeplinkHandler';
import { RainbowToastDisplay } from '@/components/rainbow-toast/RainbowToast';

if (IS_DEV) {
  reactNativeDisableYellowBox && LogBox.ignoreAllLogs();
  (showNetworkRequests || showNetworkResponses) && monitorNetwork(showNetworkRequests, showNetworkResponses);
}

enableScreens();

const sx = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});

function AppComponent() {
  const { initialRoute } = useApplicationSetup();
  const language = useSelector((state: AppState) => state.settings.language);

  // Update i18n locale when language changes
  useEffect(() => {
    lang.locale = language;
  }, [language]);

  const handleNavigatorRef = useCallback((ref: NavigationContainerRef<RootStackParamList>) => {
    Navigation.setTopLevelNavigator(ref);
  }, []);

  const onNavigationReady = useCallback(() => {
    PerformanceTracking.logReportSegmentRelative(PerformanceReports.appStartup, PerformanceReportSegments.appStartup.mountNavigation);
    PerformanceTracking.startReportSegment(
      PerformanceReports.appStartup,
      PerformanceReportSegments.appStartup.initialScreenInteractiveRender
    );
  }, []);

  return (
    <>
      <View style={sx.container}>
        {initialRoute && (
          <InitialRouteContext.Provider value={initialRoute}>
            <Routes onReady={onNavigationReady} ref={handleNavigatorRef} />
          </InitialRouteContext.Provider>
        )}
        <OfflineToast />
        <Toaster />
      </View>
      <NotificationsHandler />
      <DeeplinkHandler initialRoute={initialRoute} />
      {IS_TEST && <TestDeeplinkHandler />}
      <BackupsSync />
      <AbsolutePortalRoot />
    </>
  );
}

const App = memo(AppComponent);

function Root() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    initializeApplication()
      .then(() => {
        logger.debug(`[App]: Application initialized with Sentry and analytics`);
      })
      .catch(error => {
        logger.error(new RainbowError(`[App]: initializeApplication failed`), {
          data: {
            error,
          },
        });
      })
      .finally(() => {
        setInitializing(false);
      });

    initializeReservoirClient();
  }, [setInitializing]);

  return initializing ? null : (
    <PerformanceProfiler useRenderTimeouts={false} enabled={IS_PROD} onReportPrepared={onReportPrepared}>
      {/* @ts-expect-error - Property 'children' does not exist on type 'IntrinsicAttributes & IntrinsicClassAttributes<Provider<AppStateUpdateAction | ChartsUpdateAction | ContactsAction | ... 13 more ... | WalletsAction>> & Readonly<...>' */}
      <ReduxProvider store={store}>
        <RecoilRoot>
          <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
            <MobileWalletProtocolProvider secureStorage={ls.mwp} sessionExpiryDays={7}>
              <SafeAreaProvider initialMetrics={initialWindowMetrics}>
                <MainThemeProvider>
                  <GestureHandlerRootView style={sx.container}>
                    <RainbowContextWrapper>
                      <ErrorBoundary>
                        <App />
                        <RainbowToastDisplay />
                      </ErrorBoundary>
                    </RainbowContextWrapper>
                  </GestureHandlerRootView>
                </MainThemeProvider>
              </SafeAreaProvider>
            </MobileWalletProtocolProvider>
          </PersistQueryClientProvider>
        </RecoilRoot>
      </ReduxProvider>
    </PerformanceProfiler>
  );
}

/** Wrapping Root allows Sentry to accurately track startup times */
const RootWithSentry = Sentry.wrap(Root);

const PlaygroundWithReduxStore = () => (
  // @ts-expect-error - Property 'children' does not exist on type 'IntrinsicAttributes & IntrinsicClassAttributes<Provider<AppStateUpdateAction | ChartsUpdateAction | ContactsAction | ... 13 more ... | WalletsAction>> & Readonly<...>'
  <ReduxProvider store={store}>
    <MainThemeProvider>
      <GestureHandlerRootView style={sx.container}>
        <Playground />
      </GestureHandlerRootView>
    </MainThemeProvider>
  </ReduxProvider>
);

AppRegistry.registerComponent('Rainbow', () => (designSystemPlaygroundEnabled ? PlaygroundWithReduxStore : RootWithSentry));

// The report param is not currently used as we have our own time tracking, but it is available at the time we want to finish the app startup report
function onReportPrepared() {
  PerformanceTracking.logReportSegmentRelative(PerformanceReports.appStartup, PerformanceReportSegments.appStartup.tti);
  PerformanceTracking.finishReportSegment(
    PerformanceReports.appStartup,
    PerformanceReportSegments.appStartup.initialScreenInteractiveRender
  );
  PerformanceTracking.finishReport(PerformanceReports.appStartup);
}

async function initializeApplication() {
  PerformanceTracking.startReportSegment(PerformanceReports.appStartup, PerformanceReportSegments.appStartup.initRootComponent);
  await Promise.all([initializeRemoteConfig(), migrate()]);

  const isReturningUser = ls.device.get(['isReturningUser']);
  const [deviceId, deviceIdWasJustCreated] = await getOrCreateDeviceId();

  // Initial telemetry; amended with wallet context later in `initializeWallet`
  Sentry.setUser({ id: deviceId });
  analytics.setDeviceId(deviceId);
  analytics.identify();

  /**
   * We previously relied on the existence of a deviceId on keychain to
   * determine if a user was new or not. For backwards compat, we do this
   * still with `deviceIdWasJustCreated`, but we also set a new value on
   * local storage `isReturningUser` so that other parts of the app can
   * read from that, if necessary.
   *
   * This block of code will only run once.
   */
  if (deviceIdWasJustCreated && !isReturningUser) {
    // on very first open, set some default data and fire event
    logger.debug(`[App]: User opened application for the first time`);

    const { width: screenWidth, height: screenHeight, scale: screenScale } = Dimensions.get('screen');

    analytics.identify({ screenHeight, screenWidth, screenScale });
    analytics.track(analytics.event.firstAppOpen);
  }

  /**
   * Always set this — we may have just migrated deviceId with
   * `getOrCreateDeviceId`, which would mean `deviceIdWasJustCreated` would
   * be false and the new-user block of code above won't run.
   *
   * But by this point in the `initializeApplication`, we've handled new
   * user events and migrations, so we need to make sure this is set to
   * `true`.
   */
  ls.device.set(['isReturningUser'], true);

  PerformanceTracking.finishReportSegment(PerformanceReports.appStartup, PerformanceReportSegments.appStartup.initRootComponent);
}
