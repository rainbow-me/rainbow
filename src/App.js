import './languages';
import messaging from '@react-native-firebase/messaging';
import analytics from '@segment/analytics-react-native';
import * as Sentry from '@sentry/react-native';
import { get } from 'lodash';
import { nanoid } from 'nanoid/non-secure';
import PropTypes from 'prop-types';
import React, { Component, createRef } from 'react';
import {
  AppRegistry,
  AppState,
  InteractionManager,
  Linking,
  LogBox,
  StatusBar,
  View,
} from 'react-native';
// eslint-disable-next-line import/default
import codePush from 'react-native-code-push';
import {
  IS_TESTING,
  REACT_APP_SEGMENT_API_WRITE_KEY,
  SENTRY_ENDPOINT,
  SENTRY_ENVIRONMENT,
} from 'react-native-dotenv';

// eslint-disable-next-line import/default
import RNIOS11DeviceCheck from 'react-native-ios11-devicecheck';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import VersionNumber from 'react-native-version-number';
import { QueryClientProvider } from 'react-query';
import { connect, Provider } from 'react-redux';
import { RecoilRoot } from 'recoil';
import PortalConsumer from './components/PortalConsumer';
import ErrorBoundary from './components/error-boundary/ErrorBoundary';
import { FedoraToast, OfflineToast } from './components/toasts';
import {
  designSystemPlaygroundEnabled,
  reactNativeDisableYellowBox,
  showNetworkRequests,
  showNetworkResponses,
} from './config/debug';
import monitorNetwork from './debugging/network';
import { Playground } from './design-system/playground/Playground';
import appEvents from './handlers/appEvents';
import handleDeeplink from './handlers/deeplinks';
import { runWalletBackupStatusChecks } from './handlers/walletReadyEvents';
import { isL2Network } from './handlers/web3';
import RainbowContextWrapper from './helpers/RainbowContext';
import isTestFlight from './helpers/isTestFlight';
import networkTypes from './helpers/networkTypes';
import { registerTokenRefreshListener, saveFCMToken } from './model/firebase';
import * as keychain from './model/keychain';
import { loadAddress } from './model/wallet';
import { Navigation } from './navigation';
import RoutesComponent from './navigation/Routes';
import { PerformanceTracking } from './performance/tracking';
import { PerformanceMetrics } from './performance/tracking/types/PerformanceMetrics';
import { queryClient } from './react-query/queryClient';
import { explorerInitL2 } from './redux/explorer';
import { fetchOnchainBalances } from './redux/fallbackExplorer';
import { requestsForTopic } from './redux/requests';
import store from './redux/store';
import { uniswapPairsInit } from './redux/uniswap';
import { walletConnectLoadState } from './redux/walletconnect';
import { rainbowTokenList } from './references';
import { MainThemeProvider } from './theme/ThemeContext';
import { branchListener } from './utils/branch';
import { analyticsUserIdentifier } from './utils/keychainConstants';
import {
  CODE_PUSH_DEPLOYMENT_KEY,
  isCustomBuild,
} from '@rainbow-me/handlers/fedora';
import { SharedValuesProvider } from '@rainbow-me/helpers/SharedValuesContext';
import { InitialRouteContext } from '@rainbow-me/navigation/initialRoute';
import Routes from '@rainbow-me/routes';
import logger from 'logger';
import { Portal } from 'react-native-cool-modals/Portal';
const WALLETCONNECT_SYNC_DELAY = 500;

const FedoraToastRef = createRef();

StatusBar.pushStackEntry({ animated: true, barStyle: 'dark-content' });

// We need to disable React Navigation instrumentation for E2E tests
// because detox doesn't like setTimeout calls that are used inside
// When enabled detox hangs and timeouts on all test cases
const routingInstrumentation = IS_TESTING
  ? undefined
  : new Sentry.ReactNavigationInstrumentation();

if (__DEV__) {
  reactNativeDisableYellowBox && LogBox.ignoreAllLogs();
  (showNetworkRequests || showNetworkResponses) &&
    monitorNetwork(showNetworkRequests, showNetworkResponses);
} else {
  // eslint-disable-next-line no-inner-declarations
  async function initSentryAndCheckForFedoraMode() {
    let metadata;
    try {
      const config = await codePush.getCurrentPackage();
      if (!config || config.deploymentKey === CODE_PUSH_DEPLOYMENT_KEY) {
        codePush.sync({
          deploymentKey: CODE_PUSH_DEPLOYMENT_KEY,
          installMode: codePush.InstallMode.ON_NEXT_RESTART,
        });
      } else {
        isCustomBuild.value = true;
        setTimeout(() => FedoraToastRef?.current?.show(), 300);
      }

      metadata = await codePush.getUpdateMetadata();
    } catch (e) {
      logger.log('error initiating codepush settings', e);
    }
    const sentryOptions = {
      dsn: SENTRY_ENDPOINT,
      enableAutoSessionTracking: true,
      environment: SENTRY_ENVIRONMENT,
      integrations: [
        new Sentry.ReactNativeTracing({
          routingInstrumentation,
          tracingOrigins: ['localhost', /^\//],
        }),
      ],
      tracesSampleRate: 0.2,
      ...(metadata && {
        dist: metadata.label,
        release: `${metadata.appVersion} (${VersionNumber.buildVersion}) (CP ${metadata.label})`,
      }),
    };
    Sentry.init(sentryOptions);
  }
  initSentryAndCheckForFedoraMode();
}

enableScreens();

const containerStyle = { flex: 1 };

class App extends Component {
  static propTypes = {
    requestsForTopic: PropTypes.func,
  };

  state = { appState: AppState.currentState, initialRoute: null };

  async componentDidMount() {
    if (!__DEV__ && isTestFlight) {
      logger.sentry(`Test flight usage - ${isTestFlight}`);
    }
    this.identifyFlow();
    InteractionManager.runAfterInteractions(() => {
      rainbowTokenList.update();
    });
    AppState.addEventListener('change', this.handleAppStateChange);
    rainbowTokenList.on('update', this.handleTokenListUpdate);
    appEvents.on('transactionConfirmed', this.handleTransactionConfirmed);
    await this.handleInitializeAnalytics();
    saveFCMToken();
    this.onTokenRefreshListener = registerTokenRefreshListener();

    this.foregroundNotificationListener = messaging().onMessage(
      this.onRemoteNotification
    );

    this.backgroundNotificationListener = messaging().setBackgroundMessageHandler(
      async remoteMessage => {
        setTimeout(() => {
          const topic = get(remoteMessage, 'data.topic');
          this.onPushNotificationOpened(topic);
        }, WALLETCONNECT_SYNC_DELAY);
      }
    );

    this.branchListener = branchListener(this.handleOpenLinkingURL);

    // Walletconnect uses direct deeplinks
    if (android) {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          this.handleOpenLinkingURL(initialUrl);
        }
      } catch (e) {
        logger.log('Error opening deeplink', e);
      }
      Linking.addEventListener('url', ({ url }) => {
        this.handleOpenLinkingURL(url);
      });
    }

    PerformanceTracking.finishMeasuring(
      PerformanceMetrics.loadRootAppComponent
    );
    analytics.track('React component tree finished initial mounting');
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.walletReady && this.props.walletReady) {
      // Everything we need to do after the wallet is ready goes here
      logger.sentry('✅ Wallet ready!');
      runWalletBackupStatusChecks();
    }
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
    rainbowTokenList?.off?.('update', this.handleTokenListUpdate);
    this.onTokenRefreshListener?.();
    this.foregroundNotificationListener?.();
    this.backgroundNotificationListener?.();
    this.branchListener?.();
  }

  identifyFlow = async () => {
    const address = await loadAddress();
    if (address) {
      this.setState({ initialRoute: Routes.SWIPE_LAYOUT });
    } else {
      this.setState({ initialRoute: Routes.WELCOME_SCREEN });
    }
  };

  async handleTokenListUpdate() {
    store.dispatch(uniswapPairsInit());
  }

  onRemoteNotification = notification => {
    const topic = get(notification, 'data.topic');
    setTimeout(() => {
      this.onPushNotificationOpened(topic);
    }, WALLETCONNECT_SYNC_DELAY);
  };

  handleOpenLinkingURL = url => {
    handleDeeplink(url, this.state.initialRoute);
  };

  onPushNotificationOpened = topic => {
    const { requestsForTopic } = this.props;
    const requests = requestsForTopic(topic);
    if (requests) {
      // WC requests will open automatically
      return false;
    }
    // In the future, here  is where we should
    // handle all other kinds of push notifications
    // For ex. incoming txs, etc.
  };

  handleInitializeAnalytics = async () => {
    // Comment the line below to debug analytics
    if (__DEV__) return false;
    const storedIdentifier = await keychain.loadString(analyticsUserIdentifier);

    if (!storedIdentifier) {
      const identifier = await RNIOS11DeviceCheck.getToken()
        .then(deviceId => deviceId)
        .catch(() => nanoid());
      await keychain.saveString(analyticsUserIdentifier, identifier);
      analytics.identify(identifier);
      analytics.track('First App Open');
    }

    await analytics.setup(REACT_APP_SEGMENT_API_WRITE_KEY, {
      ios: {
        trackDeepLinks: true,
      },
      trackAppLifecycleEvents: true,
      trackAttributionData: true,
    });
  };

  handleAppStateChange = async nextAppState => {
    // Restore WC connectors when going from BG => FG
    if (this.state.appState === 'background' && nextAppState === 'active') {
      store.dispatch(walletConnectLoadState());
      InteractionManager.runAfterInteractions(() => {
        rainbowTokenList.update();
      });
    }
    this.setState({ appState: nextAppState });

    analytics.track('State change', {
      category: 'app state',
      label: nextAppState,
    });
  };

  handleNavigatorRef = navigatorRef => {
    this.navigatorRef = navigatorRef;
    Navigation.setTopLevelNavigator(navigatorRef);
  };

  handleTransactionConfirmed = tx => {
    const network = tx.network || networkTypes.mainnet;
    const isL2 = isL2Network(network);
    const updateBalancesAfter = (timeout, isL2, network) => {
      setTimeout(() => {
        logger.log('Reloading balances for network', network);
        if (isL2) {
          store.dispatch(explorerInitL2(network));
        } else {
          store.dispatch(
            fetchOnchainBalances({ keepPolling: false, withPrices: false })
          );
        }
      }, timeout);
    };
    logger.log('reloading balances soon...');
    updateBalancesAfter(2000, isL2, network);
    updateBalancesAfter(isL2 ? 10000 : 5000, isL2, network);
  };

  handleSentryNavigationIntegration = () => {
    routingInstrumentation?.registerNavigationContainer(this.navigatorRef);
  };

  render = () => (
    <MainThemeProvider>
      <RainbowContextWrapper>
        <ErrorBoundary>
          <Portal>
            <SafeAreaProvider>
              <QueryClientProvider client={queryClient}>
                <Provider store={store}>
                  <RecoilRoot>
                    <SharedValuesProvider>
                      <View style={containerStyle}>
                        {this.state.initialRoute && (
                          <InitialRouteContext.Provider
                            value={this.state.initialRoute}
                          >
                            <RoutesComponent
                              onReady={this.handleSentryNavigationIntegration}
                              ref={this.handleNavigatorRef}
                            />
                            <PortalConsumer />
                          </InitialRouteContext.Provider>
                        )}
                        <OfflineToast />
                        <FedoraToast ref={FedoraToastRef} />
                      </View>
                    </SharedValuesProvider>
                  </RecoilRoot>
                </Provider>
              </QueryClientProvider>
            </SafeAreaProvider>
          </Portal>
        </ErrorBoundary>
      </RainbowContextWrapper>
    </MainThemeProvider>
  );
}

const AppWithRedux = connect(
  ({ appState: { walletReady } }) => ({ walletReady }),
  {
    requestsForTopic,
  }
)(App);

const AppWithReduxStore = () => <AppWithRedux store={store} />;

const AppWithSentry = Sentry.wrap(AppWithReduxStore);

const codePushOptions = { checkFrequency: codePush.CheckFrequency.MANUAL };

const AppWithCodePush = codePush(codePushOptions)(AppWithSentry);

AppRegistry.registerComponent('Rainbow', () =>
  designSystemPlaygroundEnabled ? Playground : AppWithCodePush
);
