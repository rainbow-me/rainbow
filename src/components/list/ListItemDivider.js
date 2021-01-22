import { PropTypes } from 'prop-types';
import React from 'react';
import Divider from '../Divider';
import { colors_NOT_REACTIVE } from '@rainbow-me/styles';
import { neverRerender } from '@rainbow-me/utils';

const ListItemDivider = ({ inset }) => (
  <Divider color={colors_NOT_REACTIVE.rowDividerFaint} inset={[0, inset]} />
);

ListItemDivider.propTypes = {
  inset: PropTypes.number,
};

ListItemDivider.defaultProps = {
  inset: 16,
};

export default neverRerender(ListItemDivider);
