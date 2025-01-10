import '@/languages';
import * as Sentry from '@sentry/react-native';
import React, { useCallback, useEffect, useState, memo } from 'react';
import { AppRegistry, Dimensions, LogBox, StyleSheet, View } from 'react-native';
import { Toaster } from 'sonner-native';
import { MobileWalletProtocolProvider } from '@coinbase/mobile-wallet-protocol-host';
import { DeeplinkHandler } from '@/components/DeeplinkHandler';
import { useApplicationSetup } from '@/hooks/useApplicationSetup';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { connect, Provider as ReduxProvider, shallowEqual } from 'react-redux';
import { RecoilRoot } from 'recoil';
import ErrorBoundary from '@/components/error-boundary/ErrorBoundary';
import { OfflineToast } from '@/components/toasts';
import { designSystemPlaygroundEnabled, reactNativeDisableYellowBox, showNetworkRequests, showNetworkResponses } from '@/config/debug';
import monitorNetwork from '@/debugging/network';
import { Playground } from '@/design-system/playground/Playground';
import RainbowContextWrapper from '@/helpers/RainbowContext';
import { Navigation } from '@/navigation';
import { PersistQueryClientProvider, persistOptions, queryClient } from '@/react-query';
import store, { AppDispatch, type AppState } from '@/redux/store';
import { MainThemeProvider } from '@/theme/ThemeContext';
import { SharedValuesProvider } from '@/helpers/SharedValuesContext';
import { InitialRouteContext } from '@/navigation/initialRoute';
import { NotificationsHandler } from '@/notifications/NotificationsHandler';
import { analyticsV2 } from '@/analytics';
import { getOrCreateDeviceId } from '@/analytics/utils';
import { logger, RainbowError } from '@/logger';
import * as ls from '@/storage';
import { migrate } from '@/migrations';
import { initializeReservoirClient } from '@/resources/reservoir/client';
import { ReviewPromptAction } from '@/storage/schema';
import { initializeRemoteConfig } from '@/model/remoteConfig';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { IS_ANDROID, IS_DEV } from '@/env';
import { prefetchDefaultFavorites } from '@/resources/favorites';
import Routes from '@/navigation/Routes';
import { BackupsSync } from '@/state/sync/BackupsSync';
import { BackendNetworks } from '@/components/BackendNetworks';
import { AbsolutePortalRoot } from './components/AbsolutePortal';
import { getAndroidBottomInset } from './utils/deviceUtils';

if (IS_DEV) {
  reactNativeDisableYellowBox && LogBox.ignoreAllLogs();
  (showNetworkRequests || showNetworkResponses) && monitorNetwork(showNetworkRequests, showNetworkResponses);
}

enableScreens();

const ANDROID_BOTTOM_INSET = IS_ANDROID ? getAndroidBottomInset() : 0;

const sx = StyleSheet.create({
  androidNavigationBarPadding: {
    paddingBottom: ANDROID_BOTTOM_INSET,
  },
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});

interface AppProps {
  walletReady: boolean;
}

function App({ walletReady }: AppProps) {
  const { initialRoute } = useApplicationSetup();
  const handleNavigatorRef = useCallback((ref: NavigationContainerRef<RootStackParamList>) => {
    Navigation.setTopLevelNavigator(ref);
  }, []);

  return (
    <>
      <View style={[sx.container, IS_ANDROID ? sx.androidNavigationBarPadding : {}]}>
        {initialRoute && (
          <InitialRouteContext.Provider value={initialRoute}>
            <Routes ref={handleNavigatorRef} />
          </InitialRouteContext.Provider>
        )}
        <OfflineToast />
        <Toaster />
      </View>
      <NotificationsHandler walletReady={walletReady} />
      <DeeplinkHandler initialRoute={initialRoute} walletReady={walletReady} />
      <BackupsSync />
      <BackendNetworks />
      <AbsolutePortalRoot />
    </>
  );
}

const AppWithRedux = connect<AppProps, AppDispatch, AppProps, AppState>(
  state => ({
    walletReady: state.appState.walletReady,
  }),
  null,
  null,
  {
    areStatesEqual: (next, prev) => {
      // Only update if walletReady actually changed
      return next.appState.walletReady === prev.appState.walletReady;
    },
    areOwnPropsEqual: shallowEqual,
  }
)(memo(App));

function Root() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function initializeApplication() {
      await initializeRemoteConfig();
      await migrate();

      const isReturningUser = ls.device.get(['isReturningUser']);
      const [deviceId, deviceIdWasJustCreated] = await getOrCreateDeviceId();

      // Initial telemetry; amended with wallet context later in `useInitializeWallet`
      Sentry.setUser({ id: deviceId });
      analyticsV2.setDeviceId(deviceId);
      analyticsV2.identify();

      const isReviewInitialized = ls.review.get(['initialized']);
      if (!isReviewInitialized) {
        ls.review.set(['hasReviewed'], false);
        ls.review.set(
          ['actions'],
          Object.values(ReviewPromptAction).map(action => ({
            id: action,
            numOfTimesDispatched: 0,
          }))
        );

        ls.review.set(['timeOfLastPrompt'], 0);
        ls.review.set(['initialized'], true);
      }

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

        analyticsV2.identify({ screenHeight, screenWidth, screenScale });
        analyticsV2.track(analyticsV2.event.firstAppOpen);
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
    }

    initializeApplication()
      .then(() => {
        logger.debug(`[App]: Application initialized with Sentry and analytics`);

        // init complete, load the rest of the app
        setInitializing(false);
      })
      .catch(error => {
        logger.error(new RainbowError(`[App]: initializeApplication failed`), {
          data: {
            error,
          },
        });

        // for failure, continue to rest of the app for now
        setInitializing(false);
      });
    initializeReservoirClient();
  }, [setInitializing]);

  return initializing ? null : (
    // @ts-expect-error - Property 'children' does not exist on type 'IntrinsicAttributes & IntrinsicClassAttributes<Provider<AppStateUpdateAction | ChartsUpdateAction | ContactsAction | ... 13 more ... | WalletsAction>> & Readonly<...>'
    <ReduxProvider store={store}>
      <RecoilRoot>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={persistOptions}
          onSuccess={() => {
            prefetchDefaultFavorites();
          }}
        >
          <MobileWalletProtocolProvider secureStorage={ls.mwp} sessionExpiryDays={7}>
            <SafeAreaProvider initialMetrics={initialWindowMetrics}>
              <MainThemeProvider>
                <GestureHandlerRootView style={sx.container}>
                  <RainbowContextWrapper>
                    <SharedValuesProvider>
                      <ErrorBoundary>
                        <AppWithRedux walletReady={false} />
                      </ErrorBoundary>
                    </SharedValuesProvider>
                  </RainbowContextWrapper>
                </GestureHandlerRootView>
              </MainThemeProvider>
            </SafeAreaProvider>
          </MobileWalletProtocolProvider>
        </PersistQueryClientProvider>
      </RecoilRoot>
    </ReduxProvider>
  );
}

/** Wrapping Root allows Sentry to accurately track startup times */
const RootWithSentry = Sentry.wrap(Root);

const PlaygroundWithReduxStore = () => (
  // @ts-expect-error - Property 'children' does not exist on type 'IntrinsicAttributes & IntrinsicClassAttributes<Provider<AppStateUpdateAction | ChartsUpdateAction | ContactsAction | ... 13 more ... | WalletsAction>> & Readonly<...>'
  <ReduxProvider store={store}>
    <Playground />
  </ReduxProvider>
);

AppRegistry.registerComponent('Rainbow', () => (designSystemPlaygroundEnabled ? PlaygroundWithReduxStore : RootWithSentry));
