import { account, commonStorage, accountUpdateAccountAddress } from 'balance-common';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { AppRegistry, AppState, AsyncStorage, Platform } from 'react-native';
import FCM, { FCMEvent, NotificationType, RemoteNotificationResult, WillPresentNotificationResult } from 'react-native-fcm';
import { connect, Provider } from 'react-redux';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { walletConnectGetTransaction } from './model/walletconnect';
import { walletInit } from './model/wallet';
import transactionsToApprove, { addTransactionToApprove } from './reducers/transactionsToApprove';
import Routes from './screens/Routes';

const store = createStore(
  combineReducers({ account, transactionsToApprove }),
  applyMiddleware(thunk),
);

function registerKilledListener() {
  FCM.on(FCMEvent.Notification, notif => {
    console.log(`registerKilledListener notif: ${notif}`);
    AsyncStorage.setItem('lastNotification', JSON.stringify(notif));
    if (notif.opened_from_tray) {
      setTimeout(() => {
        if (notif._actionIdentifier === 'reply') {
          if (AppState.currentState !== 'background') {
            console.log(`User replied ${JSON.stringify(notif._userText)}`);
          } else {
            AsyncStorage.setItem('lastMessage', JSON.stringify(notif._userText));
          }
        }
        if (notif._actionIdentifier === 'view') {
          console.log('User clicked View in App');
        }
        if (notif._actionIdentifier === 'dismiss') {
          console.log('User clicked Dismiss');
        }
      }, 1000);
    }
  });
}

function registerAppListener(notificationHandler) {
  FCM.on(FCMEvent.Notification, notif => {
    console.log(`registerAppListener notif: ${notif}`);
    const { transactionId } = notif;

    if (Platform.OS === 'ios') {
      switch (notif._notificationType) {
      case NotificationType.Remote:
        notif.finish(RemoteNotificationResult.NewData);
        break;
      case NotificationType.NotificationResponse:
        notificationHandler(transactionId);
        notif.finish();
        break;
      case NotificationType.WillPresent:
        notif.finish(WillPresentNotificationResult.All);

        break;
      default:
        break;
      }
    }
  });
}

registerKilledListener();

class App extends Component {
  static propTypes = {
    accountUpdateAccountAddress: PropTypes.func,
    addTransactionToApprove: PropTypes.func,
  }

  componentDidMount() {
    registerAppListener(this.onPushNotification);

    FCM.getFCMToken().then(fcmToken => {
      commonStorage.saveLocal('fcmToken', { data: fcmToken });
      console.log(`FCM Token: ${fcmToken}`);
    });

    walletInit()
      .then(wallet => {
        this.props.accountUpdateAccountAddress(wallet.address, 'BALANCEWALLET');
      })
      .catch(error => {
        // TODO error handling
      });
    console.log('wallet init');
  }

  onPushNotification(transactionId) {
    console.log('on push notification...');
    walletConnectGetTransaction(transactionId)
      .then(transaction => {
        this.props.addTransactionToApprove(transaction);
        // Navigation.showModal({
        //   screen: 'BalanceWallet.TransactionConfirmationScreen',
        //   navigatorStyle: { navBarHidden: true },
        //   navigatorButtons: {},
        //   animationType: 'slide-up',
        // });
      })
      .catch(error => {
        // TODO error handling
      });
  }

  render = () => (
    <Provider store={store}>
      <Routes />
    </Provider>
  )
}

const AppWithRedux = connect(
  null,
  {
    addTransactionToApprove,
    accountUpdateAccountAddress,
  },
)(App);

AppRegistry.registerComponent('BalanceWallet', () => AppWithRedux);
