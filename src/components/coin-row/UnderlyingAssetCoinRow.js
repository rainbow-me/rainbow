import React from 'react';
import { magicMemo } from '../../utils';
import { CoinIcon } from '../coin-icon';
import { Centered, Row } from '../layout';
import { Text } from '../text';

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
        <Text
          color={changeVisible ? colors.alpha(colors.blueGreyDark, 0.7) : color}
          size="large"
          weight="medium"
        >
          {name}{' '}
          {changeVisible && (
            <Text
              color={isPositive ? colors.green : colors.brightRed}
              letterSpacing="roundedTight"
              size="smedium"
            >
              {change ? (isPositive ? `↑` : `↓`) : ''} {change}
            </Text>
          )}
        </Text>
      </Row>
    </Row>
  );
};

export default magicMemo(UnderlyingAssetCoinRow, ['change', 'name']);
