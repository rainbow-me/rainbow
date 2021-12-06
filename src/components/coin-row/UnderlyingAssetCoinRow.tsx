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
}: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Row marginBottom={19}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered marginRight={6}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <CoinIcon
          address={address}
          size={UnderlyingCoinIconSize}
          symbol={symbol}
        />
      </Centered>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Row>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <CoinName
          color={changeVisible ? colors.alpha(colors.blueGreyDark, 0.7) : color}
        >
          {name}{' '}
          {changeVisible && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(UnderlyingAssetCoinRow, ['change', 'name']);
