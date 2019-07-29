import React, { useState, useRef } from 'react';
import { Transitioning, Transition } from 'react-native-reanimated';
import { View } from 'react-native';
import { withOpenBalances } from '../../hoc';
import CoinDivider from './CoinDivider';
import { CoinRow } from '../coin-row';

const SmallBalancesWrapper = ({
  openSmallBalances,
  setOpenSmallBalances,
  assets,
  ...props
}) => {
  const transition = <Transition.Change interpolation="easeInOut" durationMs={200} />;

  let [height, setHeight] = useState(0);
  const ref = useRef();


  const onPress = () => {
    ref.current.animateNextTransition();
    setHeight(!openSmallBalances ? (CoinRow.height * assets.length) : 0);
    setOpenSmallBalances(!openSmallBalances);
  }

  return (
    <View>
      <CoinDivider openSmallBalances={openSmallBalances} onChangeOpenBalances={onPress} />
      <Transitioning.View
        ref={ref}
        transition={transition}
      >
        <View
          style={{
            height: height,
            overflow: 'hidden',
          }}
        >
          <View style={{ height: CoinRow.height * assets.length }} >
            {assets}
          </View>
        </View>
      </Transitioning.View>
    </View>
  )
};

export default withOpenBalances(SmallBalancesWrapper);
