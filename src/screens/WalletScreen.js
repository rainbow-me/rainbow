import React, { Component } from 'react';
import * as ethWallet from '../model/ethWallet';
import { apiGetAccountBalances } from '../helpers/api';
import Container from '../components/Container';
import Card from '../components/Card';
import Section from '../components/Section';
import Text from '../components/Text';
import Label from '../components/Label';

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
      <Container>
        <Card>
          <Section>
            <Label>{'Address'}</Label>
            <Text>{address}</Text>
          </Section>
          <Section>
            <Label>{'Ethereum'}</Label>
            <Text>{ethBalance}</Text>
          </Section>
        </Card>
      </Container>
    ) : (
      <Container>
        <Card>
          <Section>
            <Label>Loading...</Label>
          </Section>
        </Card>
      </Container>
    );
  }
}

export default WalletScreen;
