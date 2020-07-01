import { get } from 'lodash';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { View } from 'react-primitives';
import { compose } from 'recompact';
import styled, { css } from 'styled-components/primitives';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import {
  withCoinListEdited,
  withCoinRecentlyPinned,
  withEditOptions,
  withOpenBalances,
} from '../../hoc';
import { isNewValueForObjectPaths, isNewValueForPath } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Column, FlexItem } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinCheckButton from './CoinCheckButton';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import { colors } from '@rainbow-me/styles';

const editTranslateOffset = 32;
const AssetSheetHeight = 400;

const formatPercentageString = percentString =>
  percentString ? percentString.split('-').join('- ') : '-';

const containerExpandedStyles = css`
  padding-bottom: 0;
  padding-top: 0;
`;

const BalanceCoinRowCoinCheckButton = styled(CoinCheckButton).attrs({
  isAbsolute: true,
})`
  top: ${({ top }) => top};
`;

const Content = styled(ButtonPressAnimation)`
  padding-left: ${({ isEditMode }) => (isEditMode ? editTranslateOffset : 0)};
`;

const PercentageText = styled(BottomRowText).attrs({
  align: 'right',
})`
  ${({ isPositive }) => (isPositive ? `color: ${colors.green};` : null)};
`;

const BottomRow = ({ balance, isExpandedState, native }) => {
  const percentChange = get(native, 'change');
  const percentageChangeDisplay = formatPercentageString(percentChange);

  const isPositive =
    !isExpandedState &&
    percentChange &&
    percentageChangeDisplay.charAt(0) !== '-';

  return (
    <Fragment>
      <FlexItem flex={1}>
        <BottomRowText weight={isExpandedState ? 'medium' : 'regular'}>
          {get(balance, 'display', '')}
        </BottomRowText>
      </FlexItem>
      {!isExpandedState && (
        <View>
          <PercentageText isPositive={isPositive}>
            {percentageChangeDisplay}
          </PercentageText>
        </View>
      )}
    </Fragment>
  );
};

const TopRow = ({ isExpandedState, name, native, nativeCurrencySymbol }) => {
  const nativeDisplay = get(native, 'balance.display');

  return (
    <Fragment>
      <FlexItem flex={1}>
        <CoinName weight={isExpandedState ? 'semibold' : 'regular'}>
          {name}
        </CoinName>
      </FlexItem>
      <View>
        <BalanceText
          color={nativeDisplay ? null : colors.blueGreyLight}
          numberOfLines={1}
          weight={isExpandedState ? 'medium' : 'regular'}
        >
          {nativeDisplay || `${nativeCurrencySymbol}0.00`}
        </BalanceText>
      </View>
    </Fragment>
  );
};

const BalanceCoinRow = ({
  containerStyles,
  firstCoinRowMarginTop,
  isCoinListEdited,
  isExpandedState,
  isFirstCoinRow,
  item,
  onPress,
  pushSelectedCoin,
  recentlyPinnedCount,
  removeSelectedCoin,
  ...props
}) => {
  const [toggle, setToggle] = useState(false);
  const [previousPinned, setPreviousPinned] = useState(0);
  const firstCoinRowCoinCheckMarginTop = firstCoinRowMarginTop + 9;

  useEffect(() => {
    if (toggle && (recentlyPinnedCount > previousPinned || !isCoinListEdited)) {
      setPreviousPinned(recentlyPinnedCount);
      setToggle(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCoinListEdited, recentlyPinnedCount]);

  const handleEditModePress = useCallback(() => {
    if (toggle) {
      removeSelectedCoin(item.uniqueId);
    } else {
      pushSelectedCoin(item.uniqueId);
    }
    setToggle(!toggle);
  }, [item.uniqueId, pushSelectedCoin, removeSelectedCoin, setToggle, toggle]);

  const handlePress = useCallback(() => {
    onPress && onPress(item, { longFormHeight: AssetSheetHeight });
  }, [onPress, item]);

  return (
    <Column flex={1} justify={isFirstCoinRow ? 'end' : 'start'}>
      <Content
        disabled={isExpandedState}
        isEditMode={isCoinListEdited}
        onPress={isCoinListEdited ? handleEditModePress : handlePress}
        scaleTo={0.96}
      >
        <CoinRow
          containerStyles={
            isExpandedState ? containerExpandedStyles : containerStyles
          }
          isExpandedState={isExpandedState}
          bottomRowRender={BottomRow}
          topRowRender={TopRow}
          {...item}
          {...props}
        />
      </Content>
      {isCoinListEdited ? (
        <BalanceCoinRowCoinCheckButton
          onPress={handleEditModePress}
          toggle={toggle}
          top={isFirstCoinRow ? firstCoinRowCoinCheckMarginTop : 9}
        />
      ) : null}
    </Column>
  );
};

const arePropsEqual = (prev, next) => {
  const itemIdentifier = buildAssetUniqueIdentifier(prev.item);
  const nextItemIdentifier = buildAssetUniqueIdentifier(next.item);

  const isNewItem = itemIdentifier === nextItemIdentifier;

  const isNewRecentlyPinnedCount =
    !isNewValueForPath(prev, next, 'recentlyPinnedCount') &&
    (get(next, 'item.isPinned', true) || get(next, 'item.isHidden', true));

  return (
    isNewItem &&
    isNewRecentlyPinnedCount &&
    !isNewValueForObjectPaths(prev, next, [
      'isCoinListEdited',
      'isFirstCoinRow',
      'item.isHidden',
      'item.isPinned',
      'openSmallBalances',
    ])
  );
};

const MemoizedBalanceCoinRow = React.memo(BalanceCoinRow, arePropsEqual);

export default compose(
  withOpenBalances,
  withEditOptions,
  withCoinListEdited,
  withCoinRecentlyPinned
)(MemoizedBalanceCoinRow);
