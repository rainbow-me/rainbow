import styled from 'styled-components/primitives';
import { withNeverRerender } from '../../hoc';

const SheetHandle = styled.View`
  background-color: #D9DADB;
  border-radius: 3;
  height: 5px;
  width: 46px;
`;

export default withNeverRerender(SheetHandle);
