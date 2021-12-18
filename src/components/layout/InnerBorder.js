import styled from '@terrysahaidak/style-thing';
import { position } from '@rainbow-me/styles';

const InnerBorder = styled.View.withConfig({
  shouldForwardProp: prop => prop !== 'width',
}).attrs({ pointerEvents: 'none' })({
  ...position.coverAsObject,
  borderColor: ({ color, theme: { colors } }) => color || colors.black,
  borderRadius: ({ radius }) => radius || 0,
  borderWidth: ({ width }) => width || 0.5,
  opacity: ({ opacity, theme: { isDarkMode } }) =>
    isDarkMode ? 0 : opacity || 0.06,
});

export default InnerBorder;
