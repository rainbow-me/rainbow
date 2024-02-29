import React, { Fragment, useCallback } from 'react';
import { ButtonPressAnimation } from '../animations';
import { CoinIconSize } from '../coin-icon';
import { Centered, FlexItem, Row } from '../layout';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import { useAccountSettings } from '@/hooks';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { ethereumUtils, magicMemo } from '@/utils';

const CoinRowPaddingTop = 9;
const CoinRowPaddingBottom = 10;

const PercentageText = styled(BottomRowText).attrs({
  weight: 'medium',
})(({ isPositive, theme: { colors } }) => ({
  color: isPositive ? colors.green : colors.red,
}));

const BottomRowContainer = ios ? Fragment : styled(Row).attrs({ marginBottom: 10, marginTop: ios ? -10 : 0 })({});

const containerStyles = padding.object(CoinRowPaddingTop, 38, CoinRowPaddingBottom, 15);

const BottomRow = ({ native }) => {
  const percentChange = native?.change;
  const isPositive = percentChange && percentChange.charAt(0) !== '-';

  const formatPercentageString = percentString => (isPositive ? '+' + percentString : percentString);
  const percentageChangeDisplay = formatPercentageString(percentChange);

  return (
    <BottomRowContainer>
      <FlexItem flex={1}>
        <BottomRowText weight="medium">
          {native?.price?.display} <PercentageText isPositive={isPositive}>{percentageChangeDisplay}</PercentageText>
        </BottomRowText>
      </FlexItem>
    </BottomRowContainer>
  );
};

const TopRow = ({ name, showBalance }) => {
  return (
    <Centered height={showBalance ? CoinIconSize : null}>
      <CoinName>{name}</CoinName>
    </Centered>
  );
};

const ListCoinRow = ({ item, onPress }) => {
  const { nativeCurrency } = useAccountSettings();
  const handlePress = useCallback(() => onPress(item), [item, onPress]);
  const formattedItem = useMemo(() => {
    if (item?.native?.price) return item;
    return ethereumUtils.formatGenericAsset(item, nativeCurrency);
  }, [item, nativeCurrency]);
  return (
    <ButtonPressAnimation
      height={CoinIconSize + CoinRowPaddingTop + CoinRowPaddingBottom}
      onPress={handlePress}
      scaleTo={0.96}
      testID={`list-coin-row-${item.name}`}
      throttle
    >
      <CoinRow {...formattedItem} bottomRowRender={BottomRow} containerStyles={containerStyles} showBalance={false} topRowRender={TopRow} />
    </ButtonPressAnimation>
  );
};

export default magicMemo(ListCoinRow, ['change', 'name', 'native']);
