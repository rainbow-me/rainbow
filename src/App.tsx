import './languages';
import * as Sentry from '@sentry/react-native';
import React, { useEffect, useRef, useState } from 'react';
import { AppRegistry, AppState, AppStateStatus, Dimensions, InteractionManager, Linking, LogBox, View } from 'react-native';
import branch from 'react-native-branch';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { connect, Provider as ReduxProvider } from 'react-redux';
import { RecoilRoot } from 'recoil';
import PortalConsumer from './components/PortalConsumer';
import ErrorBoundary from './components/error-boundary/ErrorBoundary';
import { OfflineToast } from './components/toasts';
import { designSystemPlaygroundEnabled, reactNativeDisableYellowBox, showNetworkRequests, showNetworkResponses } from './config/debug';
import monitorNetwork from './debugging/network';
import { Playground } from './design-system/playground/Playground';
import handleDeeplink from './handlers/deeplinks';
import { runWalletBackupStatusChecks } from './handlers/walletReadyEvents';
import RainbowContextWrapper from './helpers/RainbowContext';
import isTestFlight from './helpers/isTestFlight';
import * as keychain from '@/model/keychain';
import { loadAddress } from './model/wallet';
import { Navigation } from './navigation';
import RoutesComponent from './navigation/Routes';
import { PerformanceContextMap } from './performance/PerformanceContextMap';
import { PerformanceTracking } from './performance/tracking';
import { PerformanceMetrics } from './performance/tracking/types/PerformanceMetrics';
import { PersistQueryClientProvider, persistOptions, queryClient } from './react-query';
import store from './redux/store';
import { walletConnectLoadState } from './redux/walletconnect';
import { MainThemeProvider } from './theme/ThemeContext';
import { branchListener } from './utils/branch';
import { addressKey } from './utils/keychainConstants';
import { SharedValuesProvider } from '@/helpers/SharedValuesContext';
import { InitialRouteContext } from '@/navigation/initialRoute';
import Routes from '@/navigation/routesNames';
import { Portal } from '@/react-native-cool-modals/Portal';
import { NotificationsHandler } from '@/notifications/NotificationsHandler';
import { analyticsV2 } from '@/analytics';
import { getOrCreateDeviceId, securelyHashWalletAddress } from '@/analytics/utils';
import { logger, RainbowError } from '@/logger';
import * as ls from '@/storage';
import { migrate } from '@/migrations';
import { initListeners as initWalletConnectListeners } from '@/walletConnect';
import { saveFCMToken } from '@/notifications/tokens';
import { initializeReservoirClient } from '@/resources/reservoir/client';
import { ReviewPromptAction } from '@/storage/schema';
import { handleReviewPromptAction } from '@/utils/reviewAlert';
import { RemotePromoSheetProvider } from '@/components/remote-promo-sheet/RemotePromoSheetProvider';
import { RemoteCardProvider } from '@/components/cards/remote-cards';
import { initializeRemoteConfig } from '@/model/remoteConfig';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './navigation/types';
import { Address } from 'viem';
import { IS_DEV } from './env';
import { checkIdentifierOnLaunch } from './model/backup';

if (IS_DEV) {
  reactNativeDisableYellowBox && LogBox.ignoreAllLogs();
  (showNetworkRequests || showNetworkResponses) && monitorNetwork(showNetworkRequests, showNetworkResponses);
}

enableScreens();

const containerStyle = { flex: 1 };

interface AppProps {
  walletReady: boolean;
}

function App({ walletReady }: AppProps) {
  const [appState, setAppState] = useState(AppState.currentState);
  const [initialRoute, setInitialRoute] = useState<typeof Routes.WELCOME_SCREEN | typeof Routes.SWIPE_LAYOUT | null>(null);
  const eventSubscription = useRef<ReturnType<typeof AppState.addEventListener> | null>(null);
  const branchListenerRef = useRef<ReturnType<typeof branch.subscribe> | null>(null);
  const navigatorRef = useRef<NavigationContainerRef<RootStackParamList> | null>(null);

  useEffect(() => {
    if (!__DEV__ && isTestFlight) {
      logger.info(`Test flight usage - ${isTestFlight}`);
    }
    identifyFlow();
    eventSubscription.current = AppState.addEventListener('change', handleAppStateChange);

    const p1 = analyticsV2.initializeRudderstack();
    const p2 = setupDeeplinking();
    const p3 = saveFCMToken();
    Promise.all([p1, p2, p3]).then(() => {
      initWalletConnectListeners();
      PerformanceTracking.finishMeasuring(PerformanceMetrics.loadRootAppComponent);
      analyticsV2.track(analyticsV2.event.applicationDidMount);
    });

    return () => {
      eventSubscription.current?.remove();
      branchListenerRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (walletReady) {
      logger.info('✅ Wallet ready!');
      runWalletBackupStatusChecks();
    }
  }, [walletReady]);

  const setupDeeplinking = async () => {
    const initialUrl = await Linking.getInitialURL();
    branchListenerRef.current = await branchListener(url => {
      logger.debug(`Branch: listener called`, {}, logger.DebugContext.deeplinks);
      try {
        handleDeeplink(url, initialRoute);
      } catch (error) {
        if (error instanceof Error) {
          logger.error(new RainbowError('Error opening deeplink'), {
            message: error.message,
            url,
          });
        } else {
          logger.error(new RainbowError('Error opening deeplink'), {
            message: 'Unknown error',
            url,
          });
        }
      }
    });

    if (initialUrl) {
      logger.debug(`App: has initial URL, opening with Branch`, { initialUrl });
      branch.openURL(initialUrl);
    }
  };

  const identifyFlow = async () => {
    const address = await loadAddress();
    if (address) {
      setTimeout(() => {
        InteractionManager.runAfterInteractions(() => {
          handleReviewPromptAction(ReviewPromptAction.TimesLaunchedSinceInstall);
        });
      }, 10_000);

      InteractionManager.runAfterInteractions(checkIdentifierOnLaunch);
    }

    setInitialRoute(address ? Routes.SWIPE_LAYOUT : Routes.WELCOME_SCREEN);
    PerformanceContextMap.set('initialRoute', address ? Routes.SWIPE_LAYOUT : Routes.WELCOME_SCREEN);
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState === 'background' && nextAppState === 'active') {
      store.dispatch(walletConnectLoadState());
    }
    setAppState(nextAppState);
    analyticsV2.track(analyticsV2.event.appStateChange, {
      category: 'app state',
      label: nextAppState,
    });
  };

  const handleNavigatorRef = (ref: NavigationContainerRef<RootStackParamList>) => {
    navigatorRef.current = ref;
    Navigation.setTopLevelNavigator(ref);
  };

  return (
    <Portal>
      <View style={containerStyle}>
        {initialRoute && (
          <RemotePromoSheetProvider isWalletReady={walletReady}>
            <RemoteCardProvider>
              <InitialRouteContext.Provider value={initialRoute}>
                <RoutesComponent ref={handleNavigatorRef} />
                <PortalConsumer />
              </InitialRouteContext.Provider>
            </RemoteCardProvider>
          </RemotePromoSheetProvider>
        )}
        <OfflineToast />
      </View>
      <NotificationsHandler walletReady={walletReady} />
    </Portal>
  );
}

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

const AppWithRedux = connect<unknown, AppDispatch, unknown, RootState>(state => ({
  walletReady: state.appState.walletReady,
}))(App);

function Root() {
  const [initializing, setInitializing] = React.useState(true);

  React.useEffect(() => {
    async function initializeApplication() {
      await initializeRemoteConfig();
      await migrate();

      const isReturningUser = ls.device.get(['isReturningUser']);
      const [deviceId, deviceIdWasJustCreated] = await getOrCreateDeviceId();
      const currentWalletAddress = await keychain.loadString(addressKey);
      const currentWalletAddressHash =
        typeof currentWalletAddress === 'string' ? securelyHashWalletAddress(currentWalletAddress as Address) : undefined;

      Sentry.setUser({
        id: deviceId,
        currentWalletAddress: currentWalletAddressHash,
      });

      /**
       * Add helpful values to `analyticsV2` instance
       */
      analyticsV2.setDeviceId(deviceId);
      if (currentWalletAddressHash) {
        analyticsV2.setCurrentWalletAddressHash(currentWalletAddressHash);
      }

      /**
       * `analyticsv2` has all it needs to function.
       */
      analyticsV2.identify({});

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
        logger.info(`User opened application for the first time`);

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
        logger.debug(`Application initialized with Sentry and analytics`);

        // init complete, load the rest of the app
        setInitializing(false);
      })
      .catch(() => {
        logger.error(new RainbowError(`initializeApplication failed`));

        // for failure, continue to rest of the app for now
        setInitializing(false);
      });
    initializeReservoirClient();
  }, [setInitializing]);

  return initializing ? null : (
    // @ts-expect-error - Property 'children' does not exist on type 'IntrinsicAttributes & IntrinsicClassAttributes<Provider<AppStateUpdateAction | ChartsUpdateAction | ContactsAction | ... 13 more ... | WalletsAction>> & Readonly<...>'
    <ReduxProvider store={store}>
      <RecoilRoot>
        <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
          <SafeAreaProvider>
            <MainThemeProvider>
              <RainbowContextWrapper>
                <SharedValuesProvider>
                  <ErrorBoundary>
                    <AppWithRedux walletReady={false} />
                  </ErrorBoundary>
                </SharedValuesProvider>
              </RainbowContextWrapper>
            </MainThemeProvider>
          </SafeAreaProvider>
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
