import PropTypes from 'prop-types';
import React from 'react';
import SavingsListHeader from './SavingsListHeader';
import SavingsListRow from './SavingsListRow';
import { compose } from 'recompact';
import withOpenSavings from '../../hoc/withOpenSavings';
import { OpacityToggler } from '../animations';
import { View } from 'react-native';

const SavingsListWrapper = ({ amount, assets, openSavings }) => {
  const savings = assets.map(({ data1, data2 }, index) => (
    <SavingsListRow key={index} APY="2323" data1={data1} data2={data2} />
  ));

  return (
    <>
      <SavingsListHeader amount={amount} />
      <View pointerEvents={openSavings ? 'auto' : 'none'}>
        <OpacityToggler
          endingOpacity={1}
          isVisible={openSavings}
          startingOpacity={0}
        >
          {savings}
        </OpacityToggler>
      </View>
    </>
  );
};

SavingsListWrapper.propTypes = {
  amount: PropTypes.string,
  assets: PropTypes.array,
};

export default compose(withOpenSavings)(SavingsListWrapper);
