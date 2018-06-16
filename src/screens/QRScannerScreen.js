import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import Card from '../components/Card';
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
        <Card style={{ flex: 1 }}>
          <Image
            style={{
              width: 74,
              height: 46,
              resizeMode: 'contain',
              alignSelf: 'center',
            }}
            source={require('../assets/walletconnect-logo-blue.png')}
          />
          <Text style={[styles.centerText, styles.title]}>WalletConnect</Text>
          <Text style={styles.centerText}>Scan a QR code to connect to a web dapp</Text>
          <ScrollView horizontal>
            <View
              style={{
                borderColor: '#E8E6E6',
                borderStyle: 'solid',
                borderWidth: 0.5,
                padding: 8,
                backgroundColor: '#FCFCFC',
                borderRadius: 8,
              }}
            >
              <Text style={styles.dappName}>CryptoKitties.co</Text>
              <Image
                style={{
                  width: 68,
                  height: 84,
                  resizeMode: 'contain',
                  alignSelf: 'center',
                }}
                source={require('../assets/landing-kitty03.png')}
              />
              <Text style={styles.dappName}>Tokenized cat trading</Text>
            </View>
          </ScrollView>
        </Card>
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
    fontSize: 16,
    paddingTop: 32,
    color: 'rgba(0,0,0,0.54)',
  },
  title: {
    color: '#3B99FC',
    fontSize: 18,
    paddingTop: 16,
  },
  dappName: {
    fontSize: 12,
    color: '#3B99FC',
    paddingTop: 0,
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
