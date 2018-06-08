import React, { Component } from 'react';
import { Button, Clipboard, Image } from 'react-native';
import Card from '../components/Card';
import Container from '../components/Container';
import Label from '../components/Label';
import Section from '../components/Section';
import Text from '../components/Text';
import { apiGetAccountBalances } from '../helpers/api';
import * as ethWallet from '../model/ethWallet';

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
            <Label>{'Wallet Address'}</Label>
            <Text>{address}</Text>
            <Button onPress={Clipboard.setString(address)} title="Copy" color="#666666" accessibilityLabel="Copy the address of your wallet to the clipboard" />
          </Section>
        </Card>
        {this.state.wallet &&
          this.state.wallet.assets.map(asset => (
            <Section key={asset.symbol}>
              <Image
                style={{
                  width: 25,
                  height: 25,
                  borderRadius: 12.5,
                  backgroundColor: '#000',
                }}
                source={require('../assets/ethereum.png')}
              />
              <Label>{asset.name}</Label>
              <Text>{`${Number(asset.balance).toFixed(8)} ${asset.symbol}`}</Text>
            </Section>
          ))}
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
