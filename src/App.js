import { get, isEmpty } from 'lodash';
import CodePush from 'react-native-code-push';
import firebase from 'react-native-firebase';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { accountInitializeState, accountUpdateAccountAddress, commonStorage } from 'balance-common';
import { AppRegistry, AlertIOS } from 'react-native';
import { compose, withProps } from 'recompact';
import { connect, Provider } from 'react-redux';
import { NavigationActions } from 'react-navigation';
import Routes from './screens/Routes';
import {
  addTransactionToApprove,
  addTransactionsToApprove,
  transactionIfExists,
  transactionsToApproveInit,
} from './redux/transactionsToApprove';
import {
  getValidWalletConnectors,
  setWalletConnectors,
} from './redux/walletconnect';
import {
  walletConnectInitAllConnectors,
  walletConnectGetAllTransactions,
  walletConnectGetTransaction,
} from './model/walletconnect';
import store from './redux/store';
import { walletInit } from './model/wallet';
import Navigation from './navigation';

class App extends Component {
  static propTypes = {
    accountUpdateAccountAddress: PropTypes.func,
    accountInitializeState: PropTypes.func,
    addTransactionToApprove: PropTypes.func,
    addTransactionsToApprove: PropTypes.func,
    getValidWalletConnectors: PropTypes.func,
    setWalletConnectors: PropTypes.func,
    transactionIfExists: PropTypes.func,
    transactionsToApproveInit: PropTypes.func,
  }

  navigatorRef = null

  componentDidMount() {
    commonStorage.resetAccount('0x1492004547FF0eFd778CC2c14E794B26B4701105');
    console.log('!!! reset account');

    firebase.messaging().getToken()
      .then(fcmToken => {
        if (fcmToken) {
          console.log('received fcmToken', fcmToken);
          commonStorage.saveLocal('balanceWalletFcmToken', { data: fcmToken });
        } else {
          console.log('no fcm token yet');
        }
      });

    this.onTokenRefreshListener = firebase.messaging().onTokenRefresh(fcmToken => {
      console.log('received refreshed fcm token', fcmToken);
      commonStorage.saveLocal('balanceWalletFcmToken', { data: fcmToken });
    });

    this.notificationListener = firebase.notifications().onNotification(notification => {
      console.log('on notification received while app in foreground');
      const navState = get(this.navigatorRef, 'state.nav');
      const route = Navigation.getActiveRouteName(navState);
      const { transactionId, sessionId } = notification.data;
      if (route === 'ConfirmTransaction') {
        this.fetchAndAddTransaction(transactionId, sessionId)
          .then(transaction => {
            const localNotification = new firebase.notifications.Notification()
              .setTitle(notification.title)
              .setBody(notification.body)
              .setData(notification.data);

            firebase.notifications().displayNotification(localNotification);
          });
      } else {
        this.onPushNotificationOpened(transactionId, sessionId);
      }
    });

    this.notificationOpenedListener = firebase.notifications().onNotificationOpened(notificationOpen => {
      console.log('on notification manually opened - while app in background or foreground');
      const { transactionId, sessionId } = notificationOpen.notification.data;
      this.onPushNotificationOpened(transactionId, sessionId);
    });

    this.props.accountInitializeState();

    walletInit()
      .then(walletAddress => {
        console.log('wallet address is', walletAddress);
        this.props.accountUpdateAccountAddress(walletAddress, 'BALANCEWALLET');
        this.props.transactionsToApproveInit();
        walletConnectInitAllConnectors()
          .then(allConnectors => {
            this.props.setWalletConnectors(allConnectors);
            this.fetchAllTransactionsFromWalletConnectSessions(allConnectors);
          })
          .catch(error => {
            console.log('Unable to init all WalletConnect sessions');
          });
        firebase
          .notifications()
          .getInitialNotification()
          .then(notificationOpen => {
            console.log('on initial notification');
            if (notificationOpen) {
              console.log('on initial notification opened - while app closed');
              const { transactionId, sessionId } = notificationOpen.notification.data;
              this.onPushNotificationOpened(transactionId, sessionId);
            }
          });
      })
      .catch(error => {
        console.log('failed to init wallet');
        AlertIOS.alert('Error: Failed to initialize wallet.');
      });

  }

  componentWillUnmount() {
    this.notificationDisplayedListener();
    this.notificationListener();
    this.notificationOpenedListender();
    this.onTokenRefreshListener();
  }

  handleNavigatorRef = (navigatorRef) => { this.navigatorRef = navigatorRef; }

  handleOpenConfirmTransactionModal = (transactionDetails) => {
    if (!this.navigatorRef) return;

    const action = NavigationActions.navigate({
      routeName: 'ConfirmTransaction',
      params: { transactionDetails },
    });

    Navigation.handleAction(this.navigatorRef, action);
  }

  fetchAllTransactionsFromWalletConnectSessions = async (allConnectors) => {
    if (!isEmpty(allConnectors)) {
      const allTransactions = await walletConnectGetAllTransactions(allConnectors);
      if (!isEmpty(allTransactions)) {
        this.props.addTransactionsToApprove(allTransactions);
      }
    }
  }

  onPushNotificationOpened = async (transactionId, sessionId) => {
    const existingTransaction = this.props.transactionIfExists(transactionId);
    if (existingTransaction) {
      this.handleOpenConfirmTransactionModal(existingTransaction);
    } else {
      const transaction = await this.fetchAndAddTransaction(transactionId, sessionId);
      if (transaction) {
        this.handleOpenConfirmTransactionModal(transaction);
      } else {
        AlertIOS.alert('The requested transaction could not be found.');
      }
    }
  }

  fetchAndAddTransaction = async (transactionId, sessionId) => {
    const walletConnector = this.props.walletConnectors[sessionId];
    const transactionDetails = await walletConnectGetTransaction(transactionId, walletConnector);
    if (!transactionDetails) return null;

    const { transactionPayload, dappName } = transactionDetails;

    return this.props.addTransactionToApprove(sessionId, transactionId, transactionPayload, dappName);
  }

  render = () => (
    <Provider store={store}>
      <Routes ref={this.handleNavigatorRef} />
    </Provider>
  )
}

const AppWithRedux = compose(
  withProps({ store }),
  connect(
    ({ walletconnect: { walletConnectors } }) => ({ walletConnectors }),
    {
      addTransactionToApprove,
      addTransactionsToApprove,
      accountInitializeState,
      accountUpdateAccountAddress,
      getValidWalletConnectors,
      setWalletConnectors,
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
