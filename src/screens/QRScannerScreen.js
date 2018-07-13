import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import Card from '../components/Card';
import DappCard from '../components/DappCard';
import { walletConnectInit } from '../model/walletconnect';
import { connect } from 'react-redux';

export default class QRScannerScreen extends Component {

  onSuccess = async e => {
    const data = JSON.parse(e.data);
    if (data.domain && data.sessionId && data.sharedKey && data.dappName) {
      await walletConnectInit(data.domain, data.sessionId, data.sharedKey, data.dappName);
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
          <Image style={styles.connectLogo} source={require('../assets/walletconnect-logo-blue.png')} />
          <Text style={[styles.centerText, styles.title]}>WalletConnect</Text>
          <Text style={[styles.centerText, styles.textDefault]}>Scan a QR code to connect to a web dapp</Text>
          <ScrollView horizontal contentContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}>
            {dappInfo.map(dapp => <DappCard key={dapp.name} dappName={dapp.name} dappImage={dapp.image} dappText={dapp.text} />)}
          </ScrollView>
        </Card>
      </View>
    );
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eeeeee',
  },
  connectLogo: {
    width: 74,
    height: 46,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  centerText: {
    flexWrap: 'wrap',
    textAlign: 'center',
  },
  textDefault: {
    fontSize: 16,
    paddingTop: 24,
    color: 'rgba(0,0,0,0.54)',
  },
  title: {
    color: '#3B99FC',
    fontSize: 18,
    paddingTop: 16,
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

const dappInfo = [
  {
    name: 'CryptoKitties.co',
    image: require('../assets/landing-kitty03.png'),
    text: 'Tokenised cat trading',
  },
  {
    name: 'OpenSea.io',
    image: require('../assets/opensea.png'),
    text: 'Trade unique tokens',
  },
  {
    name: 'Balance.io',
    image: require('../assets/balance.png'),
    text: 'Token based banking',
  },
];

