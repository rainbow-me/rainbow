import React from 'react';
import PropTypes from 'prop-types';
import { onlyUpdateForPropTypes } from 'recompact';
import { colors } from '../../styles';
import { Column } from '../layout';
import Icon from './Icon';

const DoubleArrowSelectionIcon = ({ color, size, ...props }) => (
  <Column {...props} style={{ width: (size - 1) * 2 }}>
    <Icon
      color={color}
      direction="up"
      name="caret"
      size={size}
    />
    <Icon
      color={color}
      direction="down"
      name="caret"
      size={size}
    />
  </Column>
);

DoubleArrowSelectionIcon.propTypes = {
  color: PropTypes.string,
  size: PropTypes.number,
};

DoubleArrowSelectionIcon.defaultProps = {
  color: colors.dark,
  size: 6,
};

export default onlyUpdateForPropTypes(DoubleArrowSelectionIcon);
