import React, { Fragment } from 'react';
import { Monospace } from '../text';
import BalanceText from './BalanceText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import TransactionStatusBadge from './TransactionStatusBadge';

const TransactionCoinRow = props => (
  <CoinRow
    {...props}
    bottomRowRender={({ balance, name = 'Ethereum' }) => (
      <Fragment>
        <CoinName>{name}</CoinName>
        <BalanceText>{'$50.00'}</BalanceText>
      </Fragment>
    )}
    topRowRender={({ balance = '123123', symbol = 'ETH' }) => (
      <Fragment>
        <TransactionStatusBadge />
        <Monospace>{`${Number(balance).toFixed(8)} ${symbol}`}</Monospace>
      </Fragment>
    )}
  />
);

export default TransactionCoinRow;
