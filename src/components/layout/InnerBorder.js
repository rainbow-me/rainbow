import styled from '@/styled-thing';
import { position } from '@/styles';

const InnerBorder = styled.View.withConfig({
  shouldForwardProp: prop => prop !== 'width',
}).attrs({ pointerEvents: 'none' })(({ color, theme: { colors, isDarkMode }, opacity, width, radius }) => ({
  ...position.coverAsObject,
  borderColor: color ?? colors.black,
  borderRadius: radius ?? 0,
  borderWidth: width ?? 0.5,
  opacity: isDarkMode ? 0 : opacity ?? 0.06,
}));

export default InnerBorder;
