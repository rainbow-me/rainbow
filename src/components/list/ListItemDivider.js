import { PropTypes } from 'prop-types';
import Divider from '@/components/Divider';
import styled from '@/styled-thing';
import { neverRerender } from '@/utils';

const ListItemDivider = styled(Divider).attrs(({ inset = 16, theme: { colors } }) => ({
  color: colors.rowDividerFaint,
  inset: [0, inset],
}))({});

ListItemDivider.propTypes = {
  inset: PropTypes.number,
};

export default neverRerender(ListItemDivider);
