import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { compose, shouldUpdate, withHandlers } from 'recompact';
import { withAccountSettings } from '../../hoc';
import { colors } from '../../styles';
import { isNewValueForPath } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { FlexItem, Row } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const formatPercentageString = percentString => (
  percentString
    ? percentString.split('-').join('- ').split('%').join(' %')
    : '-'
);
const BottomRow = ({ balance, native }) => {
  const percentChange = get(native, 'change.display');
  const percentageChangeDisplay = formatPercentageString(percentChange);
  const isPositive = (percentChange && (percentageChangeDisplay.charAt(0) !== '-'));

  return (
    <Fragment>
      <BottomRowText>{balance.display}</BottomRowText>
      <BottomRowText color={isPositive ? colors.seaGreen : null}>
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
        <BalanceText color={nativeDisplay ? null : colors.blueGreyLight}>
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
  item,
  onPress,
  ...props
}) => (
  <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
    <CoinRow
      {...item}
      {...props}
      bottomRowRender={BottomRow}
      topRowRender={TopRow}
    />
  </ButtonPressAnimation>
);

BalanceCoinRow.propTypes = {
  item: PropTypes.object,
  nativeCurrency: PropTypes.string.isRequired,
  onPress: PropTypes.func,
};

export default compose(
  withAccountSettings,
  shouldUpdate((...props) => {
    const isNewNativeCurrency = isNewValueForPath(...props, 'nativeCurrency');
    const isNewNativePrice = isNewValueForPath(...props, 'item.native.price.display');
    const isNewTokenBalance = isNewValueForPath(...props, 'item.balance.amount');

    return isNewNativeCurrency || isNewNativePrice || isNewTokenBalance;
  }),
  withHandlers({
    onPress: ({ item, onPress }) => () => {
      if (onPress) {
        onPress(item);
      }
    },
  }),
)(BalanceCoinRow);
