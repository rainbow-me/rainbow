import React, { Component } from 'react';
import Card from '../components/Card';
import CoinRow from '../components/CoinRow';
import Container from '../components/Container';
import Label from '../components/Label';
import Section from '../components/Section';
import WalletMenu from '../components/WalletMenu';
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
        const { data } = await apiGetAccountBalances('0xB872DB8f21934317A79c9B74D8C001BB015E6045', 'mainnet');
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
        <WalletMenu walletAddress={address} />
        {this.state.wallet &&
          this.state.wallet.assets.map(asset => {
            const coinLogo =
              asset.symbol === 'ETH'
                ? 'https://raw.githubusercontent.com/balance-io/tokens/master/images/ethereum_1.png'
                : `https://raw.githubusercontent.com/balance-io/tokens/master/images/${asset.address}.png`;
            return <CoinRow key={asset.symbol} imgPath={coinLogo} coinSymbol={asset.symbol} coinName={asset.name} coinBalance={asset.balance} />;
          })}
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
