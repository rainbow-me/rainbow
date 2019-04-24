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
import { colors } from '../../styles';

const ExchangeFab = ({ disabled, onPress, ...props }) => (
  <FloatingActionButton
    {...props}
    disabled={disabled}
    onPress={onPress}
    color={colors.fadedBlue}
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

ExchangeFab.propTypes = {
  disabled: PropTypes.bool,
  onPress: PropTypes.func,
};

export default compose(
  pure,
  withNavigation,
  withHandlers({
    onPress: ({ navigation }) => () => {
      navigation.navigate('ExchangeModal');
    },
  }),
  onlyUpdateForKeys(['disabled']),
)(ExchangeFab);
