import { Component } from 'react';
import { AppState, AsyncStorage, Platform } from 'react-native';
import FCM, { FCMEvent, NotificationType, RemoteNotificationResult, WillPresentNotificationResult } from 'react-native-fcm';
import { Navigation } from 'react-native-navigation';
import { registerScreens, registerScreenVisibilityListener } from './screens';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import { connect, Provider } from 'react-redux';
import { account, commonStorage, accountUpdateAccountAddress } from 'balance-common';
import thunk from 'redux-thunk';
import transactionsToApprove, { addTransactionToApprove } from './reducers/transactionsToApprove';
import { walletConnectGetTransaction } from './model/walletconnect';
import { walletInit } from './model/wallet';

const store = createStore(
  combineReducers({ account, transactionsToApprove }),
  applyMiddleware(thunk)
);

registerScreens(store, Provider);
registerScreenVisibilityListener();

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
    const { sessionId, transactionId } = notif;

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
  constructor(props) {
    super(props);
    this.startApp();
  }

  componentDidMount() {
    registerAppListener(this.onPushNotification);

    FCM.getFCMToken().then(fcmToken => {
      commonStorage.saveLocal(key='fcmToken', { data: fcmToken });
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
    walletConnectGetTransaction(transactionId).then(transaction => {
      this.props.addTransactionToApprove(transaction);
      Navigation.showModal({
        screen: 'BalanceWallet.TransactionConfirmationScreen',
        navigatorStyle: { navBarHidden: true },
        navigatorButtons: {},
        animationType: 'slide-up',
      });
    })
    .catch(error => {
      // TODO error handling
    });
  }

  startApp() {
    Navigation.startTabBasedApp({
      tabs: [
        {
          label: 'Wallet',
          screen: 'BalanceWallet.WalletScreen',
          icon: require('./assets/wallet-icon.png'), // eslint-disable-line

          title: 'Wallet',
        },
        {
          label: 'Scan',
          screen: 'BalanceWallet.QRScannerScreen',
          icon: require('./assets/scan-icon.png'), // eslint-disable-line

          title: 'WalletConnect',
        },
        {
          label: 'Settings',
          screen: 'BalanceWallet.SettingsScreen',
          icon: require('./assets/settings-icon.png'), // eslint-disable-line

          title: 'Settings',
        },
      ],
      tabsStyle: {
        tabBarButtonColor: '#abb1b8',
        tabBarSelectedButtonColor: '#0b0b0c',
        tabBarBackgroundColor: '#fff',
        initialTabIndex: 0,
      },
      appStyle: {
        orientation: 'portrait',
        bottomTabBadgeTextColor: 'red',
        bottomTabBadgeBackgroundColor: 'green',

        hideBackButtonTitle: false,
      },

      passProps: {},
      animationType: 'slide-down',
    });
  }
}

const reduxProps = ({ account }) => ({
  fetching: account.fetching,
});

export default connect(
  reduxProps,
  {
    addTransactionToApprove,
    accountUpdateAccountAddress,
  }
)(App);
