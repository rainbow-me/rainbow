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
import { pure } from 'recompose';
import SavingsListRow from './SavingsListRow';

const SavingsListRowRenderer = pure(data => <SavingsListRow {...data} />);

const SavingsListWrapper = ({ assets, openSavings }) => {
  const [savingsSumValue, setSavingsSumValue] = useState(0);
  const { assets: allAssets } = useAccountAssets();
  const eth = ethereumUtils.getAsset(allAssets);
  const priceOfEther = get(eth, 'native.price.amount', null);

  useMemo(() => {
    const updateSum = () => {
      let newSavingsSumValue = 0;
      if (priceOfEther) {
        assets.forEach((asset, i) => {
          const { ethPrice } = asset;
          const nativeValue = priceOfEther * ethPrice;
          assets[i].nativeValue = nativeValue;
          newSavingsSumValue += nativeValue;
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
          {assets.map(item => (
            <SavingsListRowRenderer key={item.underlying.symbol} {...item} />
          ))}
        </OpacityToggler>
      </View>
    </React.Fragment>
  );
};

SavingsListWrapper.propTypes = {
  assets: PropTypes.array,
};

export default compose(withOpenSavings)(SavingsListWrapper);
