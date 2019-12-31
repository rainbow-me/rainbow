// eslint-disable-next-line import/default
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import analytics from '@segment/analytics-react-native';
import { init as initSentry, setRelease } from '@sentry/react-native';
import { get, last } from 'lodash';
import PropTypes from 'prop-types';
import nanoid from 'nanoid/non-secure';
import React, { Component } from 'react';
import { AppRegistry, AppState, Linking } from 'react-native';
// eslint-disable-next-line import/default
import CodePush from 'react-native-code-push';
import {
  REACT_APP_SEGMENT_API_WRITE_KEY,
  SENTRY_ENDPOINT,
  SENTRY_ENVIRONMENT,
} from 'react-native-dotenv';
// eslint-disable-next-line import/default
import RNIOS11DeviceCheck from 'react-native-ios11-devicecheck';
// eslint-disable-next-line import/no-unresolved
import { useScreens } from 'react-native-screens';
import { connect, Provider } from 'react-redux';
import { compose, withProps } from 'recompact';
import { FlexItem } from './components/layout';
import OfflineBadge from './components/OfflineBadge';
import { withDeepLink, withWalletConnectOnSessionRequest } from './hoc';
import { registerTokenRefreshListener, saveFCMToken } from './model/firebase';
import * as keychain from './model/keychain';
import { Navigation } from './navigation';
import store from './redux/store';
import { requestsForTopic } from './redux/requests';
import Routes from './screens/Routes';
import { parseQueryParams } from './utils';

if (process.env.NODE_ENV === 'development') {
  console.disableYellowBox = true;
} else {
  initSentry({ dsn: SENTRY_ENDPOINT, environment: SENTRY_ENVIRONMENT });
}

CodePush.getUpdateMetadata().then(update => {
  if (update) {
    setRelease(update.appVersion + '-codepush:' + update.label);
  }
});

useScreens(false);

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
    PushNotificationIOS.addEventListener(
      'notification',
      this.onRemoteNotification
    );
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
    Linking.removeEventListener('url', this.handleOpenLinkingURL);
    PushNotificationIOS.removeEventListener(
      'notification',
      this.onRemoteNotification
    );
    this.onTokenRefreshListener();
  }

  onRemoteNotification = notification => {
    const { appState } = this.state;
    const topic = get(notification, '_data.topic');
    notification.finish(PushNotificationIOS.FetchResult.NoData);
    const shouldOpenAutomatically =
      appState === 'active' || appState === 'inactive';
    this.onPushNotificationOpened(topic, shouldOpenAutomatically);
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
  };

  handleNavigatorRef = navigatorRef =>
    Navigation.setTopLevelNavigator(navigatorRef);

  render = () => (
    <Provider store={store}>
      <FlexItem>
        <OfflineBadge />
        <Routes ref={this.handleNavigatorRef} />
      </FlexItem>
    </Provider>
  );
}

const AppWithRedux = compose(
  withProps({ store }),
  withDeepLink,
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
