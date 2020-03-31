import PropTypes from 'prop-types';
import React from 'react';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Monospace } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const BottomRow = ({
  balance: { display: balanceDisplay },
  native: {
    balance: { display: balanceNativeValue },
  },
}) => (
  <Monospace color={colors.alpha(colors.blueGreyDark, 0.6)} size="smedium">
    {balanceDisplay} ≈ {balanceNativeValue}
  </Monospace>
);

BottomRow.propTypes = {
  balance: PropTypes.object,
  native: PropTypes.object,
};

const TopRow = ({ name }) => <CoinName weight="regular">{name}</CoinName>;

TopRow.propTypes = {
  name: PropTypes.string,
};

const SendSavingsCoinRow = ({ item, onPress, ...props }) => (
  <ButtonPressAnimation onPress={onPress} scaleTo={1.01}>
    <CoinRow
      {...item}
      {...props}
      bottomRowRender={BottomRow}
      onPress={onPress}
      topRowRender={TopRow}
    />
  </ButtonPressAnimation>
);

SendSavingsCoinRow.propTypes = {
  item: PropTypes.object,
  onPress: PropTypes.func,
};

export default SendSavingsCoinRow;
