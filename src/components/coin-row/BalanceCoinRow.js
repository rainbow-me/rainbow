import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { Monospace } from '../text';
import BalanceText from './BalanceText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const BottomRowText = styled(Monospace).attrs({ size: 'smedium' })`
  color: ${({ color }) => (color || colors.blueGreyLight)};
`;

const formatPercentageString = percentString => (
  percentString
    ? percentString.split('-').join('- ').split('%').join(' %')
    : '-'
);

const BalanceCoinRow = ({ item, ...props }) => (
  <CoinRow
    {...item}
    {...props}
    bottomRowRender={({ balance, symbol, native }) => {
      const percentChange = get(native, 'change.display');
      const percentageChangeDisplay = formatPercentageString(percentChange);
      const isPositive = (percentChange && (percentageChangeDisplay.charAt(0) !== '-'));

      return (
        <Fragment>
          <BottomRowText>{balance.display}</BottomRowText>
          <BottomRowText color={isPositive ? colors.seaGreen : null}>
            {percentageChangeDisplay}
          </BottomRowText>
        </Fragment>
      );
    }}
    topRowRender={({ name, native }) => {
      const nativeDisplay = get(native, 'balance.display');
      return (
        <Fragment>
          <CoinName>{name}</CoinName>
          <BalanceText color={nativeDisplay ? null : colors.blueGreyLight}>
            {nativeDisplay || '$0.00'}
          </BalanceText>
        </Fragment>
      );
    }}
  />
);

BalanceCoinRow.propTypes = {
  item: PropTypes.object,
};

export default BalanceCoinRow;
