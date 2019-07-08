import PropTypes from 'prop-types';
import React from 'react';
import { withNavigation } from 'react-navigation';
import { compose, onlyUpdateForKeys, withHandlers } from 'recompact';
import Icon from '../icons/Icon';
import FloatingActionButton from './FloatingActionButton';

const SendFab = ({ disabled, onPress, ...props }) => (
  <FloatingActionButton
    {...props}
    disabled={disabled}
    onPress={onPress}
  >
    <Icon
      name="send"
      style={{
        height: 22,
        marginBottom: 4,
        width: 23,
      }}
    />
  </FloatingActionButton>
);

SendFab.propTypes = {
  disabled: PropTypes.bool,
  onPress: PropTypes.func,
};

export default compose(
  withNavigation,
  withHandlers({
    onPress: ({ navigation }) => () => {
      navigation.navigate('SendSheet');
    },
  }),
  onlyUpdateForKeys(['disabled']),
)(SendFab);
