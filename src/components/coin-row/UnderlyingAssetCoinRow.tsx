import React from 'react';
import styled from 'styled-components';
import { magicMemo } from '../../utils';
import { CoinIcon } from '../coin-icon';
import { Centered, Row } from '../layout';
import { Text, TruncatedText } from '../text';

const CoinName = styled(TruncatedText).attrs({
  size: 'large',
  weight: 'medium',
})`
  padding-right: 42;
`;

const UnderlyingCoinIconSize = 20;

const UnderlyingAssetCoinRow = ({
  address,
  change,
  color,
  isPositive,
  name,
  symbol,
  changeVisible,
}) => {
  const { colors } = useTheme();

  return (
    <Row marginBottom={19}>
      <Centered marginRight={6}>
        <CoinIcon
          address={address}
          size={UnderlyingCoinIconSize}
          symbol={symbol}
        />
      </Centered>
      <Row>
        <CoinName
          color={changeVisible ? colors.alpha(colors.blueGreyDark, 0.7) : color}
        >
          {name}{' '}
          {changeVisible && (
            <Text
              color={isPositive ? colors.green : colors.brightRed}
              letterSpacing="roundedTight"
              size="smedium"
              weight="medium"
            >
              {change ? (isPositive ? `↑` : `↓`) : ''} {change}
            </Text>
          )}
        </CoinName>
      </Row>
    </Row>
  );
};

export default magicMemo(UnderlyingAssetCoinRow, ['change', 'name']);
