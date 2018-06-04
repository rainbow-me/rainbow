import React, { Component } from 'react';
import { Button, Clipboard } from 'react-native';
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
        const assets = data.map(asset => {
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
        console.log('wallet', wallet);
        return wallet;
      }
      return null;
    } catch (error) {
      console.error(error);
      return error;
    }
  };

  render() {
    const address = this.state.wallet ? this.state.wallet.address : '';
    return !this.state.loading ? (
      <Container>
        <Card>
          <Section>
            <Label>{'Address'}</Label>
            <Text>{address}</Text>
            <Button onPress={Clipboard.setString(address)} title="Copy" />
          </Section>
          {this.state.wallet &&
            this.state.wallet.assets.map(asset => (
              <Section key={asset.symbol}>
                <Label>{asset.name}</Label>
                <Text>{`${Number(asset.balance).toFixed(8)} ${asset.symbol}`}</Text>
              </Section>
            ))}
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
