import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
import { View } from 'react-primitives';
import { colors, position } from '../styles';

const Highlight = ({ backgroundColor, visible }) => (
  <View
    {...position.coverAsObject}
    backgroundColor={backgroundColor}
    borderRadius={10}
    opacity={visible ? 1 : 0}
  />
);

Highlight.propTypes = {
  backgroundColor: PropTypes.string,
  visible: PropTypes.bool,
};

Highlight.defaultProps = {
  backgroundColor: colors.highlightBackground,
};

export default onlyUpdateForKeys(['visible'])(Highlight);
