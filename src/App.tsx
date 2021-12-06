import messaging from '@react-native-firebase/messaging';
import analytics from '@segment/analytics-react-native';
import * as Sentry from '@sentry/react-native';
import { get } from 'lodash';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'nano... Remove this comment to see the full error message
import nanoid from 'nanoid/non-secure';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  AppRegistry,
  AppState,
  InteractionManager,
  Linking,
  LogBox,
  NativeModules,
  StatusBar,
} from 'react-native';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import branch from 'react-native-branch';
import {
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  IS_TESTING,
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  REACT_APP_SEGMENT_API_WRITE_KEY,
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  SENTRY_ENDPOINT,
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  SENTRY_ENVIRONMENT,
} from 'react-native-dotenv';

// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
// eslint-disable-next-line import/default
import RNIOS11DeviceCheck from 'react-native-ios11-devicecheck';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { connect, Provider } from 'react-redux';
// @ts-expect-error ts-migrate(6142) FIXME: Module './components/PortalConsumer' was resolved ... Remove this comment to see the full error message
import PortalConsumer from './components/PortalConsumer';
// @ts-expect-error ts-migrate(6142) FIXME: Module './components/error-boundary/ErrorBoundary'... Remove this comment to see the full error message
import ErrorBoundary from './components/error-boundary/ErrorBoundary';
import { FlexItem } from './components/layout';
import { OfflineToast } from './components/toasts';
import {
  designSystemPlaygroundEnabled,
  reactNativeDisableYellowBox,
  showNetworkRequests,
  showNetworkResponses,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module './config/debug' or its corresp... Remove this comment to see the full error message
} from './config/debug';
// @ts-expect-error ts-migrate(6142) FIXME: Module './context/ThemeContext' was resolved to '/... Remove this comment to see the full error message
import { MainThemeProvider } from './context/ThemeContext';
import { InitialRouteContext } from './context/initialRoute';
import monitorNetwork from './debugging/network';
// @ts-expect-error ts-migrate(6142) FIXME: Module './design-system/playground/Playground' was... Remove this comment to see the full error message
import { Playground } from './design-system/playground/Playground';
import appEvents from './handlers/appEvents';
import handleDeeplink from './handlers/deeplinks';
import { runWalletBackupStatusChecks } from './handlers/walletReadyEvents';
import { isL2Network } from './handlers/web3';
// @ts-expect-error ts-migrate(6142) FIXME: Module './helpers/RainbowContext' was resolved to ... Remove this comment to see the full error message
import RainbowContextWrapper from './helpers/RainbowContext';
import { registerTokenRefreshListener, saveFCMToken } from './model/firebase';
import * as keychain from './model/keychain';
import { loadAddress } from './model/wallet';
import { Navigation } from './navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module './navigation/Routes' or its co... Remove this comment to see the full error message
import RoutesComponent from './navigation/Routes';
import { explorerInitL2 } from './redux/explorer';
import { fetchOnchainBalances } from './redux/fallbackExplorer';
import { requestsForTopic } from './redux/requests';
import store from './redux/store';
import { uniswapPairsInit } from './redux/uniswap';
import { walletConnectLoadState } from './redux/walletconnect';
import { rainbowTokenList } from './references';
import { ethereumUtils } from './utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-cool-modals/Porta... Remove this comment to see the full error message
import { Portal } from 'react-native-cool-modals/Portal';

const WALLETCONNECT_SYNC_DELAY = 500;

StatusBar.pushStackEntry({ animated: true, barStyle: 'dark-content' });

if (__DEV__) {
  reactNativeDisableYellowBox && LogBox.ignoreAllLogs();
  (showNetworkRequests || showNetworkResponses) &&
    monitorNetwork(showNetworkRequests, showNetworkResponses);
} else {
  let sentryOptions = {
    dsn: SENTRY_ENDPOINT,
    enableAutoSessionTracking: true,
    environment: SENTRY_ENVIRONMENT,
  };
  Sentry.init(sentryOptions);
}

enableScreens();

const { RNTestFlight } = NativeModules;

class App extends Component {
  static propTypes = {
    requestsForTopic: PropTypes.func,
  };

  backgroundNotificationListener: any;
  branchListener: any;
  foregroundNotificationListener: any;
  onTokenRefreshListener: any;

  state = { appState: AppState.currentState, initialRoute: null };

  async componentDidMount() {
    if (!__DEV__ && RNTestFlight) {
      const { isTestFlight } = RNTestFlight.getConstants();
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

    this.branchListener = branch.subscribe(({ error, params, uri }: any) => {
      if (error) {
        logger.error('Error from Branch: ' + error);
      }

      if (params['+non_branch_link']) {
        const nonBranchUrl = params['+non_branch_link'];
        handleDeeplink(nonBranchUrl);
        return;
      } else if (!params['+clicked_branch_link']) {
        // Indicates initialization success and some other conditions.
        // No link was opened.
        if (IS_TESTING === 'true') {
          handleDeeplink(uri);
        } else {
          return;
        }
      } else if (uri) {
        handleDeeplink(uri);
      }
    });

    // Walletconnect uses direct deeplinks
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    if (android) {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          handleDeeplink(initialUrl);
        }
      } catch (e) {
        logger.log('Error opening deeplink', e);
      }
      Linking.addEventListener('url', ({ url }) => {
        handleDeeplink(url);
      });
    }
  }

  componentDidUpdate(prevProps: any) {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'walletReady' does not exist on type 'Rea... Remove this comment to see the full error message
    if (!prevProps.walletReady && this.props.walletReady) {
      // Everything we need to do after the wallet is ready goes here
      logger.sentry('✅ Wallet ready!');
      runWalletBackupStatusChecks();
    }
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
    rainbowTokenList.off('update', this.handleTokenListUpdate);
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

  onRemoteNotification = (notification: any) => {
    const topic = get(notification, 'data.topic');
    setTimeout(() => {
      this.onPushNotificationOpened(topic);
    }, WALLETCONNECT_SYNC_DELAY);
  };

  handleOpenLinkingURL = (url: any) => {
    handleDeeplink(url);
  };

  onPushNotificationOpened = (topic: any) => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'requestsForTopic' does not exist on type... Remove this comment to see the full error message
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
    const storedIdentifier = await keychain.loadString(
      'analyticsUserIdentifier'
    );

    if (!storedIdentifier) {
      const identifier = await RNIOS11DeviceCheck.getToken()
        .then((deviceId: any) => deviceId)
        .catch(() => nanoid());
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
      await keychain.saveString('analyticsUserIdentifier', identifier);
      analytics.identify(identifier);
    }

    await analytics.setup(REACT_APP_SEGMENT_API_WRITE_KEY, {
      ios: {
        trackDeepLinks: true,
      },
      trackAppLifecycleEvents: true,
      trackAttributionData: true,
    });
  };

  handleAppStateChange = async (nextAppState: any) => {
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

  handleNavigatorRef = (navigatorRef: any) =>
    Navigation.setTopLevelNavigator(navigatorRef);

  handleTransactionConfirmed = (tx: any) => {
    const network = ethereumUtils.getNetworkFromChainId(tx.chainId);
    const isL2 = isL2Network(network);
    const updateBalancesAfter = (timeout: any, isL2: any, network: any) => {
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

  render = () => (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <MainThemeProvider>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <RainbowContextWrapper>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ErrorBoundary>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Portal>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <SafeAreaProvider>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Provider store={store}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <FlexItem>
                  {this.state.initialRoute && (
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <InitialRouteContext.Provider
                      value={this.state.initialRoute}
                    >
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                      JSX unless the '--jsx' flag is provided... Remove this
                      comment to see the full error message
                      <RoutesComponent ref={this.handleNavigatorRef} />
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                      JSX unless the '--jsx' flag is provided... Remove this
                      comment to see the full error message
                      <PortalConsumer />
                    </InitialRouteContext.Provider>
                  )}
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <OfflineToast />
                </FlexItem>
              </Provider>
            </SafeAreaProvider>
          </Portal>
        </ErrorBoundary>
      </RainbowContextWrapper>
    </MainThemeProvider>
  );
}

const AppWithRedux = connect(
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'appState' does not exist on type 'Defaul... Remove this comment to see the full error message
  ({ appState: { walletReady } }) => ({ walletReady }),
  {
    requestsForTopic,
  }
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'typeof App' is not assignable to... Remove this comment to see the full error message
)(App);

// @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
const AppWithReduxStore = () => <AppWithRedux store={store} />;

AppRegistry.registerComponent('Rainbow', () =>
  designSystemPlaygroundEnabled ? Playground : AppWithReduxStore
);
