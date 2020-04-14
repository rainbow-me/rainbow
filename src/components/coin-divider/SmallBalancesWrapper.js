import { withSafeTimeout } from '@hocs/safe-timers';
import { get, isNumber } from 'lodash';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import React, { Fragment, PureComponent } from 'react';
import { compose, withProps } from 'recompact';
import {
  withAccountSettings,
  withCoinListEdited,
  withOpenBalances,
  withEditOptions,
} from '../../hoc';
import { OpacityToggler } from '../animations';

class SmallBalancesWrapper extends PureComponent {
  static propTypes = {
    assets: PropTypes.array,
    isCoinListEdited: PropTypes.bool,
    openSmallBalances: PropTypes.bool,
    setOpenSmallBalances: PropTypes.func,
  };

  state = { areChildrenVisible: true };

  handlePress = () =>
    this.props.setOpenSmallBalances(!this.props.openSmallBalances);

  render = () => {
    const {
      assets,
      checkList,
      openSmallBalances,
      isCoinListEdited,
    } = this.props;

    return (
      <Fragment>
        <OpacityToggler
          endingOpacity={1}
          isVisible={openSmallBalances}
          startingOpacity={0}
        >
          <View
            marginTop={13}
            pointerEvents={openSmallBalances ? 'auto' : 'none'}
          >
            <View
              style={{
                opacity: openSmallBalances ? 1 : 0,
                position: 'absolute',
              }}
            >
              {assets}
              <View
                pointerEvents={isCoinListEdited ? 'auto' : 'none'}
                style={{
                  opacity: isCoinListEdited ? 1 : 0,
                  position: 'absolute',
                }}
              >
                {checkList}
              </View>
            </View>
          </View>
        </OpacityToggler>
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
  withEditOptions,
  withCoinListEdited,
  withProps(({ assets, nativeCurrencySymbol }) => {
    const balance = assets.reduce(reduceBalances, 0);
    return isNumber(balance)
      ? { balancesSum: `${nativeCurrencySymbol}${balance.toFixed(2)}` }
      : {};
  })
)(SmallBalancesWrapper);
