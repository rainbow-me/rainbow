import React, { Component } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import FCM from 'react-native-fcm';
import * as EthWallet from '../model/ethWallet';
import * as api from '../model/api';

class QRScannerScreen extends Component {
    onSuccess = async (e) => {
        console.log(`e.data: ${e.data}`);
        const data = JSON.parse(e.data);
        if (data.domain && data.token) {
            const fcmToken = await FCM.getFCMToken();
            const address = await EthWallet.loadAddress();
            const responseJson = await api.updateConnectionDetails(data.domain, data.token, fcmToken, [address]);
            console.log(`responseJson: ${responseJson}`);
        }

        setTimeout(() => {
            this.qrCodeScanner.reactivate();
        }, 1000);

        // Alert.alert(
        //     'QR Code Contents',
        //     e.data,
        //     [
        //         {
        //             text: 'OK',
        //             onPress: () => {
        //                 console.dir(this);
        //                 this.qrCodeScanner.reactivate();
        //                 console.log('OK Pressed');
        //             },
        //         },
        //     ],
        //     { cancelable: false },
        // );
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
