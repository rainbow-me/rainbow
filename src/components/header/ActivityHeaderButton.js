import PropTypes from 'prop-types';
import React from 'react';
import { withNavigation } from 'react-navigation';
import { compose, withHandlers } from 'recompact';
import Icon from '../icons/Icon';
import { colors } from '../../styles';
import HeaderButton from './HeaderButton';

const ActivityHeaderButton = ({ onPress }) => {
  return (
    <HeaderButton onPress={onPress}>
      <Icon
        color={colors.dark}
        name="clock"
      />
    </HeaderButton>
  );
};

ActivityHeaderButton.propTypes = {
  onPress: PropTypes.func,
};

export default compose(
  withNavigation,
  withHandlers({
    onPress: ({ navigation, onPress }) => (event) => {
      if (onPress) {
        return onPress(event);
      }

      return navigation.navigate('ActivityScreen');
    },
  }),
)(ActivityHeaderButton);
