import PropTypes from 'prop-types';
import React from 'react';
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
  withHandlers({
    onPress: ({ navigation }) => () => navigation.navigate('ProfileScreen'),
  }),
  onlyUpdateForPropTypes,
)(ProfileHeaderButton);
