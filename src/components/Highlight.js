import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
import { View } from 'react-primitives';
import { colors, position } from '../styles';

const Highlight = ({
  backgroundColor,
  borderRadius,
  visible,
  ...props
}) => (
  <View
    {...position.coverAsObject}
    backgroundColor={backgroundColor}
    borderRadius={borderRadius}
    margin={7}
    opacity={visible ? 1 : 0}
    {...props}
  />
);

Highlight.propTypes = {
  backgroundColor: PropTypes.string,
  borderRadius: PropTypes.number,
  visible: PropTypes.bool,
};

Highlight.defaultProps = {
  backgroundColor: colors.highlightBackground,
  borderRadius: 10,
};

export default onlyUpdateForKeys(['visible'])(Highlight);
