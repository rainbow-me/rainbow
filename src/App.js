import analytics from '@segment/analytics-react-native';
import { get, last } from 'lodash';
import PropTypes from 'prop-types';
import nanoid from 'nanoid/non-secure';
import React, { Component } from 'react';
import {
  AppRegistry,
  AppState,
  Linking,
} from 'react-native';
import CodePush from 'react-native-code-push';
import { REACT_APP_SEGMENT_API_WRITE_KEY } from 'react-native-dotenv';
import firebase from 'react-native-firebase';
import RNIOS11DeviceCheck from 'react-native-ios11-devicecheck';
import { useScreens } from 'react-native-screens';
import { connect, Provider } from 'react-redux';
import { compose, withProps } from 'recompact';
import { FlexItem } from './components/layout';
import OfflineBadge from './components/OfflineBadge';
import {
  withWalletConnectConnections,
  withWalletConnectOnSessionRequest,
} from './hoc';
import { registerTokenRefreshListener, saveFCMToken } from './model/firebase';
import * as keychain from './model/keychain';
import { Navigation } from './navigation';
import store from './redux/store';
import { requestsForTopic } from './redux/requests';
import Routes from './screens/Routes';
import { parseQueryParams } from './utils';

if (process.env.NODE_ENV === 'development') {
  console.disableYellowBox = true;
}

useScreens();

class App extends Component {
  static propTypes = {
    appInitTimestamp: PropTypes.number,
    requestsForTopic: PropTypes.func,
    sortedWalletConnectors: PropTypes.arrayOf(PropTypes.object),
    walletConnectClearTimestamp: PropTypes.func,
    walletConnectOnSessionRequest: PropTypes.func,
    walletConnectUpdateTimestamp: PropTypes.func,
  }

  state = { appState: AppState.currentState }

  handleOpenLinkingURL = ({ url }) => {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        const { uri, redirectUrl } = parseQueryParams(url);

        const redirect = () => Linking.openURL(redirectUrl);
        this.props.walletConnectOnSessionRequest(uri, redirect);
      }
    });
  }

  onPushNotificationOpened = (topic, autoOpened = false, fromLocal = false) => {
    const { appInitTimestamp, requestsForTopic } = this.props;
    const requests = requestsForTopic(topic);

    if (requests && requests.length === 1) {
      const request = requests[0];

      const transactionTimestamp = get(request, 'displayDetails.timestampInMs');
      const isNewTransaction = appInitTimestamp && (transactionTimestamp > appInitTimestamp);

      if (!autoOpened || isNewTransaction) {
        return Navigation.handleAction({
          params: { autoOpened, transactionDetails: request },
          routeName: 'ConfirmRequest',
        });
      }
    }

    if (fromLocal) {
      return Navigation.handleAction({
        params: { autoOpened, transactionDetails: last(requests) },
        routeName: 'ConfirmRequest',
      });
    }

    return Navigation.handleAction({ routeName: 'ProfileScreen' });
  };

  async componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);
    Linking.addEventListener('url', this.handleOpenLinkingURL);
    await this.handleInitializeAnalytics();
    firebase.notifications().getInitialNotification().then(notificationOpen => {
      if (notificationOpen) {
        const topic = get(notificationOpen, 'notification.data.topic');
        this.onPushNotificationOpened(topic, false);
      }
    });

    saveFCMToken();
    this.onTokenRefreshListener = registerTokenRefreshListener();

    // notification while app in foreground
    this.notificationListener = firebase.notifications().onNotification(notification => {
      const route = Navigation.getActiveRouteName();
      if (route === 'ConfirmRequest') {
        const localNotification = new firebase.notifications.Notification()
          .setTitle(notification.title)
          .setBody(notification.body)
          .setData({ ...notification.data, fromLocal: true });
        firebase.notifications().displayNotification(localNotification);
      } else {
        const topic = get(notification, 'data.topic');
        this.onPushNotificationOpened(topic, true);
      }
    });

    // notification opened from background
    this.notificationOpenedListener = firebase.notifications().onNotificationOpened(notificationOpen => {
      const topic = get(notificationOpen, 'notification.data.topic');
      const fromLocal = get(notificationOpen, 'notification.data.fromLocal', false);
      this.onPushNotificationOpened(topic, false, fromLocal);
    });
  }

  handleInitializeAnalytics = async () => {
    const storedIdentifier = await keychain.loadString('analyticsUserIdentifier');

    if (!storedIdentifier) {
      const identifier = await RNIOS11DeviceCheck.getToken()
        .then((deviceId) => deviceId)
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
  }

  handleAppStateChange = async (nextAppState) => {
    if (nextAppState === 'active') {
      this.props.walletConnectUpdateTimestamp();
      await firebase.notifications().removeAllDeliveredNotifications();
    }
    if (nextAppState === 'background') {
      this.props.walletConnectClearTimestamp();
    }
    this.setState({ appState: nextAppState });
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
    Linking.removeEventListener('url', this.handleOpenLinkingURL);
    this.notificationListener();
    this.notificationOpenedListener();
    this.onTokenRefreshListener();
  }

  handleNavigatorRef = (navigatorRef) => Navigation.setTopLevelNavigator(navigatorRef)

  render = () => (
    <Provider store={store}>
      <FlexItem>
        <OfflineBadge />
        <Routes
          ref={this.handleNavigatorRef}
        />
      </FlexItem>
    </Provider>
  )
}

const AppWithRedux = compose(
  withProps({ store }),
  withWalletConnectConnections,
  withWalletConnectOnSessionRequest,
  connect(
    ({ walletconnect: { appInitTimestamp } }) => ({ appInitTimestamp }),
    {
      requestsForTopic,
    },
  ),
)(App);

const AppWithCodePush = CodePush({
  checkFrequency: CodePush.CheckFrequency.ON_APP_RESUME,
  installMode: CodePush.InstallMode.ON_NEXT_RESUME,
})(AppWithRedux);

AppRegistry.registerComponent('Rainbow', () => AppWithCodePush);
