import styled from 'styled-components/primitives';
import { withNeverRerender } from '../../hoc';

const SheetHandle = styled.View`
  background-color: #3c4252;
  border-radius: 3;
  height: 5px;
  opacity: 0.3;
  width: 36px;
`;

export default withNeverRerender(SheetHandle);
