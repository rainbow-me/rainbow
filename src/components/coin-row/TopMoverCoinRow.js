import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import styled from 'styled-components/primitives';
import { handleSignificantDecimals } from '../../helpers/utilities';
import { useAccountSettings } from '../../hooks';
import { uniswapPairs } from '../../references';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Centered, ColumnWithMargins, RowWithMargins } from '../layout';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';

const TopMoverTitle = styled(CoinName).attrs({
  paddingRight: 0,
  weight: 'semibold',
})``;

const TopMoverCoinRow = ({
  address,
  name,
  percent_change_24h,
  price,
  symbol,
  onPress,
  ...props
}) => {
  const { nativeCurrencySymbol } = useAccountSettings();

  const formattedPrice = useMemo(() => {
    const value = handleSignificantDecimals(price, 2);
    return `${nativeCurrencySymbol}${value}`;
  }, [nativeCurrencySymbol, price]);

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={1.02}>
      <RowWithMargins margin={8}>
        <Centered>
          <CoinIcon address={address} size={36} symbol={symbol} />
        </Centered>
        <ColumnWithMargins margin={2}>
          <TopMoverTitle color={colors.alpha(colors.blueGreyDark, 0.8)}>
            {uniswapPairs[address]?.name || name}
          </TopMoverTitle>
          <BottomRowText>{formattedPrice}</BottomRowText>
        </ColumnWithMargins>
        <ColumnWithMargins align="end" justify="end" margin={2}>
          <TopMoverTitle
            align="right"
            color={percent_change_24h > 0 ? colors.green : colors.red}
          >
            {`${parseFloat((percent_change_24h || 0).toFixed(2))}%`}
          </TopMoverTitle>
          <BottomRowText align="right">{symbol}</BottomRowText>
        </ColumnWithMargins>
      </RowWithMargins>
    </ButtonPressAnimation>
  );
};

TopMoverCoinRow.propTypes = {
  item: PropTypes.object,
  onPress: PropTypes.func,
};

export default TopMoverCoinRow;
