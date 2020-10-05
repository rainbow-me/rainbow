import styled from 'styled-components/primitives';
import { Column } from '../layout';

const ToastPositionContainer = styled(Column).attrs({
  pointerEvents: 'none',
})`
  bottom: ${({ bottom = 0 }) => bottom};
  left: 0;
  position: absolute;
  right: 0;
`;

export default ToastPositionContainer;
