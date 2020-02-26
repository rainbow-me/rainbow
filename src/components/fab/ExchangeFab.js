import PropTypes from 'prop-types';
import React from 'react';
import { withNavigation } from 'react-navigation';
import { compose, onlyUpdateForKeys, withHandlers } from 'recompact';
import { withFabSelection, withAccountSettings } from '../../hoc';
import { colors } from '../../styles';
import { Icon } from '../icons';
import FloatingActionButton from './FloatingActionButton';
import networkTypes from '../../helpers/networkTypes';

const ExchangeFab = ({ disabled, onPress, network, ...props }) =>
  [networkTypes.mainnet, networkTypes.rinkeby].indexOf(network) !== -1 && (
    <FloatingActionButton
      {...props}
      backgroundColor={colors.dodgerBlue}
      disabled={disabled}
      onPress={onPress}
    >
      <Icon height={21} marginBottom={2} name="swap" width={26} />
    </FloatingActionButton>
  );

ExchangeFab.propTypes = {
  disabled: PropTypes.bool,
  onPress: PropTypes.func,
};

export default compose(
  withAccountSettings,
  withFabSelection,
  withNavigation,
  withHandlers({
    onPress: ({ navigation }) => () => navigation.navigate('ExchangeModal'),
  }),
  onlyUpdateForKeys(['disabled'])
)(ExchangeFab);
