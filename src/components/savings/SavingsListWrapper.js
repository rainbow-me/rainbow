import PropTypes from 'prop-types';
import React from 'react';
import SavingsListHeader from './SavingsListHeader';
import { compose } from 'recompact';
import withOpenSavings from '../../hoc/withOpenSavings';
import { OpacityToggler } from '../animations';
import { View } from 'react-native';
import { pure } from 'recompose';
import SavingsListRow from './SavingsListRow';

const SavingsListRowRenderer = pure(data => <SavingsListRow {...data} />);

const SavingsListWrapper = ({ assets, openSavings, totalValue }) => {
  return (
    <React.Fragment>
      <SavingsListHeader savingsSumValue={totalValue} />
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
  openSavings: PropTypes.bool,
  totalValue: PropTypes.number,
};

SavingsListWrapper.defaultProps = {
  totalValue: 0,
};

export default compose(withOpenSavings)(SavingsListWrapper);
