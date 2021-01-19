import { PropTypes } from 'prop-types';
import React from 'react';
import Divider from '../Divider';
import { colors } from '@rainbow-me/styles';
import { neverRerender } from '@rainbow-me/utils';

const ListItemDivider = ({ inset }) => (
  <Divider color={colors.alpha(colors.blueGreyDark, 0.01)} inset={[0, inset]} />
);

ListItemDivider.propTypes = {
  inset: PropTypes.number,
};

ListItemDivider.defaultProps = {
  inset: 16,
};

export default neverRerender(ListItemDivider);
