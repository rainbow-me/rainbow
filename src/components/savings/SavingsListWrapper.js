import React from 'react';
import { View } from 'react-native';
import { useOpenSavings } from '../../hooks';
import { OpacityToggler } from '../animations';
import SavingsListHeader from './SavingsListHeader';
import SavingsListRow from './SavingsListRow';

export default function SavingsListWrapper({ assets, totalValue = '0' }) {
  const { isSavingsOpen, toggleOpenSavings } = useOpenSavings();

  return (
    <React.Fragment>
      <SavingsListHeader
        isOpen={isSavingsOpen}
        onPress={toggleOpenSavings}
        savingsSumValue={totalValue}
        showSumValue
      />
      <View pointerEvents={isSavingsOpen ? 'auto' : 'none'}>
        <OpacityToggler
          endingOpacity={1}
          isVisible={isSavingsOpen}
          startingOpacity={0}
        >
          {assets.map(
            item =>
              item &&
              item.underlying && (
                <SavingsListRow key={item.underlying.symbol} {...item} />
              )
          )}
        </OpacityToggler>
      </View>
    </React.Fragment>
  );
}
