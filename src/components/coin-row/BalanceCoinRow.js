import { supportedNativeCurrencies } from 'balance-common';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import Piwik from 'react-native-matomo';
import { compose, shouldUpdate, withHandlers } from 'recompact';
import { withAccountSettings } from '../../hoc';
import { colors } from '../../styles';
import { isNewValueForPath } from '../../utils';
import { ButtonPressAnimation } from '../buttons';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const formatPercentageString = percentString => (
  percentString
    ? percentString.split('-').join('- ').split('%').join(' %')
    : '-'
);

const BalanceCoinRow = ({
  item,
  nativeCurrency,
  onPress,
  ...props,
}) => (
  <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
    <CoinRow
      {...item}
      {...props}
      bottomRowRender={({ balance, symbol, native }) => {
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
      }}
      topRowRender={({ name, native }) => {
        const nativeDisplay = get(native, 'balance.display');
        const currencySymbol = supportedNativeCurrencies[nativeCurrency].symbol;

        return (
          <Fragment>
            <CoinName>{name}</CoinName>
            <BalanceText color={nativeDisplay ? null : colors.blueGreyLight}>
              {nativeDisplay || `${currencySymbol}0.00`}
            </BalanceText>
          </Fragment>
        );
      }}
    />
  </ButtonPressAnimation>
);

BalanceCoinRow.propTypes = {
  item: PropTypes.object,
  nativeCurrency: PropTypes.string.isRequired,
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
        Piwik.trackEvent('BalanceCoinRow', 'view-expanded', 'OpenBalanceCoinRow');
        onPress(item);
      }
    },
  }),
)(BalanceCoinRow);
