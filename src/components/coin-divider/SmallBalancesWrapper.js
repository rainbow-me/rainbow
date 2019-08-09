import { withSafeTimeout } from '@hocs/safe-timers';
import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import {
  compose,
  lifecycle,
  withState,
  withHandlers,
} from 'recompact';
import { withOpenBalances } from '../../hoc';
import CoinDivider from './CoinDivider';
import OpacityToggler from '../animations/OpacityToggler';

const balancesSum = (balances) => {
  let sum = 0;
  for (let i = 0; i < balances.length; i++) {
    if (balances[i].props.item.native) {
      if (!isNaN(balances[i].props.item.native.balance.amount)) {
        sum += Number(balances[i].props.item.native.balance.amount);
      }
    }
  }
  return `$${Number(sum).toFixed(2)}`;
};

const SmallBalancesWrapper = ({
  areChildrenVisible,
  openSmallBalances,
  setOpenSmallBalances,
  assets,
  ...props
}) => (
  <View>
    <CoinDivider
      coinDivider={true}
      balancesSum={balancesSum(assets)}
      openSmallBalances={openSmallBalances}
      onChangeOpenBalances={() => setOpenSmallBalances(!openSmallBalances)}
    />
    <OpacityToggler isVisible={openSmallBalances} startingOpacity={0} endingOpacity={1}>
      {areChildrenVisible && assets}
    </OpacityToggler>
  </View>
);

SmallBalancesWrapper.propTypes = {
  areChildrenVisible: PropTypes.bool,
  assets: PropTypes.array,
  balancesSum: PropTypes.string,
  openSmallBalances: PropTypes.bool,
  setOpenSmallBalances: PropTypes.func,
};

export default compose(
  withSafeTimeout,
  withOpenBalances,
  withState('areChildrenVisible', 'setAreChildrenVisible', true),
  withHandlers({
    onHideChildren: ({ areChildrenVisible, setAreChildrenVisible }) => () => {
      if (areChildrenVisible) {
        setAreChildrenVisible(false);
      }
    },
    onShowChildren: ({ areChildrenVisible, setAreChildrenVisible }) => () => {
      if (!areChildrenVisible) {
        setAreChildrenVisible(true);
      }
    },
  }),
  lifecycle({
    componentDidMount() {
      this.props.onShowChildren();
    },
    componentDidUpdate() {
      if (!this.props.openSmallBalances) {
        setTimeout(() => {
          if (!this.props.openSmallBalance) {
            this.props.onHideChildren();
          }
        }, 200);
      } else {
        this.props.onShowChildren();
      }
    },
  }),
)(SmallBalancesWrapper);
