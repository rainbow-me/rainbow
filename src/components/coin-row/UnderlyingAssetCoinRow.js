import React, { Fragment } from 'react';
import { magicMemo } from '../../utils';
import { CoinIcon } from '../coin-icon';
import { Centered, Row } from '../layout';
import { Text } from '../text';

const UnderlyingCoinIconSize = 20;

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
            size={UnderlyingCoinIconSize}
            symbol={symbol}
          />
        </Centered>
        <Row>
          <Text
            color={colors.alpha(colors.blueGreyDark, 0.7)}
            size="large"
            weight="medium"
          >
            {name}{' '}
            <Text
              color={isPositive ? colors.green : colors.brightRed}
              letterSpacing="roundedTight"
              size="smedium"
            >
              {isPositive ? `↑` : `↓`} {change}
            </Text>
          </Text>
        </Row>
      </Row>
    </Fragment>
  );
};

export default magicMemo(UnderlyingAssetCoinRow, ['change', 'name', 'price']);
