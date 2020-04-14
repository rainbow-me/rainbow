import { withSafeTimeout } from '@hocs/safe-timers';
import { get, isNumber } from 'lodash';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import React, { Fragment, PureComponent } from 'react';
import { compose, withProps } from 'recompact';
import { withAccountSettings, withOpenBalances } from '../../hoc';
import { OpacityToggler } from '../animations';
import CoinDivider from './CoinDivider';
import { convertAmountToNativeDisplay } from '../../helpers/utilities';

class SmallBalancesWrapper extends PureComponent {
  static propTypes = {
    assets: PropTypes.array,
    balancesSum: PropTypes.string,
    openSmallBalances: PropTypes.bool,
    setOpenSmallBalances: PropTypes.func,
  };

  state = { areChildrenVisible: true };

  handlePress = () =>
    this.props.setOpenSmallBalances(!this.props.openSmallBalances);

  render = () => {
    const { assets, balancesSum, openSmallBalances } = this.props;

    return (
      <Fragment>
        <CoinDivider
          balancesSum={balancesSum}
          onPress={this.handlePress}
          openSmallBalances={openSmallBalances}
        />
        <View pointerEvents={openSmallBalances ? 'auto' : 'none'}>
          <OpacityToggler
            endingOpacity={1}
            isVisible={openSmallBalances}
            startingOpacity={0}
          >
            {assets}
          </OpacityToggler>
        </View>
      </Fragment>
    );
  };
}

const getBalanceFromAsset = asset =>
  Number(get(asset, 'props.item.native.balance.amount', 0));
const reduceBalances = (accumulator, currentValue) => {
  const balance = getBalanceFromAsset(currentValue);
  const sum = isNumber(accumulator)
    ? accumulator
    : getBalanceFromAsset(accumulator);
  return sum + balance;
};

export default compose(
  withAccountSettings,
  withOpenBalances,
  withSafeTimeout,
  withProps(({ assets, nativeCurrency }) => {
    const balance = assets.reduce(reduceBalances, 0);
    return isNumber(balance)
      ? {
          balancesSum: `${convertAmountToNativeDisplay(
            balance,
            nativeCurrency
          )}`,
        }
      : {};
  })
)(SmallBalancesWrapper);
