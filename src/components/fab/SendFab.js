import PropTypes from 'prop-types';
import React from 'react';
import { withNavigation } from 'react-navigation';
import {
  compose,
  onlyUpdateForKeys,
  pure,
  withHandlers,
} from 'recompact';
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
        height: 21,
        marginBottom: 2,
        width: 22,
      }}
    />
  </FloatingActionButton>
);

SendFab.propTypes = {
  disabled: PropTypes.bool,
  onPress: PropTypes.func,
};

export default compose(
  pure,
  withNavigation,
  withHandlers({
    onPress: ({ navigation }) => () => {
      navigation.navigate('SendSheet');
    },
  }),
  onlyUpdateForKeys(['disabled']),
)(SendFab);
