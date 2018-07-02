import React, { Fragment } from 'react';
import { Text } from 'react-native';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import BalanceText from './BalanceText';

const BalanceCoinRow = ({ item, ...props }) => (
  console.log('BALANCECOINROW item item item', item),
  console.log('BALANCECOINROW', props),
  <CoinRow
    {...props}
    {...item}
    bottomRowRender={({ balance, symbol }) => (
      <Fragment>
        <Text>{`${Number(balance).toFixed(8)} ${symbol}`}</Text>
        <Text>{'1.58%'}</Text>
      </Fragment>
    )}
    topRowRender={({ balance, name }) => (
      <Fragment>
        <CoinName>{name}</CoinName>
        <BalanceText>{'$50.00'}</BalanceText>
      </Fragment>
    )}
  />
);

export default BalanceCoinRow;
