import PropTypes from 'prop-types';
import React from 'react';
import { css } from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Monospace } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const containerStyles = css`
  padding-left: 15;
  padding-top: 17;
`;

const selectedHeight = 78;

const selectedStyles = css`
  ${padding(15, 15, 19, 15)};
  height: ${selectedHeight};
`;

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

const SendSavingsCoinRow = ({ item, onPress, selected, ...props }) => (
  <ButtonPressAnimation onPress={onPress} scaleTo={1.01}>
    <CoinRow
      {...item}
      {...props}
      bottomRowRender={BottomRow}
      containerStyles={selected ? selectedStyles : containerStyles}
      onPress={onPress}
      topRowRender={TopRow}
    />
  </ButtonPressAnimation>
);

SendSavingsCoinRow.propTypes = {
  item: PropTypes.object,
  onPress: PropTypes.func,
  selected: PropTypes.bool,
};

export default SendSavingsCoinRow;
