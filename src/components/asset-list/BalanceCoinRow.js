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
    bottomRowRender={({ balance, symbol, native }) => (
      <Fragment>
        <BottomRowText>
          {`${balance.display}`}
        </BottomRowText>
        <BottomRowText>
          {`${(native && native.change)
            ? native.change.display.split('%').join(' %')
            : '-'
          }`}
        </BottomRowText>
      </Fragment>
    )}
    topRowRender={({ balance, name, native }) => (
      <Fragment>
        <CoinName>{name}</CoinName>
        <BalanceText>
          {`${(native && native.balance) ? native.balance.display : '--'}`}
        </BalanceText>
      </Fragment>
    )}
  />
);

BalanceCoinRow.propTypes = {
  item: PropTypes.object,
};

export default BalanceCoinRow;
