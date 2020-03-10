import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { compose } from 'recompact';
import styled from 'styled-components/primitives';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import {
  withCoinListEdited,
  withCoinRecentlyPinned,
  withEditOptions,
  withOpenBalances,
} from '../../hoc';
import { useDimensions } from '../../hooks';
import { colors } from '../../styles';
import { isNewValueForPath } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Column, FlexItem, Row } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinCheckButton from './CoinCheckButton';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const editTranslateOffset = 32;

const BalanceCoinRowExpandedStyles = `
  padding-bottom: 0;
  padding-top: 0;
`;

const PercentageText = styled(BottomRowText).attrs({
  align: 'right',
})`
  ${({ isPositive }) => (isPositive ? `color: ${colors.green};` : null)};
  margin-bottom: 0.5;
`;

const formatPercentageString = percentString =>
  percentString ? percentString.split('-').join('- ') : '-';

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
        <BottomRowText>{get(balance, 'display', '')}</BottomRowText>
      </FlexItem>
      {!isExpandedState && (
        <FlexItem flex={0}>
          <PercentageText isPositive={isPositive}>
            {percentageChangeDisplay}
          </PercentageText>
        </FlexItem>
      )}
    </Fragment>
  );
};

BottomRow.propTypes = {
  balance: PropTypes.shape({ display: PropTypes.string }),
};

const TopRow = ({ isExpandedState, name, native, nativeCurrencySymbol }) => {
  const nativeDisplay = get(native, 'balance.display');

  return (
    <Row align="center" justify="space-between">
      <FlexItem flex={1}>
        <CoinName weight={isExpandedState ? 'semibold' : 'regular'}>
          {name}
        </CoinName>
      </FlexItem>
      <FlexItem flex={0}>
        <BalanceText
          color={nativeDisplay ? null : colors.blueGreyLight}
          numberOfLines={1}
          weight={isExpandedState ? 'medium' : 'regular'}
        >
          {nativeDisplay || `${nativeCurrencySymbol}0.00`}
        </BalanceText>
      </FlexItem>
    </Row>
  );
};

TopRow.propTypes = {
  name: PropTypes.string,
};

const BalanceCoinRow = ({
  containerStyles,
  // firstCoinRowMarginTop,
  isCoinListEdited,
  isExpandedState,
  isFirstCoinRow,
  item,
  onPress,
  onPressSend,
  pushSelectedCoin,
  recentlyPinnedCount,
  removeSelectedCoin,
  ...props
}) => {
  const { width: deviceWidth } = useDimensions();
  const [toggle, setToggle] = useState(false);
  const [previousPinned, setPreviousPinned] = useState(0);

  useEffect(() => {
    if (toggle && (recentlyPinnedCount > previousPinned || !isCoinListEdited)) {
      setPreviousPinned(recentlyPinnedCount);
      setToggle(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCoinListEdited, recentlyPinnedCount]);

  const handlePress = useCallback(() => {
    if (toggle) {
      removeSelectedCoin(item.uniqueId);
    } else {
      pushSelectedCoin(item.uniqueId);
    }
    setToggle(!toggle);
  }, [item.uniqueId, pushSelectedCoin, removeSelectedCoin, setToggle, toggle]);

  const onPressHandler = useCallback(() => {
    onPress && onPress(item);
  }, [onPress, item]);

  const onPressSendHandler = useCallback(() => {
    onPressSend && onPressSend(item);
  }, [onPressSend, item]);

  return (
    <Column flex={1} justify={isFirstCoinRow ? 'end' : 'start'}>
      <ButtonPressAnimation
        disabled={isExpandedState}
        onPress={isCoinListEdited ? handlePress : onPressHandler}
        scaleTo={0.96}
      >
        <View
          left={isCoinListEdited ? editTranslateOffset : 0}
          width={deviceWidth - (isCoinListEdited ? editTranslateOffset : 0)}
        >
          <CoinRow
            containerStyles={
              isExpandedState ? BalanceCoinRowExpandedStyles : containerStyles
            }
            isExpandedState={isExpandedState}
            onPress={onPressHandler}
            onPressSend={onPressSendHandler}
            bottomRowRender={BottomRow}
            topRowRender={TopRow}
            {...item}
            {...props}
          />
        </View>
      </ButtonPressAnimation>
      {isCoinListEdited ? (
        <CoinCheckButton toggle={toggle} onPress={handlePress} />
      ) : null}
    </Column>
  );
};

BalanceCoinRow.propTypes = {
  containerStyles: PropTypes.string,
  isExpandedState: PropTypes.bool,
  isFirstCoinRow: PropTypes.bool,
  item: PropTypes.object,
  onPress: PropTypes.func,
  onPressSend: PropTypes.func,
  openSmallBalances: PropTypes.bool,
};

const arePropsEqual = (props, nextProps) => {
  const isChangeInOpenAssets =
    props.openSmallBalances !== nextProps.openSmallBalances;
  const itemIdentifier = buildAssetUniqueIdentifier(props.item);
  const nextItemIdentifier = buildAssetUniqueIdentifier(nextProps.item);

  const isNewItem = itemIdentifier !== nextItemIdentifier;
  const isEdited = isNewValueForPath(props, nextProps, 'isCoinListEdited');
  const isPinned = isNewValueForPath(props, nextProps, 'item.isPinned');
  const isHidden = isNewValueForPath(props, nextProps, 'item.isHidden');
  const isFirst = isNewValueForPath(props, nextProps, 'isFirstCoinRow');
  const recentlyPinnedCount =
    isNewValueForPath(props, nextProps, 'recentlyPinnedCount') &&
    (get(props, 'item.isPinned', false) || get(props, 'item.isHidden', false));

  return !(
    isNewItem ||
    isChangeInOpenAssets ||
    isEdited ||
    isPinned ||
    isHidden ||
    isFirst ||
    recentlyPinnedCount
  );
};

export default React.memo(
  compose(
    withOpenBalances,
    withEditOptions,
    withCoinListEdited,
    withCoinRecentlyPinned
  )(BalanceCoinRow),
  arePropsEqual
);
