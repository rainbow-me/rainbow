import PropTypes from 'prop-types';
import React from 'react';
import { UIActivityIndicator } from 'react-native-indicators';
import { View } from 'react-primitives';
import stylePropType from 'react-style-proptype';
import { colors, position } from '../styles';

const ActivityIndicator = ({ color, isInteraction, size, style }) => (
  <View style={[position.sizeAsObject(size), style]}>
    <UIActivityIndicator
      color={color}
      interaction={isInteraction}
      size={size}
    />
  </View>
);

ActivityIndicator.propTypes = {
  color: PropTypes.string,
  isInteraction: PropTypes.bool,
  size: PropTypes.number,
  style: stylePropType,
};

ActivityIndicator.defaultProps = {
  color: colors.blueGreyDark,
  isInteraction: false,
  size: 25,
};

const neverRerender = () => true;
export default React.memo(ActivityIndicator, neverRerender);
