import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { walletConnectInit, walletConnectSendSession } from '../model/walletconnect';

class QRScannerScreen extends Component {
  onSuccess = async e => {
    const data = JSON.parse(e.data);
    if (data.domain && data.sessionId && data.sharedKey && data.dappName) {
      await walletConnectInit(data.domain, data.sessionId, data.sharedKey, data.dappName);
      await walletConnectSendSession();
    }

    setTimeout(() => {
      this.qrCodeScanner.reactivate();
    }, 1000);
  };
  static navigatorStyle = {
    navBarHidden: true,
    statusBarTextColorScheme: 'light',
  };

  render() {
    return (
      <View style={styles.container}>
        <QRCodeScanner
          ref={c => {
            this.qrCodeScanner = c;
          }}
          topViewStyle={styles.scannerTop}
          bottomViewStyle={styles.scannerBottom}
          style={styles.scanner}
          onRead={this.onSuccess}
        />
        <Text style={styles.centerText}>Scan a QR code to connect to a web dapp</Text>
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
    backgroundColor: '#eeeeee',
  },

  centerText: {
    flexWrap: 'wrap',
    textAlign: 'center',
    height: 100,
    fontSize: 18,
    paddingTop: 32,
    color: 'rgba(0,0,0,0.54)',
  },

  scannerTop: {
    flex: 0,
    height: 0,
  },
  scanner: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
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
