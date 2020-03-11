import { PropTypes } from 'prop-types';
import React from 'react';
import { withNeverRerender } from '../../hoc';
import { colors } from '../../styles';
import Divider from '../Divider';

const ListItemDivider = ({ inset }) => (
  <Divider color={colors.rowDividerLight} inset={[0, inset]} />
);

ListItemDivider.propTypes = {
  inset: PropTypes.number,
};

ListItemDivider.defaultProps = {
  inset: 16,
};

export default withNeverRerender(ListItemDivider);
