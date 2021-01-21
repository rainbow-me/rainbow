import styled from 'styled-components/primitives';
import { darkMode } from '@rainbow-me/config/debug';
import { colors, position } from '@rainbow-me/styles';

const InnerBorder = styled.View.withConfig({
  shouldForwardProp: prop => prop !== 'width',
}).attrs({ pointerEvents: 'none' })`
  ${position.cover};
  border-color: ${({ color }) => color || colors.black};
  border-radius: ${({ radius }) => radius || 0};
  border-width: ${({ width }) => width || 0.5};
  opacity: ${({ opacity }) => (darkMode ? 0 : opacity || 0.06)};
`;

export default InnerBorder;
