import PropTypes from 'prop-types';
import React from 'react';
import { css } from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const containerStyles = css`
  padding-bottom: 18;
  padding-left: 15;
  padding-top: 6;
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
  <Text color={colors.alpha(colors.blueGreyDark, 0.5)} size="smedium">
    {balanceDisplay} ≈ {balanceNativeValue}
  </Text>
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
  <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
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
