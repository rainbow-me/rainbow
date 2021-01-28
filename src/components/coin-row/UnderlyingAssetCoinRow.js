import React, { useCallback } from 'react';
import { colors } from '../../styles';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Centered, Row } from '../layout';
import { Text } from '../text';

const TopMoverCoinIconSize = 20;

const UnderlyingAssetCoinRow = ({
  address,
  change,
  isPositive,
  name,
  onPress,
  price,
  symbol,
}) => {
  const handlePress = useCallback(() => {
    onPress?.({ address, change, name, price, symbol });
  }, [address, change, name, onPress, price, symbol]);

  return (
    <ButtonPressAnimation onPress={handlePress}>
      <Row marginBottom={19}>
        <Centered marginRight={6}>
          <CoinIcon
            address={address}
            size={TopMoverCoinIconSize}
            symbol={symbol}
          />
        </Centered>
        <Row>
          <Text color={colors.alpha(colors.blueGreyDark, 0.8)} size="large">
            {name}{' '}
            <Text color={isPositive ? colors.green : colors.red} size="lmedium">
              {isPositive ? `↑` : `↓`} {change}
            </Text>
          </Text>
        </Row>
      </Row>
    </ButtonPressAnimation>
  );
};

export default magicMemo(UnderlyingAssetCoinRow, ['change', 'name', 'price']);
