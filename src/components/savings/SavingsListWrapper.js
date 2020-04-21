import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import { useOpenSavings } from '../../hooks';
import { OpacityToggler } from '../animations';
import SavingsListHeader from './SavingsListHeader';
import SavingsListRow from './SavingsListRow';

const SavingsListWrapper = ({ assets, totalValue }) => {
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
};

SavingsListWrapper.propTypes = {
  assets: PropTypes.array,
  totalValue: PropTypes.string,
};

SavingsListWrapper.defaultProps = {
  totalValue: '0',
};

export default SavingsListWrapper;
