import React from 'react';
import { css } from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const selectedHeight = 78;

const containerStyles = css`
  padding-bottom: 18;
  padding-left: 15;
  padding-top: 6;
`;

const containerSelectedStyles = css`
  ${padding(15, 15, 19)};
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

const TopRow = ({ name }) => <CoinName weight="regular">{name}</CoinName>;

export default function SendSavingsCoinRow({
  item,
  onPress,
  selected,
  ...props
}) {
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
      <CoinRow
        {...item}
        {...props}
        bottomRowRender={BottomRow}
        containerStyles={selected ? containerSelectedStyles : containerStyles}
        onPress={onPress}
        topRowRender={TopRow}
      />
    </ButtonPressAnimation>
  );
}
