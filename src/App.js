
import {
  accountLoadState,
  settingsInitializeState,
  settingsUpdateAccountAddress,
} from '@rainbow-me/rainbow-common';
import analytics from '@segment/analytics-react-native';
import { get, last } from 'lodash';
import PropTypes from 'prop-types';
import nanoid from 'nanoid/non-secure';
import React, { Component } from 'react';
import {
  Alert,
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
  withAccountRefresh,
  withRequestsInit,
  withWalletConnectConnections,
  withWalletConnectOnSessionRequest,
} from './hoc';
import { registerTokenRefreshListener, saveFCMToken } from './model/firebase';
import * as keychain from './model/keychain';
import { walletInit } from './model/wallet';
import Navigation from './navigation';
import store from './redux/store';
import Routes from './screens/Routes';
import { parseQueryParams } from './utils';

if (process.env.NODE_ENV === 'development') {
  console.disableYellowBox = true;
}

useScreens();

class App extends Component {
  static propTypes = {
    accountLoadState: PropTypes.func,
    appInitTimestamp: PropTypes.number,
    getValidWalletConnectors: PropTypes.func,
    refreshAccount: PropTypes.func,
    settingsInitializeState: PropTypes.func,
    settingsUpdateAccountAddress: PropTypes.func,
    sortedWalletConnectors: PropTypes.arrayOf(PropTypes.object),
    transactionsForTopic: PropTypes.func,
    transactionsToApproveInit: PropTypes.func,
    walletConnectClearTimestamp: PropTypes.func,
    walletConnectInitAllConnectors: PropTypes.func,
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
    const { appInitTimestamp, transactionsForTopic } = this.props;
    const requests = transactionsForTopic(topic);

    if (requests && requests.length === 1) {
      const request = requests[0];

      const transactionTimestamp = get(request, 'transactionDisplayDetails.timestampInMs');
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
    await this.handleInitializeAnalytics();

    AppState.addEventListener('change', this.handleAppStateChange);
    Linking.addEventListener('url', this.handleOpenLinkingURL);
    await this.handleWalletConfig();
    await this.props.refreshAccount();
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
    let userId = null;

    await RNIOS11DeviceCheck.getToken()
      .then((deviceId) => {
        userId = deviceId;
      })
      .catch(async (error) => {
        const storedUserId = await keychain.loadString('analyticsUserIdentifier');

        if (storedUserId) {
          userId = storedUserId;
        } else {
          userId = nanoid();
          await keychain.saveString('analyticsUserIdentifier', userId);
        }
      });

    await analytics.setup(REACT_APP_SEGMENT_API_WRITE_KEY, {
      ios: {
        trackDeepLinks: true,
      },
      // Record certain application events automatically!
      trackAppLifecycleEvents: true,
      trackAttributionData: true,
    });

    if (userId) {
      analytics.identify(userId);
    }
  }

  handleWalletConfig = async (seedPhrase) => {
    try {
      const { isWalletBrandNew, walletAddress } = await walletInit(seedPhrase);
      this.props.settingsUpdateAccountAddress(walletAddress, 'RAINBOWWALLET');
      if (isWalletBrandNew) {
        return walletAddress;
      }
      this.props.settingsInitializeState();
      this.props.accountLoadState();
      this.props.walletConnectInitAllConnectors();
      this.props.transactionsToApproveInit();
      return walletAddress;
    } catch (error) {
      Alert.alert('Import failed due to an invalid seed phrase. Please try again.');
      return null;
    }
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
          screenProps={{ handleWalletConfig: this.handleWalletConfig }}
        />
      </FlexItem>
    </Provider>
  )
}

const AppWithRedux = compose(
  withProps({ store }),
  withAccountRefresh,
  withRequestsInit,
  withWalletConnectConnections,
  withWalletConnectOnSessionRequest,
  connect(
    ({ walletconnect: { appInitTimestamp } }) => ({ appInitTimestamp }),
    {
      accountLoadState,
      settingsInitializeState,
      settingsUpdateAccountAddress,
    },
  ),
)(App);

const AppWithCodePush = CodePush({
  checkFrequency: CodePush.CheckFrequency.ON_APP_RESUME,
  installMode: CodePush.InstallMode.ON_NEXT_RESUME,
})(AppWithRedux);

AppRegistry.registerComponent('Rainbow', () => AppWithCodePush);
