import PushNotificationIOS from '@react-native-community/push-notification-ios';
import messaging from '@react-native-firebase/messaging';
import analytics from '@segment/analytics-react-native';
import { init as initSentry, setRelease } from '@sentry/react-native';
import { get, last } from 'lodash';
import nanoid from 'nanoid/non-secure';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  AppRegistry,
  AppState,
  Linking,
  unstable_enableLogBox,
} from 'react-native';
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
// eslint-disable-next-line import/no-unresolved
import { enableScreens } from 'react-native-screens';
import VersionNumber from 'react-native-version-number';
import { connect, Provider } from 'react-redux';
import { compose, withProps } from 'recompact';
import { FlexItem } from './components/layout';
import { OfflineToast, TestnetToast } from './components/toasts';
import {
  reactNativeDisableYellowBox,
  reactNativeEnableLogbox,
  showNetworkRequests,
  showNetworkResponses,
} from './config/debug';

import monitorNetwork from './debugging/network';
import {
  withAccountSettings,
  withDeepLink,
  withWalletConnectOnSessionRequest,
} from './hoc';
import { registerTokenRefreshListener, saveFCMToken } from './model/firebase';
import * as keychain from './model/keychain';
import { Navigation } from './navigation';
import { requestsForTopic } from './redux/requests';
import store from './redux/store';
import Routes from './screens/Routes';
import { parseQueryParams } from './utils';

const WALLETCONNECT_SYNC_DELAY = 500;

if (__DEV__) {
  console.disableYellowBox = reactNativeDisableYellowBox;
  reactNativeEnableLogbox && unstable_enableLogBox();
  (showNetworkRequests || showNetworkResponses) &&
    monitorNetwork(showNetworkRequests, showNetworkResponses);
} else {
  initSentry({ dsn: SENTRY_ENDPOINT, environment: SENTRY_ENVIRONMENT });
}

CodePush.getUpdateMetadata().then(update => {
  if (update) {
    setRelease(`me.rainbow-${update.appVersion}-codepush:${update.label}`);
  } else {
    setRelease(`me.rainbow-${VersionNumber.appVersion}`);
  }
});

enableScreens();

class App extends Component {
  static propTypes = {
    addDeepLinkRequest: PropTypes.func,
    requestsForTopic: PropTypes.func,
    walletConnectOnSessionRequest: PropTypes.func,
  };

  state = { appState: AppState.currentState };

  async componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);
    Linking.addEventListener('url', this.handleOpenLinkingURL);
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
          this.onPushNotificationOpened(topic, true);
        }, WALLETCONNECT_SYNC_DELAY);
      }
    );
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
    Linking.removeEventListener('url', this.handleOpenLinkingURL);
    this.onTokenRefreshListener();
    this.foregroundNotificationListener();
    this.backgroundNotificationListener();
  }

  onRemoteNotification = notification => {
    const { appState } = this.state;
    const topic = get(notification, 'data.topic');
    setTimeout(() => {
      const shouldOpenAutomatically =
        appState === 'active' || appState === 'inactive';
      this.onPushNotificationOpened(topic, shouldOpenAutomatically);
    }, WALLETCONNECT_SYNC_DELAY);
  };

  handleOpenLinkingURL = ({ url }) => {
    const { addDeepLinkRequest, walletConnectOnSessionRequest } = this.props;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        const { type, ...remainingParams } = parseQueryParams(url);
        if (type && type === 'walletconnect') {
          const { uri, redirectUrl } = remainingParams;
          const redirect = () => Linking.openURL(redirectUrl);
          walletConnectOnSessionRequest(uri, redirect);
        } else {
          addDeepLinkRequest(remainingParams);
        }
      }
    });
  };

  onPushNotificationOpened = (topic, openAutomatically = false) => {
    const { requestsForTopic } = this.props;
    const requests = requestsForTopic(topic);

    if (openAutomatically && requests) {
      return Navigation.handleAction({
        params: { openAutomatically, transactionDetails: last(requests) },
        routeName: 'ConfirmRequest',
      });
    }

    if (requests && requests.length === 1) {
      const request = requests[0];
      return Navigation.handleAction({
        params: { openAutomatically, transactionDetails: request },
        routeName: 'ConfirmRequest',
      });
    }

    return Navigation.handleAction({ routeName: 'ProfileScreen' });
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

    this.setState({ appState: nextAppState });

    analytics.track('State change', {
      category: 'app state',
      label: nextAppState,
    });
  };

  handleNavigatorRef = navigatorRef =>
    Navigation.setTopLevelNavigator(navigatorRef);

  render = () => (
    <SafeAreaProvider>
      <Provider store={store}>
        <FlexItem>
          <Routes ref={this.handleNavigatorRef} />
          <OfflineToast />
          <TestnetToast network={this.props.network} />
        </FlexItem>
      </Provider>
    </SafeAreaProvider>
  );
}

const AppWithRedux = compose(
  withProps({ store }),
  withDeepLink,
  withAccountSettings,
  withWalletConnectOnSessionRequest,
  connect(null, {
    requestsForTopic,
  })
)(App);

const AppWithCodePush = CodePush({
  checkFrequency: CodePush.CheckFrequency.ON_APP_RESUME,
  installMode: CodePush.InstallMode.ON_NEXT_RESUME,
})(AppWithRedux);

AppRegistry.registerComponent('Rainbow', () => AppWithCodePush);
