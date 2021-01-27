import styled from 'styled-components';
import { neverRerender } from '../../utils';
import Divider from '../Divider';

const SheetDivider = styled(Divider).attrs(({ theme: { colors } }) => ({
  color: colors.rowDividerExtraLight,
}))`
  z-index: 1;
`;

export default neverRerender(SheetDivider);
