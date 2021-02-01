import React, { Fragment } from 'react';
import { magicMemo } from '../../utils';
import { CoinIcon } from '../coin-icon';
import { Centered, Row } from '../layout';
import { Text } from '../text';

const TopMoverCoinIconSize = 20;

const UnderlyingAssetCoinRow = ({
  address,
  change,
  isPositive,
  name,
  symbol,
}) => {
  const { colors } = useTheme();
  return (
    <Fragment>
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
    </Fragment>
  );
};

export default magicMemo(UnderlyingAssetCoinRow, ['change', 'name', 'price']);
