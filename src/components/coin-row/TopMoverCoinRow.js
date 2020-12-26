import React, { useCallback } from 'react';
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
  color: colors.alpha(colors.blueGreyDark, 0.8),
  paddingRight: 0,
  weight: 'semibold',
})``;

export const measureBottomRowText = text =>
  measureText(text, {
    fontSize: parseFloat(fonts.size.smedium),
    fontWeight: fonts.weight.medium,
  });

export const measureTopRowText = text =>
  measureText(text, {
    fontSize: parseFloat(fonts.size.lmedium),
    fontWeight: fonts.weight.semibold,
    letterSpacing: fonts.letterSpacing.roundedMedium,
  });

const PADDING_BETWEEN_ITEMS = 26;

export const measureTopMoverCoinRow = async ({
  change,
  price,
  trimmedName,
}) => {
  const { width: nameWidth } = await measureTopRowText(trimmedName);
  const { width: priceWidth } = await measureBottomRowText(price);
  const { width: changeWidth } = await measureBottomRowText(change);

  const contentWidth = Math.max(nameWidth, priceWidth + changeWidth);

  return (
    PADDING_BETWEEN_ITEMS +
    [TopMoverCoinIconSize, contentWidth].reduce(
      (acc, val) => acc + val + TopMoverCoinRowMargin
    )
  );
};

const TopMoverCoinRow = ({
  address,
  change,
  name,
  onPress,
  price,
  symbol,
  trimmedName,
}) => {
  const handlePress = useCallback(() => {
    onPress?.({ address, change, name, price, symbol });
  }, [address, change, name, onPress, price, symbol]);

  return (
    <ButtonPressAnimation
      // we observe that while integrating with
      // gesture handler event gets always cancelled on iOS
      // Therefore, in this case under given condition
      // onPress should be called
      onCancel={({ nativeEvent: { state, inside } }) =>
        state === 5 && inside && handlePress()
      }
      onPress={handlePress}
      scaleTo={1.02}
    >
      <RowWithMargins margin={TopMoverCoinRowMargin}>
        <Centered>
          <CoinIcon
            address={address}
            size={TopMoverCoinIconSize}
            symbol={symbol}
          />
        </Centered>
        <ColumnWithMargins margin={2}>
          <TopMoverTitle>{trimmedName}</TopMoverTitle>
          <BottomRowText weight="medium">
            {price}
            <BottomRowText
              color={parseFloat(change) > 0 ? colors.green : colors.red}
              weight="medium"
            >
              {change}
            </BottomRowText>
          </BottomRowText>
        </ColumnWithMargins>
      </RowWithMargins>
    </ButtonPressAnimation>
  );
};

export default magicMemo(TopMoverCoinRow, ['change', 'name', 'price']);
