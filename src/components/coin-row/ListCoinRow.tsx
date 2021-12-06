import { get } from 'lodash';
import React, { Fragment, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { CoinIconSize } from '../coin-icon';
import { Centered, FlexItem, Row } from '../layout';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinRow' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
import CoinRow from './CoinRow';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils, magicMemo } from '@rainbow-me/utils';

const CoinRowPaddingTop = 9;
const CoinRowPaddingBottom = 10;

const PercentageText = styled(BottomRowText).attrs({
  weight: 'medium',
})`
  ${({ isPositive, theme: { colors } }) =>
    isPositive ? `color: ${colors.green};` : `color: ${colors.red}`};
`;

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
const BottomRowContainer = ios
  ? Fragment
  : // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    styled(Row).attrs({ marginBottom: 10, marginTop: ios ? -10 : 0 })``;

const BottomRow = ({ native }: any) => {
  const percentChange = get(native, 'change');
  const isPositive = percentChange && percentChange.charAt(0) !== '-';

  const formatPercentageString = (percentString: any) =>
    isPositive ? '+' + percentString : percentString;
  const percentageChangeDisplay = formatPercentageString(percentChange);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <BottomRowContainer>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <FlexItem flex={1}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <BottomRowText weight="medium">
          {native?.price?.display} // @ts-expect-error ts-migrate(17004) FIXME:
          Cannot use JSX unless the '--jsx' flag is provided... Remove this
          comment to see the full error message
          <PercentageText isPositive={isPositive}>
            {percentageChangeDisplay}
          </PercentageText>
        </BottomRowText>
      </FlexItem>
    </BottomRowContainer>
  );
};

const TopRow = ({ name, showBalance }: any) => {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Centered height={showBalance ? CoinIconSize : null}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <CoinName>{name}</CoinName>
    </Centered>
  );
};

const ListCoinRow = ({ item, onPress }: any) => {
  const { nativeCurrency } = useAccountSettings();
  const handlePress = useCallback(() => onPress(item), [item, onPress]);
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const formattedItem = useMemo(() => {
    if (item?.native?.price) return item;
    return ethereumUtils.formatGenericAsset(item, nativeCurrency);
  }, [item, nativeCurrency]);
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      height={CoinIconSize + CoinRowPaddingTop + CoinRowPaddingBottom}
      onPress={handlePress}
      scaleTo={0.96}
      testID={`list-coin-row-${item.name}`}
      throttle
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <CoinRow
        {...formattedItem}
        bottomRowRender={BottomRow}
        containerStyles={css(
          padding(CoinRowPaddingTop, 38, CoinRowPaddingBottom, 15)
        )}
        showBalance={false}
        topRowRender={TopRow}
      />
    </ButtonPressAnimation>
  );
};

export default magicMemo(ListCoinRow, ['change', 'name', 'native']);
