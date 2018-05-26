import React, { Component } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import * as ethWallet from '../model/ethWallet';
import { apiGetAccountBalances } from '../helpers/api';

class WalletScreen extends Component {
  state = {
    loading: false,
    wallet: null,
  };
  componentDidMount() {
    this.setState({ loading: true });
    this.loadWallet()
      .then(wallet => this.setState({ loading: false, wallet }))
      .catch(error => this.setState({ loading: false, wallet: null }));
  }
  loadWallet = async () => {
    try {
      const wallet = await ethWallet.loadWallet();
      console.log('wallet', wallet);
      if (wallet) {
        const { data } = await apiGetAccountBalances(wallet.address, 'mainnet');
        wallet.balances = data;
        console.log('wallet', wallet);
        return wallet;
      }
      throw new Error('Missing wallet!');
    } catch (error) {
      console.error(error);
      return error;
    }
  };
  render() {
    const address = this.state.wallet ? this.state.wallet.address : '';
    const ethereum = this.state.wallet ? this.state.wallet.balances.filter(asset => asset.contract.symbol === 'ETH')[0] : { balance: '0' };
    const ethBalance = `${Number(Number(ethereum.balance) / 1e18).toFixed(8)} ETH`;
    return !this.state.loading ? (
      <View style={styles.container}>
        <Text style={styles.welcome}>{address}</Text>
        <Text style={styles.instructions}>{ethBalance}</Text>
      </View>
    ) : (
      <View style={styles.container}>
        <Text style={styles.instructions}>{'Loading ...'}</Text>
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

export default WalletScreen;
