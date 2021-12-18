import styled from '@rainbow-me/styled';
import { neverRerender } from '../../utils';
import Divider from '../Divider';

const SheetDivider = styled(Divider).attrs(({ theme: { colors } }) => ({
  color: colors.rowDividerExtraLight,
}))({
  zIndex: 1,
});

export default neverRerender(SheetDivider);
