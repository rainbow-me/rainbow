import { PropTypes } from 'prop-types';
import React from 'react';
import Divider from '../Divider';

const ListItemDivider = ({ inset }) => (
  <Divider
    insetLeft={inset}
    insetRight={inset}
  />
);

ListItemDivider.propTypes = {
  inset: PropTypes.number,
};

ListItemDivider.defaultProps = {
  inset: 16,
};

export default ListItemDivider;
