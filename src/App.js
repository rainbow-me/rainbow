import './languages';
import messaging from '@react-native-firebase/messaging';
import analytics from '@segment/analytics-react-native';
import * as Sentry from '@sentry/react-native';
import { get } from 'lodash';
import { nanoid } from 'nanoid/non-secure';
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
import branch from 'react-native-branch';
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
import { connect, Provider } from 'react-redux';
import { RecoilRoot } from 'recoil';
import PortalConsumer from './components/PortalConsumer';
import ErrorBoundary from './components/error-boundary/ErrorBoundary';
import { FlexItem } from './components/layout';
import { OfflineToast } from './components/toasts';
import {
  designSystemPlaygroundEnabled,
  reactNativeDisableYellowBox,
  showNetworkRequests,
  showNetworkResponses,
} from './config/debug';
import { MainThemeProvider } from './context/ThemeContext';
import { InitialRouteContext } from './context/initialRoute';
import monitorNetwork from './debugging/network';
import { Playground } from './design-system/playground/Playground';
import appEvents from './handlers/appEvents';
import handleDeeplink from './handlers/deeplinks';
import { runWalletBackupStatusChecks } from './handlers/walletReadyEvents';
import { isL2Network } from './handlers/web3';
import RainbowContextWrapper from './helpers/RainbowContext';
import networkTypes from './helpers/networkTypes';
import { registerTokenRefreshListener, saveFCMToken } from './model/firebase';
import * as keychain from './model/keychain';
import { loadAddress } from './model/wallet';
import { Navigation } from './navigation';
import RoutesComponent from './navigation/Routes';
import { explorerInitL2 } from './redux/explorer';
import { fetchOnchainBalances } from './redux/fallbackExplorer';
import { requestsForTopic } from './redux/requests';
import store from './redux/store';
import { uniswapPairsInit } from './redux/uniswap';
import { walletConnectLoadState } from './redux/walletconnect';
import { rainbowTokenList } from './references';
import { analyticsUserIdentifier } from './utils/keychainConstants';
import { SharedValuesProvider } from '@rainbow-me/helpers/SharedValuesContext';
import Routes from '@rainbow-me/routes';
import logger from 'logger';
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

    this.branchListener = branch.subscribe(({ error, params, uri }) => {
      if (error) {
        logger.error('Error from Branch: ' + error);
      }

      if (params['+non_branch_link']) {
        const nonBranchUrl = params['+non_branch_link'];
        this.handleOpenLinkingURL(nonBranchUrl);
        return;
      } else if (!params['+clicked_branch_link']) {
        // Indicates initialization success and some other conditions.
        // No link was opened.
        if (IS_TESTING === 'true') {
          this.handleOpenLinkingURL(uri);
        } else {
          return;
        }
      } else if (uri) {
        this.handleOpenLinkingURL(uri);
      }
    });

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

  handleNavigatorRef = navigatorRef =>
    Navigation.setTopLevelNavigator(navigatorRef);

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

  render = () => (
    <MainThemeProvider>
      <RainbowContextWrapper>
        <ErrorBoundary>
          <Portal>
            <SafeAreaProvider>
              <Provider store={store}>
                <RecoilRoot>
                  <SharedValuesProvider>
                    <FlexItem>
                      {this.state.initialRoute && (
                        <InitialRouteContext.Provider
                          value={this.state.initialRoute}
                        >
                          <RoutesComponent ref={this.handleNavigatorRef} />
                          <PortalConsumer />
                        </InitialRouteContext.Provider>
                      )}
                      <OfflineToast />
                    </FlexItem>
                  </SharedValuesProvider>
                </RecoilRoot>
              </Provider>
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

AppRegistry.registerComponent('Rainbow', () =>
  designSystemPlaygroundEnabled ? Playground : AppWithReduxStore
);
