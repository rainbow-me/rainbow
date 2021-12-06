// @ts-expect-error ts-migrate(2305) FIXME: Module '"prop-types"' has no exported member 'Prop... Remove this comment to see the full error message
import { PropTypes } from 'prop-types';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Divider' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Divider from '../Divider';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { neverRerender } from '@rainbow-me/utils';

const ListItemDivider = styled(Divider).attrs(
  ({ inset, theme: { colors } }) => ({
    color: colors.rowDividerFaint,
    inset: [0, inset],
  })
)``;

ListItemDivider.propTypes = {
  inset: PropTypes.number,
};

ListItemDivider.defaultProps = {
  inset: 16,
};

export default neverRerender(ListItemDivider);
