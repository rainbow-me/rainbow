import React from 'react';
import styled from 'styled-components/primitives';
import { colors, fonts } from '../../styles';
import { magicMemo, measureText } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Centered, ColumnWithMargins, RowWithMargins } from '../layout';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';

const TopMoverCoinIconSize = 36;
const TopMoverCoinRowMargin = 8;

const TopMoverTitle = styled(CoinName).attrs({
  paddingRight: 0,
  weight: 'semibold',
})``;

export const measureBottomRowText = text =>
  measureText(text, {
    fontSize: parseFloat(fonts.size.smedium),
  });

export const measureTopRowText = text =>
  measureText(text, {
    fontSize: parseFloat(fonts.size.lmedium),
    fontWeight: fonts.weight.semibold,
    letterSpacing: fonts.letterSpacing.roundedMedium,
  });

const PADDING_BETWEEN_ITEMS = 20;

export const measureTopMoverCoinRow = async ({
  change,
  name,
  price,
  symbol,
}) => {
  const { width: changeWidth } = await measureTopRowText(change);
  const { width: nameWidth } = await measureTopRowText(name);
  const { width: priceWidth } = await measureBottomRowText(price);
  const { width: symbolWidth } = await measureBottomRowText(symbol);

  const leftWidth = Math.max(nameWidth, priceWidth);
  const rightWidth = Math.max(changeWidth, symbolWidth);

  return (
    PADDING_BETWEEN_ITEMS +
    [TopMoverCoinIconSize, leftWidth, rightWidth].reduce(
      (acc, val) => acc + val + TopMoverCoinRowMargin
    )
  );
};

const TopMoverCoinRow = ({ address, change, name, onPress, price, symbol }) => (
  <ButtonPressAnimation onPress={onPress} scaleTo={1.02}>
    <RowWithMargins margin={TopMoverCoinRowMargin}>
      <Centered>
        <CoinIcon
          address={address}
          size={TopMoverCoinIconSize}
          symbol={symbol}
        />
      </Centered>
      <ColumnWithMargins margin={2}>
        <TopMoverTitle color={colors.alpha(colors.blueGreyDark, 0.8)}>
          {name}
        </TopMoverTitle>
        <BottomRowText>{price}</BottomRowText>
      </ColumnWithMargins>
      <ColumnWithMargins align="end" justify="end" margin={2}>
        <TopMoverTitle
          align="right"
          color={parseFloat(change) > 0 ? colors.green : colors.red}
        >
          {change}
        </TopMoverTitle>
        <BottomRowText align="right">{symbol}</BottomRowText>
      </ColumnWithMargins>
    </RowWithMargins>
  </ButtonPressAnimation>
);

export default magicMemo(TopMoverCoinRow, ['change', 'name', 'price']);
