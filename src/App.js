import PushNotificationIOS from '@react-native-community/push-notification-ios';
import messaging from '@react-native-firebase/messaging';
import analytics from '@segment/analytics-react-native';
import { init as initSentry, setRelease } from '@sentry/react-native';
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
// eslint-disable-next-line import/default
import CodePush from 'react-native-code-push';

import {
  REACT_APP_SEGMENT_API_WRITE_KEY,
  SENTRY_ENDPOINT,
  SENTRY_ENVIRONMENT,
} from 'react-native-dotenv';
// eslint-disable-next-line import/default
import RNIOS11DeviceCheck from 'react-native-ios11-devicecheck';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import VersionNumber from 'react-native-version-number';
import { connect, Provider } from 'react-redux';
import { compose, withProps } from 'recompact';
import PortalConsumer from './components/PortalConsumer';
import { FlexItem } from './components/layout';
import { OfflineToast } from './components/toasts';
import {
  reactNativeDisableYellowBox,
  showNetworkRequests,
  showNetworkResponses,
} from './config/debug';
import { InitialRouteContext } from './context/initialRoute';
import monitorNetwork from './debugging/network';
import handleDeeplink from './handlers/deeplinks';
import {
  runKeychainIntegrityChecks,
  runWalletBackupStatusChecks,
} from './handlers/walletReadyEvents';
import RainbowContextWrapper from './helpers/RainbowContext';
import { withAccountSettings, withAppState } from './hoc';
import { registerTokenRefreshListener, saveFCMToken } from './model/firebase';
import * as keychain from './model/keychain';
import { loadAddress } from './model/wallet';
import { Navigation } from './navigation';
import RoutesComponent from './navigation/Routes';
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
  initSentry({ dsn: SENTRY_ENDPOINT, environment: SENTRY_ENVIRONMENT });
}

CodePush.getUpdateMetadata(CodePush.UpdateState.RUNNING).then(update => {
  if (update) {
    setRelease(
      `me.rainbow-${VersionNumber.appVersion}-codepush:${update.label}`
    );
  } else {
    setRelease(`me.rainbow-${VersionNumber.appVersion}`);
  }
});

enableScreens();

class App extends Component {
  static propTypes = {
    requestsForTopic: PropTypes.func,
  };

  state = { appState: AppState.currentState, initialRoute: null };

  async componentDidMount() {
    if (!__DEV__ && NativeModules.RNTestFlight) {
      const { isTestFlight } = NativeModules.RNTestFlight.getConstants();
      logger.sentry(`Test flight usage - ${isTestFlight}`);
    }
    this.identifyFlow();
    AppState.addEventListener('change', this.handleAppStateChange);
    await this.handleInitializeAnalytics();
    saveFCMToken();
    this.onTokenRefreshListener = registerTokenRefreshListener();

    this.foregroundNotificationListener = messaging().onMessage(
      this.onRemoteNotification
    );

    this.backgroundNotificationListener = messaging().onNotificationOpenedApp(
      remoteMessage => {
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
        return;
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
      runKeychainIntegrityChecks();
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
    if (nextAppState === 'active') {
      PushNotificationIOS.removeAllDeliveredNotifications();
    }

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

  render = () => (
    <RainbowContextWrapper>
      <Portal>
        <SafeAreaProvider>
          <Provider store={store}>
            <FlexItem>
              {this.state.initialRoute && (
                <InitialRouteContext.Provider value={this.state.initialRoute}>
                  <RoutesComponent ref={this.handleNavigatorRef} />
                  <PortalConsumer />
                </InitialRouteContext.Provider>
              )}
              <OfflineToast />
            </FlexItem>
          </Provider>
        </SafeAreaProvider>
      </Portal>
    </RainbowContextWrapper>
  );
}

const AppWithRedux = compose(
  withProps({ store }),
  withAccountSettings,
  withAppState,
  connect(null, {
    requestsForTopic,
  })
)(App);

const AppWithCodePush = CodePush({
  checkFrequency: CodePush.CheckFrequency.ON_APP_RESUME,
  installMode: CodePush.InstallMode.ON_NEXT_RESUME,
})(AppWithRedux);

AppRegistry.registerComponent('Rainbow', () => AppWithCodePush);
