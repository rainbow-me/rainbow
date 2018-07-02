import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { Text } from 'react-native';
import styled from 'styled-components/native';
import Row from '../layout/Row';
import Column from '../layout/Column';
// import Label from '../Label';
// import Section from '../Section';
// import Text from '../Text';
// import CoinIcon from '../CoinIcon';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import { colors, fonts } from '../../styles';
import BalanceText from './BalanceText';
import TransactionStatusBadge from './TransactionStatusBadge';

const TransactionCoinRow = (props) => (
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
        <Text>{`${Number(balance).toFixed(8)} ${symbol}`}</Text>
      </Fragment>
    )}
  />
);

TransactionCoinRow.propTypes = {
  // address: PropTypes.string,
  // balance: PropTypes.string,
  // imgPath: PropTypes.string,
  // name: PropTypes.string,
  // symbol: PropTypes.string,
};

export default TransactionCoinRow;
