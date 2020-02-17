import PropTypes from 'prop-types';
import React from 'react';
import SavingsListHeader from './SavingsListHeader';
import { compose } from 'recompact';
import withOpenSavings from '../../hoc/withOpenSavings';
import { OpacityToggler } from '../animations';
import { View } from 'react-native';

const SavingsListWrapper = ({ amount, assets, openSavings }) => {
  return (
    <>
      <SavingsListHeader amount={amount} />
      <View pointerEvents={openSavings ? 'auto' : 'none'}>
        <OpacityToggler
          endingOpacity={1}
          isVisible={openSavings}
          startingOpacity={0}
        >
          {assets}
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
