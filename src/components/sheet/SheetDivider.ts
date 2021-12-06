import styled from 'styled-components';
import { neverRerender } from '../../utils';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Divider' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Divider from '../Divider';

const SheetDivider = styled(Divider).attrs(({ theme: { colors } }) => ({
  color: colors.rowDividerExtraLight,
}))`
  z-index: 1;
`;

export default neverRerender(SheetDivider);
