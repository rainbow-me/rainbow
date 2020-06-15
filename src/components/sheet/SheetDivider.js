import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { neverRerender } from '../../utils';
import Divider from '../Divider';

const SheetDivider = styled(Divider).attrs({
  color: colors.rowDividerLight,
})`
  z-index: 1;
`;

export default neverRerender(SheetDivider);
