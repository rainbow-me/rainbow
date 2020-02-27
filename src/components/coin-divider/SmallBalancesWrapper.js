import { withSafeTimeout } from '@hocs/safe-timers';
import { get, isNumber } from 'lodash';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import React, { Fragment, PureComponent } from 'react';
import { compose, withProps } from 'recompact';
import {
  withAccountSettings,
  withOpenBalances,
  withEditOptions,
} from '../../hoc';
import { OpacityToggler } from '../animations';
import CoinDivider from './CoinDivider';
import TransitionToggler from '../animations/TransitionToggler';

class SmallBalancesWrapper extends PureComponent {
  static propTypes = {
    assets: PropTypes.array,
    balancesSum: PropTypes.string,
    isCoinListEdited: PropTypes.bool,
    openSmallBalances: PropTypes.bool,
    setIsCoinListEdited: PropTypes.func,
    setOpenSmallBalances: PropTypes.func,
  };

  state = { areChildrenVisible: true };

  handlePress = () =>
    this.props.setOpenSmallBalances(!this.props.openSmallBalances);

  render = () => {
    const {
      assets,
      balancesSum,
      checkList,
      openSmallBalances,
      isCoinListEdited,
      setIsCoinListEdited,
    } = this.props;

    return (
      <Fragment>
        <CoinDivider
          balancesSum={balancesSum}
          onPress={this.handlePress}
          onEdit={setIsCoinListEdited}
          isCoinListEdited={isCoinListEdited}
          openSmallBalances={openSmallBalances}
        />
        <OpacityToggler
          endingOpacity={1}
          isVisible={openSmallBalances}
          startingOpacity={0}
        >
          <View pointerEvents={openSmallBalances ? 'auto' : 'none'}>
            <View style={{ position: 'absolute' }}>{checkList}</View>
            <TransitionToggler
              startingWidth={0}
              endingWidth={42}
              toggle={isCoinListEdited}
            >
              {assets}
            </TransitionToggler>
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
  withProps(({ assets, nativeCurrencySymbol }) => {
    const balance = assets.reduce(reduceBalances, 0);
    return isNumber(balance)
      ? { balancesSum: `${nativeCurrencySymbol}${balance.toFixed(2)}` }
      : {};
  })
)(SmallBalancesWrapper);
