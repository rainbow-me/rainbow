import { get } from 'lodash';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import Animated from 'react-native-reanimated';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { View } from 'react-primitives';
import { connect } from 'react-redux';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../expanded-state/asset/ChartExpandedState... Remove this comment to see the full error message
import { initialChartExpandedStateSheetHeight } from '../expanded-state/asset/ChartExpandedState';
import { Column, FlexItem, Row } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinCheckButton' was resolved to '/Users... Remove this comment to see the full error message
import CoinCheckButton from './CoinCheckButton';
import CoinName from './CoinName';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinRow' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
import CoinRow from './CoinRow';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/assets' or... Remove this comment to see the full error message
import { buildAssetUniqueIdentifier } from '@rainbow-me/helpers/assets';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useCoinListEdited } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks/useCoinListE... Remove this comment to see the full error message
import { useCoinListEditedValue } from '@rainbow-me/hooks/useCoinListEdited';
import {
  pushSelectedCoin,
  removeSelectedCoin,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/editOptions'... Remove this comment to see the full error message
} from '@rainbow-me/redux/editOptions';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { isNewValueForObjectPaths, isNewValueForPath } from '@rainbow-me/utils';

const editTranslateOffset = 37;

const formatPercentageString = (percentString: any) =>
  percentString ? percentString.split('-').join('- ') : '-';

const BalanceCoinRowCoinCheckButton = styled(CoinCheckButton).attrs({
  isAbsolute: true,
})`
  top: ${({ top }) => top};
`;

const PercentageText = styled(BottomRowText).attrs({
  align: 'right',
})`
  color: ${({ isPositive, theme: { colors } }) =>
    isPositive ? colors.green : colors.alpha(colors.blueGreyDark, 0.5)};
`;

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
const BottomRowContainer = ios
  ? Fragment
  : styled(Row).attrs({ marginBottom: 10, marginTop: -10 })``;

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
const TopRowContainer = ios
  ? Fragment
  : styled(Row).attrs({
      align: 'flex-start',
      justify: 'flex-start',
      marginTop: 0,
    })``;

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
const PriceContainer = ios
  ? View
  : styled(View)`
      margin-top: -3;
      margin-bottom: 3;
    `;

const BottomRow = ({ balance, native }: any) => {
  const { colors } = useTheme();
  const percentChange = get(native, 'change');
  const percentageChangeDisplay = formatPercentageString(percentChange);

  const isPositive = percentChange && percentageChangeDisplay.charAt(0) !== '-';

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
        <BottomRowText color={colors.alpha(colors.blueGreyDark, 0.5)}>
          {get(balance, 'display', '')}
        </BottomRowText>
      </FlexItem>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <View>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <PercentageText isPositive={isPositive}>
          {percentageChangeDisplay}
        </PercentageText>
      </View>
    </BottomRowContainer>
  );
};

const TopRow = ({ name, native, nativeCurrencySymbol }: any) => {
  const nativeDisplay = get(native, 'balance.display');
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <TopRowContainer>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <FlexItem flex={1}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <CoinName>{name}</CoinName>
      </FlexItem>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <PriceContainer>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <BalanceText
          color={nativeDisplay ? colors.dark : colors.blueGreyLight}
          numberOfLines={1}
        >
          {nativeDisplay || `${nativeCurrencySymbol}0.00`}
        </BalanceText>
      </PriceContainer>
    </TopRowContainer>
  );
};

const BalanceCoinRow = ({
  containerStyles,
  isFirstCoinRow,
  item,
  onPress,
  pushSelectedCoin,
  recentlyPinnedCount,
  removeSelectedCoin,
  ...props
}: any) => {
  const [toggle, setToggle] = useState(false);
  const [previousPinned, setPreviousPinned] = useState(0);
  const { isCoinListEdited } = useCoinListEdited();
  const isCoinListEditedValue = useCoinListEditedValue();
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
    if (isCoinListEdited) {
      handleEditModePress();
    } else {
      onPress?.(item, {
        longFormHeight: initialChartExpandedStateSheetHeight,
      });
    }
  }, [handleEditModePress, isCoinListEdited, item, onPress]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Column flex={1} justify={isFirstCoinRow ? 'end' : 'start'}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Animated.View
        style={{
          paddingLeft: Animated.multiply(
            editTranslateOffset,
            isCoinListEditedValue
          ),
        }}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ButtonPressAnimation
          onPress={handlePress}
          scaleTo={0.96}
          testID={`balance-coin-row-${item.name}`}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Animated.View>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <CoinRow
              bottomRowRender={BottomRow}
              containerStyles={containerStyles}
              isFirstCoinRow={isFirstCoinRow}
              onPress={handlePress}
              topRowRender={TopRow}
              {...item}
              {...props}
            />
          </Animated.View>
        </ButtonPressAnimation>
      </Animated.View>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Animated.View
        style={{
          marginLeft: Animated.multiply(
            -editTranslateOffset * 1.5,
            Animated.sub(1, isCoinListEditedValue)
          ),
          position: 'absolute',
        }}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <BalanceCoinRowCoinCheckButton
          isHidden={item.isHidden}
          isPinned={item.isPinned}
          onPress={handleEditModePress}
          pointerEvents={isCoinListEdited ? 'auto' : 'none'}
          toggle={toggle}
          top={isFirstCoinRow ? -50 : 9}
        />
      </Animated.View>
    </Column>
  );
};

const arePropsEqual = (prev: any, next: any) => {
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

export default connect(
  ({
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'editOptions' does not exist on type 'Def... Remove this comment to see the full error message
    editOptions: { recentlyPinnedCount },
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'openStateSettings' does not exist on typ... Remove this comment to see the full error message
    openStateSettings: { openSmallBalances },
  }) => ({
    openSmallBalances,
    recentlyPinnedCount,
  }),
  {
    pushSelectedCoin,
    removeSelectedCoin,
  }
)(MemoizedBalanceCoinRow);
