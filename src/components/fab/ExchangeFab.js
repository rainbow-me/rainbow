import PropTypes from 'prop-types';
import React from 'react';
import { withNavigation } from 'react-navigation';
import { compose, onlyUpdateForKeys, withHandlers } from 'recompact';
import { withFabSelection } from '../../hoc';
import { colors } from '../../styles';
import { Icon } from '../icons';
import FloatingActionButton from './FloatingActionButton';

const FabShadow = [
  [0, 10, 30, colors.dark, 0.4],
  [0, 5, 15, colors.swapPurple, 0.5],
];

const ExchangeFab = ({ disabled, onPress, ...props }) => (
  <FloatingActionButton
    {...props}
    backgroundColor={colors.swapPurple}
    disabled={disabled}
    onPress={onPress}
    shadows={FabShadow}
  >
    <Icon height={21} marginBottom={2} name="swap" width={26} />
  </FloatingActionButton>
);

ExchangeFab.propTypes = {
  disabled: PropTypes.bool,
  onPress: PropTypes.func,
};

export default compose(
  withFabSelection,
  withNavigation,
  withHandlers({
    onPress: ({ navigation }) => () => {
      navigation.navigate('ExchangeModal');
    },
  }),
  onlyUpdateForKeys(['disabled'])
)(ExchangeFab);
