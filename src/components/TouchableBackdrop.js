import PropTypes from 'prop-types';
import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
import { withNeverRerender } from '../hoc';
import { colors, position } from '../styles';

const TouchableBackdrop = props => (
  <BorderlessButton
    css={`
      ${position.cover};
      background-color: ${colors.transparent};
      z-index: ${({ zIndex }) => (zIndex)};
    `}
    {...props}
  />
);

TouchableBackdrop.propTypes = {
  zIndex: PropTypes.number,
};

TouchableBackdrop.defaultProps = {
  zIndex: 0,
};

export default withNeverRerender(TouchableBackdrop);
