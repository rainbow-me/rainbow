import PropTypes from 'prop-types';
import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
import { colors, position } from '../styles';

const TouchableBackdrop = ({ zIndex, ...props }) => (
  <BorderlessButton
    {...props}
    {...position.centeredAsObject}
    {...position.coverAsObject}
    activeOpacity={1}
    backgroundColor={colors.transparent}
    zIndex={zIndex}
  />
);

TouchableBackdrop.propTypes = {
  zIndex: PropTypes.number,
};

TouchableBackdrop.defaultProps = {
  zIndex: 0,
};

const neverRerender = () => true;
export default React.memo(TouchableBackdrop, neverRerender);
