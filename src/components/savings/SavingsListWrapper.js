import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { useState, useMemo } from 'react';
import SavingsListHeader from './SavingsListHeader';
import { compose } from 'recompact';
import withOpenSavings from '../../hoc/withOpenSavings';
import { OpacityToggler } from '../animations';
import { View } from 'react-native';
import { useAccountAssets } from '../../hooks';
import { ethereumUtils } from '../../utils';

const SavingsListWrapper = ({ assets, openSavings }) => {
  const [savingsSumValue, setSavingsSumValue] = useState(0);
  const { assets: allAssets } = useAccountAssets();
  const eth = ethereumUtils.getAsset(allAssets);
  const priceOfEther = get(eth, 'native.price.amount', null);

  useMemo(() => {
    const updateSum = () => {
      let newSavingsSumValue = 0;
      if (priceOfEther) {
        assets.forEach(asset => {
          const { ethPrice } = asset.props;
          newSavingsSumValue += priceOfEther * ethPrice;
        });
        setSavingsSumValue(newSavingsSumValue);
      }
    };

    return updateSum();
  }, [assets, priceOfEther]);

  return (
    <React.Fragment>
      <SavingsListHeader savingsSumValue={savingsSumValue} />
      <View pointerEvents={openSavings ? 'auto' : 'none'}>
        <OpacityToggler
          endingOpacity={1}
          isVisible={openSavings}
          startingOpacity={0}
        >
          {assets}
        </OpacityToggler>
      </View>
    </React.Fragment>
  );
};

SavingsListWrapper.propTypes = {
  assets: PropTypes.array,
};

export default compose(withOpenSavings)(SavingsListWrapper);
