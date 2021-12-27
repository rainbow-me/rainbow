import { position } from '@rainbow-me/styles';
import styled from 'rainbowed-components';

const InnerBorder = styled.View.withConfig({
  shouldForwardProp: prop => prop !== 'width',
}).attrs({ pointerEvents: 'none' })(
  ({ color, theme: { colors, isDarkMode }, opacity, width, radius }) => ({
    ...position.coverAsObject,
    borderColor: color ?? colors.black,
    borderRadius: radius ?? 0,
    borderWidth: width ?? 0.5,
    opacity: isDarkMode ? 0 : opacity ?? 0.06,
  })
);

export default InnerBorder;
