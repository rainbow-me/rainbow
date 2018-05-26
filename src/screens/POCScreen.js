import React, { Component } from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';
import * as ethWallet from '../model/ethWallet';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\nCmd+D or shake for dev menu',
  android: 'Double tap R on your keyboard to reload,\nShake or press menu button for dev menu',
});

class POCScreen extends Component {
  componentDidMount = async () => {
    await ethWallet.init();
    const addresses = ethWallet.getPublicAddresses();
    console.log(`addresses: ${addresses}`);
    const ethBalance = await ethWallet.getEthBalance(addresses[0]);
    console.log(`ethBalance: ${ethBalance}`);
  };

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to React Native!</Text>
        <Text style={styles.instructions}>To get started, edit App.js</Text>
        <Text style={styles.instructions}>{instructions}</Text>
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
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

export default POCScreen;
