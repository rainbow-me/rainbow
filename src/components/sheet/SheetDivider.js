import { neverRerender } from '../../utils';
import Divider from '../Divider';
import styled from '@/styled-thing';

const SheetDivider = styled(Divider).attrs(({ theme: { colors } }) => ({
  color: colors.rowDividerExtraLight,
}))({
  zIndex: 1,
});

export default neverRerender(SheetDivider);
