import '@/languages';

import React, { memo, useCallback, useEffect, useState } from 'react';
import { AppRegistry, Dimensions, LogBox, StyleSheet, View } from 'react-native';

import { MobileWalletProtocolProvider } from '@coinbase/mobile-wallet-protocol-host';
import * as Sentry from '@sentry/react-native';
import { PerformanceProfiler } from '@shopify/react-native-performance';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { Provider as ReduxProvider } from 'react-redux';
import { RecoilRoot } from 'recoil';
import { Toaster } from 'sonner-native';

import { analytics } from '@/analytics';
import { getOrCreateDeviceId } from '@/analytics/utils';
import { ErrorBoundary } from '@/app/error-boundary/ErrorBoundary';
import { DeeplinkHandler } from '@/app/navigation/DeeplinkHandler';
import { TestDeeplinkHandler } from '@/app/navigation/TestDeeplinkHandler';
import { RainbowToastDisplay } from '@/components/rainbow-toast/RainbowToast';
import { OfflineToast } from '@/components/toasts';
import { reactNativeDisableYellowBox, showNetworkRequests, showNetworkResponses } from '@/config/debug';
import monitorNetwork from '@/debugging/network';
import { IS_DEV, IS_PROD, IS_STORE_INSTALL, IS_TEST } from '@/env';
import { configureDelegationSdk } from '@/features/delegation/configureClient';
import RainbowContextWrapper from '@/helpers/RainbowContext';
import { useApplicationSetup } from '@/hooks/useApplicationSetup';
import { logger, RainbowError } from '@/logger';
import { migrate } from '@/migrations';
import { initializeRemoteConfig } from '@/model/remoteConfig';
import { InitialRouteContext } from '@/navigation/initialRoute';
import { setNavigationRef } from '@/navigation/Navigation';
import Routes from '@/navigation/Routes';
import { NotificationsHandler } from '@/notifications/NotificationsHandler';
import { persistOptions, PersistQueryClientProvider, queryClient } from '@/react-query';
import store from '@/redux/store';
import { initializeReservoirClient } from '@/resources/reservoir/client';
import { loadSettingsData } from '@/state/settings/loadSettingsData';
import { BackupsSync } from '@/state/sync/BackupsSync';
import * as ls from '@/storage';
import { MainThemeProvider } from '@/theme/ThemeContext';

import { AbsolutePortalRoot } from './components/AbsolutePortal';
import { PerformanceReports, PerformanceReportSegments, PerformanceTracking } from './performance/tracking';

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
  const initialRoute = useApplicationSetup();

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
            <Routes onReady={onNavigationReady} ref={setNavigationRef} />
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
              <KeyboardProvider>
                <SafeAreaProvider initialMetrics={initialWindowMetrics}>
                  <MainThemeProvider>
                    <GestureHandlerRootView style={sx.container}>
                      <RainbowContextWrapper>
                        <ErrorBoundary>
                          <App />
                          <RainbowToastDisplay />
                          <ReducedMotionConfig mode={ReduceMotion.Never} />
                        </ErrorBoundary>
                      </RainbowContextWrapper>
                    </GestureHandlerRootView>
                  </MainThemeProvider>
                </SafeAreaProvider>
              </KeyboardProvider>
            </MobileWalletProtocolProvider>
          </PersistQueryClientProvider>
        </RecoilRoot>
      </ReduxProvider>
    </PerformanceProfiler>
  );
}

/** Wrapping Root allows Sentry to accurately track startup times */
const RootWithSentry = Sentry.wrap(Root);

AppRegistry.registerComponent('Rainbow', () => RootWithSentry);

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

  const [deviceId, deviceIdWasJustCreated] = await getOrCreateDeviceId();

  Sentry.setUser({ id: deviceId });
  analytics.init({ deviceId });
  const installSource = IS_DEV ? 'dev' : IS_STORE_INSTALL ? 'store' : 'internal';
  analytics.identify({ installSource });
  // Paired probe event. Lets us distinguish "identify trait dropped by pipeline"
  // from "whole session too short to flush" by comparing track delivery to
  // user-property delivery in Amplitude. Remove after FEPLAT-67 wraps up.
  analytics.track(analytics.event.debugIdentifyProbe, { probe: 'installSource', value: installSource });

  await Promise.all([initializeRemoteConfig(), migrate(), loadSettingsData(), configureDelegationSdk()]);

  /**
   * We previously relied on the existence of a deviceId on keychain to
   * determine if a user was new or not. For backwards compat, we do this
   * still with `deviceIdWasJustCreated`, but we also set a new value on
   * local storage `isReturningUser` so that other parts of the app can
   * read from that, if necessary.
   *
   * This block of code will only run once.
   */
  const isReturningUser = ls.device.get(['isReturningUser']);
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
