import React, { Component } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import FCM, { FCMEvent, NotificationType, RemoteNotificationResult, WillPresentNotificationResult } from 'react-native-fcm';
import { Navigation } from 'react-native-navigation';
import PropTypes from 'prop-types';
import * as ethWallet from '../model/ethWallet';
import * as api from '../model/api';
import * as connections from '../model/connections';

class QRScannerScreen extends Component {
    constructor(props) {
        super(props);
        this.registerAppListener();
    }

    componentDidMount = async () => {
        Navigation.showModal({
            screen: 'BalanceWallet.TransactionScreen', // unique ID registered with Navigation.registerScreen
            // title: 'Modal', // title of the screen as appears in the nav bar (optional)
            passProps: {}, // simple serializable object that will pass as props to the modal (optional)
            navigatorStyle: { navBarHidden: true }, // override the navigator style for the screen, see "Styling the navigator" below (optional)
            navigatorButtons: {}, // override the nav buttons for the screen, see "Adding buttons to the navigator" below (optional)
            animationType: 'slide-up', // 'none' / 'slide-up' , appear animation for the modal (optional, default 'slide-up')
        });
    };

    registerAppListener = () => {
        FCM.on(FCMEvent.Notification, (notif) => {
            // TODO: Parse deviceUuid, transactionUuid, and eventually vendor name etc, then look up the
            //       publick key from the keychain based on the deviceUuid to make further API calls
            console.log(`registerAppListener notif: ${notif}`);

            if (Platform.OS === 'ios') {
                // optional
                // iOS requires developers to call completionHandler to end notification process. If you do not call it your background remote notifications could be throttled, to read more about it see the above documentation link.
                // This library handles it for you automatically with default behavior (for remote notification, finish with NoData; for WillPresent, finish depend on "show_in_foreground"). However if you want to return different result, follow the following code to override
                // notif._notificationType is available for iOS platfrom
                switch (notif._notificationType) {
                case NotificationType.Remote:
                    notif.finish(RemoteNotificationResult.NewData); // other types available: RemoteNotificationResult.NewData, RemoteNotificationResult.ResultFailed
                    break;
                case NotificationType.NotificationResponse:
                    notif.finish();
                    break;
                case NotificationType.WillPresent:
                    notif.finish(WillPresentNotificationResult.All); // other types available: WillPresentNotificationResult.None
                    // this type of notificaiton will be called only when you are in foreground.
                    // if it is a remote notification, don't do any app logic here. Another notification callback will be triggered with type NotificationType.Remote
                    break;
                default:
                    break;
                }
            }

            // Show the TransactionScreen
        });
    };

    onSuccess = async (e) => {
        console.log(`e.data: ${e.data}`);
        const data = JSON.parse(e.data);
        if (data.domain && data.sessionToken && data.publickKey) {
            // Create a connection object
            const connection = connections.createConnection(data.domain, data.publicKey);

            // Get the other parameters
            const fcmToken = await FCM.getFCMToken();
            const address = await ethWallet.loadAddress();

            // Call the API to register this device and get the deviceUuid
            const deviceUuid = await api.updateDeviceDetails(connection, data.sessionToken, fcmToken, [address]);
            console.log(`deviceUuid: ${deviceUuid}`);

            // Persist the connection object
            connection.deviceUuid = deviceUuid;
            connections.saveConnection(connection);
        }

        setTimeout(() => {
            this.qrCodeScanner.reactivate();
        }, 1000);
    };

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.centerText}>Scan the Balance Manager QR code to log in</Text>
                <QRCodeScanner
                    ref={(c) => {
                        this.qrCodeScanner = c;
                    }}
                    topViewStyle={styles.scannerTop}
                    bottomViewStyle={styles.scannerBottom}
                    style={styles.scanner}
                    onRead={this.onSuccess}
                />
            </View>
        );
    }
}

QRScannerScreen.propTypes = {
    navigation: PropTypes.any,
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },

    centerText: {
        flexWrap: 'wrap',
        textAlign: 'center',
        height: 100,
        fontSize: 18,
        paddingTop: 32,
        color: '#777',
    },

    scannerTop: {
        flex: 0,
        height: 0,
    },
    scanner: {
        flex: 1,
    },
    scannerBottom: {
        flex: 0,
        height: 0,
    },

    textBold: {
        fontWeight: '500',
        color: '#000',
    },

    buttonText: {
        fontSize: 21,
        color: 'rgb(0,122,255)',
    },
});

export default QRScannerScreen;
