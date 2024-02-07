import { PropTypes } from 'prop-types';
import Divider from '../Divider';
import styled from '@/styled-thing';
import { neverRerender } from '@/utils';

const ListItemDivider = styled(Divider).attrs(({ inset, theme: { colors } }) => ({
  color: colors.rowDividerFaint,
  inset: [0, inset],
}))({});

ListItemDivider.propTypes = {
  inset: PropTypes.number,
};

ListItemDivider.defaultProps = {
  inset: 16,
};

export default neverRerender(ListItemDivider);
