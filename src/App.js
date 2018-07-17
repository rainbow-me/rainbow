import { account, commonStorage, accountUpdateAccountAddress } from 'balance-common';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { AppRegistry, AppState, AsyncStorage, Platform } from 'react-native';
import FCM, { FCMEvent, NotificationType, RemoteNotificationResult, WillPresentNotificationResult } from 'react-native-fcm';
import { createStackNavigator } from 'react-navigation';
import { connect, Provider } from 'react-redux';
import { compose, withProps } from 'recompose';
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
        console.log('wallet address', wallet.address);
        this.props.accountUpdateAccountAddress(wallet.address, 'BALANCEWALLET');
      })
      .catch(error => {
        // TODO error handling
      });
    console.log('wallet init');
  }

  onPushNotification = async (transactionId) => {
    const transaction = await walletConnectGetTransaction(transactionId);
    this.props.addTransactionToApprove(transaction);
    // this.props.navigation.navigate('ConfirmTransaction');
  }

  render = () => (
    <Provider store={store}>
      <Routes />
    </Provider>
  )
}

const AppWithRedux = compose(
  withProps({ store }),
  connect(
    null,
    {
      addTransactionToApprove,
      accountUpdateAccountAddress,
    },
  ),
)(App);


const AppWithRouter = createStackNavigator({ App: { screen: AppWithRedux } }, { headerMode: 'none' });

AppRegistry.registerComponent('BalanceWallet', () => AppWithRouter);
