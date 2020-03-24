import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { compose, shouldUpdate, withHandlers } from 'recompact';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import { withAccountSettings, withOpenBalances } from '../../hoc';
import { colors } from '../../styles';
import { isNewValueForPath } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { FlexItem, Row } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const formatPercentageString = percentString =>
  percentString
    ? percentString
        .split('-')
        .join('- ')
        .split('%')
        .join('%')
    : '-';

const BottomRow = ({ balance, native }) => {
  const percentChange = get(native, 'change');
  const percentageChangeDisplay = formatPercentageString(percentChange);
  const isPositive = percentChange && percentageChangeDisplay.charAt(0) !== '-';

  return (
    <Fragment>
      <BottomRowText>{balance.display}</BottomRowText>
      <BottomRowText
        align="right"
        color={
          isPositive
            ? colors.green
            : !percentChange
            ? colors.alpha(colors.blueGreyDark, 0.2)
            : null
        }
      >
        {percentageChangeDisplay}
      </BottomRowText>
    </Fragment>
  );
};

BottomRow.propTypes = {
  balance: PropTypes.shape({ display: PropTypes.string }),
  native: PropTypes.object,
};

const TopRow = ({ name, native, nativeCurrencySymbol }) => {
  const nativeDisplay = get(native, 'balance.display');

  return (
    <Row align="center" justify="space-between">
      <FlexItem flex={1}>
        <CoinName>{name}</CoinName>
      </FlexItem>
      <FlexItem flex={0}>
        <BalanceText
          color={nativeDisplay ? null : colors.alpha(colors.blueGreyDark, 0.5)}
        >
          {nativeDisplay || `${nativeCurrencySymbol}0.00`}
        </BalanceText>
      </FlexItem>
    </Row>
  );
};

TopRow.propTypes = {
  name: PropTypes.string,
  native: PropTypes.object,
  nativeCurrencySymbol: PropTypes.string,
};

const BalanceCoinRow = ({
  isFirstCoinRow,
  item,
  onPress,
  onPressSend,
  ...props
}) =>
  isFirstCoinRow ? (
    <FlexItem
      flex={1}
      style={{
        justifyContent: 'flex-end',
      }}
    >
      <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
        <CoinRow
          onPress={onPress}
          onPressSend={onPressSend}
          {...item}
          {...props}
          bottomRowRender={BottomRow}
          topRowRender={TopRow}
        />
      </ButtonPressAnimation>
    </FlexItem>
  ) : (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
      <CoinRow
        onPress={onPress}
        onPressSend={onPressSend}
        {...item}
        {...props}
        bottomRowRender={BottomRow}
        topRowRender={TopRow}
      />
    </ButtonPressAnimation>
  );

BalanceCoinRow.propTypes = {
  isFirstCoinRow: PropTypes.bool,
  item: PropTypes.object,
  nativeCurrency: PropTypes.string.isRequired,
  onPress: PropTypes.func,
  onPressSend: PropTypes.func,
  openSmallBalances: PropTypes.bool,
};

export default compose(
  withAccountSettings,
  withOpenBalances,
  withHandlers({
    onPress: ({ item, onPress }) => () => {
      if (onPress) {
        onPress(item);
      }
    },
    onPressSend: ({ item, onPressSend }) => () => {
      if (onPressSend) {
        onPressSend(item);
      }
    },
  }),
  shouldUpdate((props, nextProps) => {
    const isChangeInOpenAssets =
      props.openSmallBalances !== nextProps.openSmallBalances;
    const itemIdentifier = buildAssetUniqueIdentifier(props.item);
    const nextItemIdentifier = buildAssetUniqueIdentifier(nextProps.item);

    const isNewItem = itemIdentifier !== nextItemIdentifier;
    const isNewNativeCurrency = isNewValueForPath(
      props,
      nextProps,
      'nativeCurrency'
    );

    return isNewItem || isNewNativeCurrency || isChangeInOpenAssets;
  })
)(BalanceCoinRow);
