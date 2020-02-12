import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';
import { compose } from 'recompact';
import Button from '../components/buttons/Button';
import { Centered, Page } from '../components/layout';
import {
  withDataInit,
  withAccountData,
  withUniswapAssets,
  withGas,
  withUniswapAllowances,
  withBlockPolling,
  withRaps,
} from '../hoc';
import { colors, position } from '../styles';
import swapOnUniswap from '../raps/swap-uniswap';
import { loadWallet } from '../model/wallet';

class ExampleScreen extends PureComponent {
  static propTypes = {
    initializeWallet: PropTypes.func,
  };

  componentDidMount = async () => {
    try {
      await this.props.initializeWallet();
      await this.props.rapsRemove();
    } catch (error) {
      console.log('lol error on ExampleScreen like a n00b: ', error);
    }
  };

  componentWillUnmount() {
    this.props.web3ListenerStop();
  }

  doSwap = async () => {
    const wallet = await loadWallet();

    const inputCurrency = {
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      decimals: 18,
      exchangeAddress: '0x2a1530c4c41db0b0b2bb646cb5eb1a67b7158667',
    };
    const outputCurrency = {
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      decimals: 18,
    };

    const inputAmount = 0.1; // DAI
    const outputAmount = 0.0003; // WETH
    const inputAsExactAmount = true;

    try {
      const { swap, rap } = await swapOnUniswap(
        wallet,
        inputCurrency,
        outputCurrency,
        inputAmount,
        outputAmount,
        null,
        inputAsExactAmount
      );

      console.log('SWAP EXECUTED!', swap.hash);
      await swap.wait();
      rap.transactions.swap.confirmed = true;
      rap.transactions.completed_at = new Date().getTime();
      this.props.rapsAddOrUpdate(rap.id, rap);
      console.log('SWAP CONFIRMED');
    } catch (e) {
      console.log('SWAP FAILED', e);
    }
  };

  render = () => (
    <Page
      {...position.centeredAsObject}
      {...position.sizeAsObject('100%')}
      color={colors.dark}
      flex={1}
    >
      <View style={{ backgroundColor: `white` }}>
        <Text>{JSON.stringify(this.props.raps)}</Text>
      </View>
      <Centered width="100%">
        <Button onPress={this.doSwap}>
          <Text>Swap</Text>
        </Button>
      </Centered>
    </Page>
  );
}

export default compose(
  withAccountData,
  withDataInit,
  withUniswapAssets,
  withUniswapAllowances,
  withGas,
  withBlockPolling,
  withRaps
)(ExampleScreen);
