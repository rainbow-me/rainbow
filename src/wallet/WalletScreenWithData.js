import React, { Component } from 'react';
import { apiGetAccountBalances, apiGetTransactionData } from '../helpers/api';
import * as ethWallet from '../model/ethWallet';
import WalletScreen from './WalletScreen';

export default class WalletScreenWithData extends Component {
  state = {
    loading: true,
    wallet: {},
  }

  static navigatorStyle = {
    navBarHidden: true,
  }

  componentDidMount= () =>
    this.loadWallet()
      .then(wallet => this.setState({ loading: false, wallet }))
      .catch(error => this.setState({ loading: false, wallet: {} }))

  loadWallet = async () => {
    try {
      const wallet = await ethWallet.loadWallet();
      console.log('initial wallet: ', wallet);

      if (wallet) {
        const balances = await apiGetAccountBalances(wallet.address, 'mainnet');
        const transactions = await apiGetTransactionData(wallet.address, 'mainnet');

        const assets = balances.data.map(asset => {
          const exponent = 10 ** Number(asset.contract.decimals);
          const balance = Number(asset.balance) / exponent;
          return {
            address: asset.contract.address,
            name: asset.contract.name,
            symbol: asset.contract.symbol,
            decimals: asset.contract.decimals,
            balance,
          };
        });

        wallet.assets = assets;
        wallet.transactions = transactions.data.docs;

        console.log('loaded wallet: ', wallet);
        return wallet;
      }
      return null;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  render = () => <WalletScreen {...this.state} />
}
