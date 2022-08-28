import { Column } from '../layout';
import styled from '@/styled-thing';

const ToastPositionContainerHeight = 40;

const ToastPositionContainer = styled(Column).attrs({
  pointerEvents: 'none',
})({
  bottom: ({ bottom = 0 }) => bottom - ToastPositionContainerHeight,
  height: ToastPositionContainerHeight,
  left: 0,
  position: 'absolute',
  right: 0,
  width: '100%',
  zIndex: 9,
});

export default ToastPositionContainer;
