import { get, isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import {
  accountLoadState,
  commonStorage,
  settingsInitializeState,
  settingsUpdateAccountAddress,
} from '@rainbow-me/rainbow-common';
import React, { Component } from 'react';
import { AlertIOS, AppRegistry, AppState } from 'react-native';
import { StackActions } from 'react-navigation';
import CodePush from 'react-native-code-push';
import firebase from 'react-native-firebase';
import { useScreens } from 'react-native-screens';
import { connect, Provider } from 'react-redux';
import { compose, withProps } from 'recompact';
import { FlexItem } from './components/layout';
import OfflineBadge from './components/OfflineBadge';
import {
  withAccountRefresh,
  withHideSplashScreen,
  withWalletConnectConnections,
} from './hoc';
import {
  addTransactionToApprove,
  addTransactionsToApprove,
  transactionIfExists,
  transactionsToApproveInit,
} from './redux/transactionsToApprove';
import {
  walletConnectInitAllConnectors,
  walletConnectGetAllRequests,
  walletConnectGetRequest,
} from './model/walletconnect';
import store from './redux/store';
import { walletInit } from './model/wallet';
import Routes from './screens/Routes';
import Navigation from './navigation';

if (process.env.NODE_ENV === 'development') {
  console.log('process', process);
  console.disableYellowBox = true;
}

useScreens();

class App extends Component {
  static propTypes = {
    accountLoadState: PropTypes.func,
    addTransactionsToApprove: PropTypes.func,
    addTransactionToApprove: PropTypes.func,
    getValidWalletConnectors: PropTypes.func,
    onHideSplashScreen: PropTypes.func,
    refreshAccount: PropTypes.func,
    settingsInitializeState: PropTypes.func,
    settingsUpdateAccountAddress: PropTypes.func,
    setWalletConnectors: PropTypes.func,
    sortedWalletConnectors: PropTypes.arrayOf(PropTypes.object),
    transactionIfExists: PropTypes.func,
    transactionsToApproveInit: PropTypes.func,
  }

  state = { appState: AppState.currentState }

  navigatorRef = null

  async componentDidMount() {
    await this.handleWalletConfig();
    this.props.onHideSplashScreen();
    await this.props.refreshAccount();
    AppState.addEventListener('change', this.handleAppStateChange);
    firebase.messaging().getToken()
      .then(fcmToken => {
        if (fcmToken) {
          commonStorage.saveLocal('rainbowFcmToken', { data: fcmToken });
        }
      })
      .catch(error => {
        console.log('error getting fcm token', error);
      });

    this.onTokenRefreshListener = firebase.messaging().onTokenRefresh(fcmToken => {
      commonStorage.saveLocal('rainbowFcmToken', { data: fcmToken });
    });

    this.notificationListener = firebase.notifications().onNotification(notification => {
      const navState = get(this.navigatorRef, 'state.nav');
      const route = Navigation.getActiveRouteName(navState);
      const { callId, sessionId } = notification.data;
      if (route === 'ConfirmRequest') {
        this.fetchAndAddWalletConnectRequest(callId, sessionId)
          .then(transaction => {
            const localNotification = new firebase.notifications.Notification()
              .setTitle(notification.title)
              .setBody(notification.body)
              .setData(notification.data);

            firebase.notifications().displayNotification(localNotification);
          });
      } else {
        this.onPushNotificationOpened(callId, sessionId, true);
      }
    });

    this.notificationOpenedListener = firebase.notifications().onNotificationOpened(notificationOpen => {
      const { callId, sessionId } = notificationOpen.notification.data;
      this.onPushNotificationOpened(callId, sessionId, false);
    });
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
      this.props.transactionsToApproveInit();
      try {
        const allConnectors = await walletConnectInitAllConnectors();
        if (allConnectors) {
          this.props.setWalletConnectors(allConnectors);
        }
      } catch (error) {
        console.log('Unable to init all WalletConnect sessions');
      }
      const notificationOpen = await firebase.notifications().getInitialNotification();
      if (notificationOpen) {
        const { callId, sessionId } = notificationOpen.notification.data;
        this.onPushNotificationOpened(callId, sessionId, false);
      }
      this.fetchAllRequestsFromWalletConnectSessions();
      return walletAddress;
    } catch (error) {
      AlertIOS.alert('Error: Failed to initialize wallet.');
      return null;
    }
  };

  handleAppStateChange = async (nextAppState) => {
    if (this.state.appState.match(/unknown|background/) && nextAppState === 'active') {
      this.fetchAllRequestsFromWalletConnectSessions();
    }
    this.setState({ appState: nextAppState });
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
    this.notificationListener();
    this.notificationOpenedListener();
    this.onTokenRefreshListener();
  }

  handleNavigatorRef = (navigatorRef) => { this.navigatorRef = navigatorRef; }

  handleOpenConfirmTransactionModal = (transactionDetails, autoOpened) => {
    if (!this.navigatorRef) return;
    const action = StackActions.push({
      params: { autoOpened, transactionDetails },
      routeName: 'ConfirmRequest',
    });
    Navigation.handleAction(this.navigatorRef, action);
  }

  fetchAllRequestsFromWalletConnectSessions = async () => {
    try {
      const allConnectors = this.props.getValidWalletConnectors();
      if (!isEmpty(allConnectors)) {
        const allRequests = await walletConnectGetAllRequests(allConnectors);
        if (!isEmpty(allRequests)) {
          this.props.addTransactionsToApprove(allRequests);
          await firebase.notifications().removeAllDeliveredNotifications();
        }
      }
    } catch (error) {
      console.log('error fetching all requests from wallet connect', error);
    }
  }

  onPushNotificationOpened = async (callId, sessionId, autoOpened) => {
    const existingTransaction = this.props.transactionIfExists(callId);
    if (existingTransaction) {
      this.handleOpenConfirmTransactionModal(existingTransaction, autoOpened);
    } else {
      const transaction = await this.fetchAndAddWalletConnectRequest(callId, sessionId);
      if (transaction) {
        this.handleOpenConfirmTransactionModal(transaction, autoOpened);
      } else {
        const fetchedTransaction = this.props.transactionIfExists(callId);
        if (fetchedTransaction) {
          this.handleOpenConfirmTransactionModal(fetchedTransaction, autoOpened);
        } else {
          AlertIOS.alert('This request has expired.');
        }
      }
    }
  }

  fetchAndAddWalletConnectRequest = async (callId, sessionId) => {
    try {
      const walletConnector = this.props.sortedWalletConnectors.find(({ _sessionId }) => (_sessionId === sessionId));
      const callData = await walletConnectGetRequest(callId, walletConnector);
      if (!callData) return null;

      const { dappName } = walletConnector;
      return this.props.addTransactionToApprove(sessionId, callId, callData, dappName);
    } catch (error) {
      console.log('error fetching wallet connect request');
      return null;
    }
  }

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
  withHideSplashScreen,
  withWalletConnectConnections,
  connect(
    null,
    {
      accountLoadState,
      addTransactionsToApprove,
      addTransactionToApprove,
      settingsInitializeState,
      settingsUpdateAccountAddress,
      transactionIfExists,
      transactionsToApproveInit,
    },
  ),
)(App);

const AppWithCodePush = CodePush({
  checkFrequency: CodePush.CheckFrequency.ON_APP_RESUME,
  installMode: CodePush.InstallMode.ON_NEXT_RESUME,
})(AppWithRedux);

AppRegistry.registerComponent('Rainbow', () => AppWithCodePush);
