import { get, isNumber } from 'lodash';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import React, { Fragment, useCallback, useMemo } from 'react';
import { compose, onlyUpdateForPropTypes } from 'recompact';
import { withAccountSettings, withOpenBalances } from '../../hoc';
import { OpacityToggler } from '../animations';
import CoinDivider from './CoinDivider';

const balancePath = 'props.item.native.balance.amount';
const getBalance = asset =>
  parseFloat(isNumber(asset) ? asset : get(asset, balancePath, 0));
const reduceBalances = (acc, cur) => getBalance(acc) + getBalance(cur);

const SmallBalancesWrapper = ({
  assets,
  nativeCurrencySymbol,
  openSmallBalances,
  setOpenSmallBalances,
}) => {
  const balance = useMemo(() => assets.reduce(reduceBalances, 0), [assets]);
  const handlePress = useCallback(
    () => setOpenSmallBalances(!openSmallBalances),
    [openSmallBalances, setOpenSmallBalances]
  );

  return (
    <Fragment>
      <CoinDivider
        balancesSum={
          balance ? `${nativeCurrencySymbol}${balance.toFixed(2)}` : null
        }
        onPress={handlePress}
        openSmallBalances={openSmallBalances}
      />
      <OpacityToggler
        endingOpacity={1}
        isVisible={openSmallBalances}
        startingOpacity={0}
      >
        <View pointerEvents={openSmallBalances ? 'auto' : 'none'}>
          {assets}
        </View>
      </OpacityToggler>
    </Fragment>
  );
};

SmallBalancesWrapper.propTypes = {
  assets: PropTypes.array,
  nativeCurrencySymbol: PropTypes.string,
  openSmallBalances: PropTypes.bool,
  setOpenSmallBalances: PropTypes.func,
};

export default compose(
  withAccountSettings,
  withOpenBalances,
)(SmallBalancesWrapper);
