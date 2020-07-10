import styled from 'styled-components/primitives';
import { neverRerender } from '../../utils';
import Divider from '../Divider';
import { colors } from '@rainbow-me/styles';

const SheetDivider = styled(Divider).attrs({
  color: colors.rowDividerExtraLight,
})`
  z-index: 1;
`;

export default neverRerender(SheetDivider);
