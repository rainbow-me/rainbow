import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Monospace } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const BottomRow = ({ balance, native, nativeCurrencySymbol }) => {
  const fiatValue = get(native, 'balance.display') || `${nativeCurrencySymbol}0.00`;

  return (
    <Monospace
      color={colors.alpha(colors.blueGreyDark, 0.6)}
      size="smedium"
    >
      {get(balance, 'display')} ≈ {fiatValue}
    </Monospace>
  );
};

BottomRow.propTypes = {
  balance: PropTypes.shape({ display: PropTypes.string }),
  native: PropTypes.object,
  nativeCurrencySymbol: PropTypes.string,
};

const TopRow = ({ name, paddingRight }) => (
  <CoinName paddingRight={paddingRight || 0}>
    {name}
  </CoinName>
);

TopRow.propTypes = {
  name: PropTypes.string,
  paddingRight: PropTypes.number,
};

const SendCoinRow = ({ item, onPress, ...props }) => (
  <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
    <CoinRow
      {...item}
      {...props}
      bottomRowRender={BottomRow}
      topRowRender={TopRow}
    />
  </ButtonPressAnimation>
);

SendCoinRow.propTypes = {
  item: PropTypes.object,
  onPress: PropTypes.func,
};

export default SendCoinRow;
