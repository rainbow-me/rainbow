import PropTypes from 'prop-types';
import React, { useState, useRef } from 'react';
import { Transitioning, Transition } from 'react-native-reanimated';
import { View } from 'react-native';
import { withOpenBalances } from '../../hoc';
import CoinDivider from './CoinDivider';
import { CoinRow } from '../coin-row';

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
}) => {
  const transition = <Transition.Change interpolation="easeInOut" durationMs={200} />;

  const [height, setHeight] = useState(0);
  const ref = useRef();

  const onPress = () => {
    ref.current.animateNextTransition();
    setHeight(!openSmallBalances ? (CoinRow.height * assets.length) : 0);
    setOpenSmallBalances(!openSmallBalances);
  };

  if (openSmallBalances && height === 0) {
    ref.current.animateNextTransition();
    setHeight(CoinRow.height * assets.length);
  }

  return (
    <View>
      <Transitioning.View
        ref={ref}
        transition={transition}
      >
        <CoinDivider coinDivider={true} balancesSum={balancesSum(assets)} openSmallBalances={openSmallBalances} onChangeOpenBalances={onPress} />
        <View
          style={{
            height,
            overflow: 'hidden',
          }}
        >
          <View style={{ height: CoinRow.height * assets.length }} >
            {assets}
          </View>
        </View>
      </Transitioning.View>
    </View>
  );
};

SmallBalancesWrapper.propTypes = {
  assets: PropTypes.array,
  balancesSum: PropTypes.string,
  openSmallBalances: PropTypes.bool,
  setOpenSmallBalances: PropTypes.func,
};

export default withOpenBalances(SmallBalancesWrapper);
