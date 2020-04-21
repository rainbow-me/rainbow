import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useDispatch } from 'react-redux';
import { pure } from 'recompose';
import { useOpenSavings } from '../../hooks';
import { OpacityToggler } from '../animations';
import SavingsListHeader from './SavingsListHeader';
import SavingsListRow from './SavingsListRow';

const SavingsListRowRenderer = pure(data => <SavingsListRow {...data} />);

const SavingsListWrapper = ({ assets, totalValue }) => {
  const dispatch = useDispatch();
  const { openSavings, setOpenSavings } = useOpenSavings();

  const onPress = useCallback(() => dispatch(setOpenSavings(!openSavings)), [
    dispatch,
    openSavings,
    setOpenSavings,
  ]);

  return (
    <React.Fragment>
      <SavingsListHeader
        isOpen={openSavings}
        savingsSumValue={totalValue}
        onPress={onPress}
        showSumValue
      />
      <View pointerEvents={openSavings ? 'auto' : 'none'}>
        <OpacityToggler
          endingOpacity={1}
          isVisible={openSavings}
          startingOpacity={0}
        >
          {assets.map(
            item =>
              item &&
              item.underlying && (
                <SavingsListRowRenderer
                  key={item.underlying.symbol}
                  {...item}
                />
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
