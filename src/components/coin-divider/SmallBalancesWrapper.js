import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
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
      {assets}
    </OpacityToggler>
  </View>
);

SmallBalancesWrapper.propTypes = {
  assets: PropTypes.array,
  balancesSum: PropTypes.string,
  openSmallBalances: PropTypes.bool,
  setOpenSmallBalances: PropTypes.func,
};

export default withOpenBalances(SmallBalancesWrapper);
