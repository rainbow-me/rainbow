import React, { Component } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';

class QRScannerScreen extends Component {
    onSuccess = (e) => {
        Alert.alert(
            'QR Code Contents',
            e.data,
            [
                {
                    text: 'OK',
                    onPress: () => {
                        console.dir(this);
                        this.qrCodeScanner.reactivate();
                        console.log('OK Pressed');
                    },
                },
            ],
            { cancelable: false },
        );
    };

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.centerText}>
                    Go to <Text style={styles.textBold}>wikipedia.org/wiki/QR_code</Text> on your computer and scan the QR code.
                </Text>
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
