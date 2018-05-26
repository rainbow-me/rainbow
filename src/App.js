import FCM, { FCMEvent, NotificationType, RemoteNotificationResult, WillPresentNotificationResult } from 'react-native-fcm';
import { Platform, AsyncStorage, AppState } from 'react-native';
import { Navigation } from 'react-native-navigation';
import { registerScreens, registerScreenVisibilityListener } from './screens';
import * as EthWallet from './model/ethWallet';
import { addNewTransaction } from './model/transactions';
// import walletIcon from '../img/wallet-icon.png';
// import scanIcon from '../img/scan-icon.png';
// import settingsIcon from '../img/settings-icon.png';

registerScreens();
registerScreenVisibilityListener();

EthWallet.init();

FCM.getFCMToken().then(fcmToken => {
    console.log(`FCM Token: ${fcmToken}`);
});

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
        Navigation.showModal({
            screen: 'BalanceWallet.TransactionScreen',
            navigatorStyle: { navBarHidden: true },
            navigatorButtons: {},
            animationType: 'slide-up',
        });
    });
}

Navigation.startTabBasedApp({
    tabs: [
        {
            label: 'Wallet',
            screen: 'BalanceWallet.WalletScreen',
            // icon: walletIcon,

            title: 'Wallet',
        },
        {
            label: 'Scan',
            screen: 'BalanceWallet.QRScannerScreen',
            // icon: scanIcon,

            title: 'Wallet Connect',
        },
        {
            label: 'Settings',
            screen: 'BalanceWallet.SettingsScreen',
            // icon: settingsIcon,

            title: 'Settings',
        },
    ],
    tabsStyle: {
        tabBarButtonColor: '#abb1b8',
        tabBarSelectedButtonColor: '#0b0b0c',
        tabBarBackgroundColor: '#f7f8fc',
        initialTabIndex: 1,
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
