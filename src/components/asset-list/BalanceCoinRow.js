import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import styled from 'styled-components/primitives';
import { colors, fonts } from '../../styles';
import { Monospace } from '../text';
import BalanceText from './BalanceText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const BottomRowText = styled(Monospace)`
  color: ${colors.blueGreyLight};
  font-size: ${fonts.size.smedium};
`;

const BalanceCoinRow = ({ item, ...props }) => (
  <CoinRow
    {...item}
    {...props}
    bottomRowRender={({ balance, symbol }) => (
      <Fragment>
        <BottomRowText>
          {`${Number(balance).toFixed(8)} ${symbol}`}
        </BottomRowText>
        <BottomRowText>
          {'- 1.58 %'}
        </BottomRowText>
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

BalanceCoinRow.propTypes = {
  item: PropTypes.object,
};

export default BalanceCoinRow;
