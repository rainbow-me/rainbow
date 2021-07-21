import messaging from '@react-native-firebase/messaging';
import analytics from '@segment/analytics-react-native';
import * as Sentry from '@sentry/react-native';
import { get } from 'lodash';
import nanoid from 'nanoid/non-secure';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  AppRegistry,
  AppState,
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
import PortalConsumer from './components/PortalConsumer';
import ErrorBoundary from './components/error-boundary/ErrorBoundary';
import { FlexItem } from './components/layout';
import { OfflineToast } from './components/toasts';
import {
  reactNativeDisableYellowBox,
  showNetworkRequests,
  showNetworkResponses,
} from './config/debug';
import { MainThemeProvider } from './context/ThemeContext';
import { InitialRouteContext } from './context/initialRoute';
import monitorNetwork from './debugging/network';
import appEvents from './handlers/appEvents';
import handleDeeplink from './handlers/deeplinks';
import { runWalletBackupStatusChecks } from './handlers/walletReadyEvents';
import RainbowContextWrapper from './helpers/RainbowContext';
import { registerTokenRefreshListener, saveFCMToken } from './model/firebase';
import * as keychain from './model/keychain';
import { loadAddress } from './model/wallet';
import { Navigation } from './navigation';
import RoutesComponent from './navigation/Routes';
import { explorerInit } from './redux/explorer';
import { requestsForTopic } from './redux/requests';
import store from './redux/store';
import { walletConnectLoadState } from './redux/walletconnect';
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
    AppState.addEventListener('change', this.handleAppStateChange);
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

  componentDidUpdate(prevProps) {
    if (!prevProps.walletReady && this.props.walletReady) {
      // Everything we need to do after the wallet is ready goes here
      logger.sentry('✅ Wallet ready!');
      runWalletBackupStatusChecks();
    }
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
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

  onRemoteNotification = notification => {
    const topic = get(notification, 'data.topic');
    setTimeout(() => {
      this.onPushNotificationOpened(topic);
    }, WALLETCONNECT_SYNC_DELAY);
  };

  handleOpenLinkingURL = url => {
    handleDeeplink(url);
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
    const storedIdentifier = await keychain.loadString(
      'analyticsUserIdentifier'
    );

    if (!storedIdentifier) {
      const identifier = await RNIOS11DeviceCheck.getToken()
        .then(deviceId => deviceId)
        .catch(() => nanoid());
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

  handleAppStateChange = async nextAppState => {
    // Restore WC connectors when going from BG => FG
    if (this.state.appState === 'background' && nextAppState === 'active') {
      store.dispatch(walletConnectLoadState());
    }
    this.setState({ appState: nextAppState });

    analytics.track('State change', {
      category: 'app state',
      label: nextAppState,
    });
  };

  handleNavigatorRef = navigatorRef =>
    Navigation.setTopLevelNavigator(navigatorRef);

  handleTransactionConfirmed = () => {
    logger.log('Reloading all data from zerion in 10!');
    setTimeout(() => {
      logger.log('Reloading all data from zerion NOW!');
      store.dispatch(explorerInit());
    }, 10000);
  };

  render = () => (
    <MainThemeProvider>
      <RainbowContextWrapper>
        <ErrorBoundary>
          <Portal>
            <SafeAreaProvider>
              <Provider store={store}>
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

AppRegistry.registerComponent('Rainbow', () => AppWithReduxStore);
