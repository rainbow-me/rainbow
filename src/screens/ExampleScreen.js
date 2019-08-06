import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { View } from 'react-native';
import { ExchangeCoinRow } from '../components/coin-row';
import { Centered, Row, Page } from '../components/layout';
import { withHideSplashScreen } from '../hoc';
import { position } from '../styles';

const item = {
  address: "eth",
  balance: {
    amount: "0.07429230016603229",
    display: "0.0743 ETH",
  },
  decimals: 18,
  name: "Ethereum",
  native: {
    balance: {
      amount: "17.1696934913717225419",
      display: "$17.17",
    },
    change: "5.28%",
    price: {
      amount: 231.11,
      display: "$231.11",
    },
  },
  price: {
    changed_at: 1564999503,
    relative_change_24h: 5.279701166180759,
    value: 231.11,
  },
  symbol: "ETH",
  uniqueId: "eth",
};

class ExampleScreen extends PureComponent {
  static propTypes = {
    onHideSplashScreen: PropTypes.func,
  }

  componentDidMount = () => this.props.onHideSplashScreen()

  render = () => (
    <Page
      {...position.centeredAsObject}
      {...position.sizeAsObject('100%')}
      flex={1}
    >
      {/*
        // haha you can put stuff here if you wanna test a component in isolation!
        // ... i dont want to set up storybook right now

      */}
      <Centered width="100%">
        <ExchangeCoinRow {...item} item={item} flex={1} />
      </Centered>
    </Page>
  )
}

export default withHideSplashScreen(ExampleScreen);
