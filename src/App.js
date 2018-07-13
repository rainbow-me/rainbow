import { AppState, AsyncStorage, Platform } from 'react-native';
import FCM, { FCMEvent, NotificationType, RemoteNotificationResult, WillPresentNotificationResult } from 'react-native-fcm';
import { Navigation } from 'react-native-navigation';
import * as EthWallet from './model/ethWallet';
import { addNewTransaction } from './model/transactions';
import initializeScreens from './register-screens';

initializeScreens();

EthWallet.init();

FCM.getFCMToken().then(fcmToken => {
  console.log(`FCM Token: ${fcmToken}`);
});

// export default class App extends Component {
//   componentDidMount() {
//     SplashScreen.hide();
//   }
// }

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

function registerAppListener() {
  FCM.on(FCMEvent.Notification, notif => {
    console.log(`registerAppListener notif: ${notif}`);
    const { sessionId, transactionId } = notif;

    if (Platform.OS === 'ios') {
      switch (notif._notificationType) {
      case NotificationType.Remote:
        notif.finish(RemoteNotificationResult.NewData);
        break;
      case NotificationType.NotificationResponse:
        showApproveTransactions(sessionId, transactionId);
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

registerAppListener();
registerKilledListener();

function showApproveTransactions(sessionId, transactionId) {
  addNewTransaction(sessionId, transactionId).then(() => {
    // Navigation.showModal({
    //   screen: 'BalanceWallet.TransactionScreen',
    //   navigatorStyle: { navBarHidden: true },
    //   navigatorButtons: {},
    //   animationType: 'slide-up',
    // });
  });
}

Navigation.events().registerAppLaunchedListener(() => {
  Navigation.setRoot({
    root: {
      stack: {
        id: 'IntroScreen',
        children: [{
          component: {
            name: 'BalanceWallet.IntroScreen',
          },
        }],
      },
    },
  });
});

  // Navigation.setRoot({
  //   root: {
  //     bottomTabs: {
  //       children: [{
  //         stack: {
  //           children: [{
  //             component: {
  //               name: '',
  //               passProps: {
  //                 text: 'This is tab 1',
  //               },
  //             },
  //           }],
  //           options: {
  //             bottomTab: {
  //               title: 'Intro Screen',
  //               icon: require('./assets/wallet-icon.png'), // eslint-disable-line
  //               testID: 'FIRST_TAB_BAR_BUTTON',
  //             },
  //           },
  //         },
  //       },
  //       {
  //         component: {
  //           name: 'BalanceWallet.WalletScreen',
  //           passProps: {
  //             text: 'This is tab 2',
  //           },
  //           options: {
  //             bottomTab: {
  //               title: 'Tab 2',
  //               icon: require('./assets/wallet-icon.png'), // eslint-disable-line
  //               testID: 'SECOND_TAB_BAR_BUTTON',
  //             },
  //           },
  //         },
  //       }],
  //     },
  //   },
  // });
// Navigation.startTabBasedApp({
//   tabs: [
//     {
//       label: 'Intro',
//       screen: '',

//       title: 'Intro',
//     },
//     {
//       label: 'Wallet',
//       screen: 'BalanceWallet.WalletScreen',
//       icon: require('./assets/wallet-icon.png'), // eslint-disable-line

//       title: 'Wallet',
//     },
//     {
//       label: 'Scan',
//       screen: 'BalanceWallet.QRScannerScreen',
//       icon: require('./assets/scan-icon.png'), // eslint-disable-line

//       title: 'WalletConnect',
//     },
//     {
//       label: 'Settings',
//       screen: 'BalanceWallet.SettingsScreen',
//       icon: require('./assets/settings-icon.png'), // eslint-disable-line

//       title: 'Settings',
//     },
//   ],
//   tabsStyle: {
//     tabBarButtonColor: '#abb1b8',
//     tabBarSelectedButtonColor: '#0b0b0c',
//     tabBarBackgroundColor: '#fff',
//     initialTabIndex: 0,
//   },
//   appStyle: {
//     orientation: 'portrait',
//     bottomTabBadgeTextColor: 'red',
//     bottomTabBadgeBackgroundColor: 'green',

//     hideBackButtonTitle: false,
//   },

//   passProps: {},
//   animationType: 'slide-down',
// });
