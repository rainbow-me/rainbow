import { PropTypes } from 'prop-types';
import React from 'react';
import Divider from '../Divider';

const TouchableRowDivider = ({ inset }) => (
  <Divider
    insetLeft={inset}
    insetRight={inset}
  />
);

TouchableRowDivider.propTypes = {
  inset: PropTypes.number,
};

TouchableRowDivider.defaultProps = {
  inset: 16,
};

export default TouchableRowDivider;
