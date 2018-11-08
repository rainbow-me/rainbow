import PropTypes from 'prop-types';
import React from 'react';
import { withNavigation } from 'react-navigation';
import { compose, onlyUpdateForPropTypes, withHandlers } from 'recompact';
import Avatar from '../Avatar';
import HeaderButton from './HeaderButton';

const ProfileHeaderButton = ({ onPress }) => (
  <HeaderButton onPress={onPress} transformOrigin="left">
    <Avatar />
  </HeaderButton>
);

ProfileHeaderButton.propTypes = {
  onPress: PropTypes.func,
};

export default compose(
  withNavigation,
  withHandlers({ onPress: ({ navigation }) => () => navigation.navigate('SettingsScreen') }),
  onlyUpdateForPropTypes,
)(ProfileHeaderButton);
