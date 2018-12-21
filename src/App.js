import { get, isEmpty } from 'lodash';
import CodePush from 'react-native-code-push';
import firebase from 'react-native-firebase';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { accountInitializeState, accountUpdateAccountAddress, commonStorage } from 'balance-common';
import { AppRegistry, AlertIOS, AppState, View } from 'react-native';
import { compose, withProps } from 'recompact';
import { connect, Provider } from 'react-redux';
import { StackActions } from 'react-navigation';
import Piwik from 'react-native-matomo';
import styled from 'styled-components';
import OfflineBadge from './components/OfflineBadge';
import { withWalletConnectConnections } from './hoc';
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

const Container = styled(View)`
  flex: 1;
`;

class App extends Component {
  static propTypes = {
    accountInitializeState: PropTypes.func,
    accountUpdateAccountAddress: PropTypes.func,
    addTransactionsToApprove: PropTypes.func,
    addTransactionToApprove: PropTypes.func,
    getValidWalletConnectors: PropTypes.func,
    setWalletConnectors: PropTypes.func,
    transactionIfExists: PropTypes.func,
    transactionsToApproveInit: PropTypes.func,
    sortedWalletConnectors: PropTypes.arrayOf(PropTypes.object),
  }

  state = { appState: AppState.currentState }

  navigatorRef = null

  componentDidMount() {
    Piwik.initTracker('https://matomo.balance.io/piwik.php', 2);
    AppState.addEventListener('change', this.handleAppStateChange);
    firebase.messaging().getToken()
      .then(fcmToken => {
        if (fcmToken) {
          console.log('received fcmToken', fcmToken);
          commonStorage.saveLocal('balanceWalletFcmToken', { data: fcmToken });
        } else {
          console.log('no fcm token yet');
        }
      })
      .catch(error => {
        console.log('error getting fcm token');
      });

    this.onTokenRefreshListener = firebase.messaging().onTokenRefresh(fcmToken => {
      console.log('received refreshed fcm token', fcmToken);
      commonStorage.saveLocal('balanceWalletFcmToken', { data: fcmToken });
    });

    this.notificationListener = firebase.notifications().onNotification(notification => {
      console.log('on notification received while app in foreground');
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
      console.log('on notification manually opened');
      const { callId, sessionId } = notificationOpen.notification.data;
      this.onPushNotificationOpened(callId, sessionId, false);
    });

    this.props.accountInitializeState();
    this.handleWalletConfig();
  }

  handleWalletConfig = async seedPhrase => {
    try {
      const walletAddress = await walletInit(seedPhrase);
      console.log('wallet address is', walletAddress);
      this.props.accountUpdateAccountAddress(walletAddress, 'BALANCEWALLET');
      this.props.transactionsToApproveInit();
      try {
				const allConnectors = await walletConnectInitAllConnectors();
				if (allConnectors) {
					this.props.setWalletConnectors(allConnectors);
				}
			} catch (error) {
				console.log('Unable to init all WalletConnect sessions');
			}
      const notificationOpen = await firebase
        .notifications()
        .getInitialNotification();
      if (!notificationOpen) {
				this.fetchAllRequestsFromWalletConnectSessions();
      }
      return walletAddress;
    } catch (error) {
			AlertIOS.alert('Error: Failed to initialize wallet.');
      console.log('WALLET ERROR', error);
    }
  };

  handleAppStateChange = async (nextAppState) => {
    if (this.state.appState.match(/unknown|background/) && nextAppState === 'active') {
      Piwik.trackEvent('screen', 'view', 'app');
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
      routeName: 'ConfirmRequest',
      params: { transactionDetails, autoOpened },
    });
    Navigation.handleAction(this.navigatorRef, action);
  }

  fetchAllRequestsFromWalletConnectSessions = async () => {
    const allConnectors = this.props.getValidWalletConnectors();
    if (!isEmpty(allConnectors)) {
      const allRequests = await walletConnectGetAllRequests(allConnectors);
      if (!isEmpty(allRequests)) {
        this.props.addTransactionsToApprove(allRequests);
        await firebase.notifications().removeAllDeliveredNotifications();
      }
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
        AlertIOS.alert('This request has expired.');
      }
    }
  }

  fetchAndAddWalletConnectRequest = async (callId, sessionId) => {
    const walletConnector = this.props.sortedWalletConnectors.find(({ _sessionId }) => (_sessionId === sessionId));
    const callData = await walletConnectGetRequest(callId, walletConnector);
    if (!callData) return null;

    const { dappName } = walletConnector;
    return this.props.addTransactionToApprove(sessionId, callId, callData, dappName);
  }

  render = () => (
    <Provider store={store}>
      <Container>
        <OfflineBadge />
        <Routes
          ref={this.handleNavigatorRef}
          screenProps={{ handleWalletConfig: this.handleWalletConfig }}
        />
      </Container>
    </Provider>
  )
}

const AppWithRedux = compose(
  withProps({ store }),
  withWalletConnectConnections,
  connect(
    null,
    {
      addTransactionToApprove,
      addTransactionsToApprove,
      accountInitializeState,
      accountUpdateAccountAddress,
      transactionIfExists,
      transactionsToApproveInit,
    },
  ),
)(App);

const AppWithCodePush = CodePush({
  checkFrequency: CodePush.CheckFrequency.ON_APP_RESUME,
  installMode: CodePush.InstallMode.ON_NEXT_RESUME,
})(AppWithRedux);

AppRegistry.registerComponent('BalanceWallet', () => AppWithCodePush);
