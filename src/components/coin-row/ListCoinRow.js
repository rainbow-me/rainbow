import { get } from 'lodash';
import React, { Fragment, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { CoinIconSize } from '../coin-icon';
import { Centered, FlexItem, Row } from '../layout';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import { padding } from '@rainbow-me/styles';
import { neverRerender } from '@rainbow-me/utils';

const CoinRowPaddingTop = 9.5;
const CoinRowPaddingBottom = 9.5;

const PercentageText = styled(BottomRowText).attrs({
  align: 'left',
})`
  ${({ isPositive, theme: { colors } }) =>
    isPositive ? `color: ${colors.green};` : null};
`;

const BottomRowContainer = ios
  ? Fragment
  : styled(Row).attrs({ marginBottom: 10, marginTop: ios ? -10 : 0 })``;

const formatPercentageString = percentString =>
  percentString ? percentString.split('-').join('- ') : '-';

const BottomRow = ({ native, symbol }) => {
  const percentChange = get(native, 'change');
  const percentageChangeDisplay = formatPercentageString(percentChange);

  const isPositive = percentChange && percentageChangeDisplay.charAt(0) !== '-';

  return (
    <BottomRowContainer>
      <FlexItem flex={1}>
        <BottomRowText>
          {symbol}{' '}
          <PercentageText isPositive={isPositive}>
            {percentageChangeDisplay}
          </PercentageText>
        </BottomRowText>
      </FlexItem>
    </BottomRowContainer>
  );
};

const TopRow = ({ name, showBalance }) => (
  <Centered height={showBalance ? CoinIconSize : null}>
    <CoinName>{name}</CoinName>
  </Centered>
);

const ListCoinRow = ({ item, onPress }) => {
  const handlePress = useCallback(() => onPress(item), [item, onPress]);

  return (
    <>
      <ButtonPressAnimation
        height={CoinIconSize + CoinRowPaddingTop + CoinRowPaddingBottom}
        onPress={handlePress}
        scaleTo={0.96}
        throttle
      >
        <CoinRow
          {...item}
          bottomRowRender={BottomRow}
          containerStyles={css(
            padding(CoinRowPaddingTop, 38, CoinRowPaddingBottom, 15)
          )}
          showBalance={false}
          testID="list-coin-row"
          topRowRender={TopRow}
        />
      </ButtonPressAnimation>
    </>
  );
};

export default neverRerender(ListCoinRow);
