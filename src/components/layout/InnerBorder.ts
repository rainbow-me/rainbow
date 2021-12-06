import styled from 'styled-components';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const InnerBorder = styled.View.withConfig({
  shouldForwardProp: (prop: any) => prop !== 'width',
}).attrs({ pointerEvents: 'none' })`
  ${position.cover};
  border-color: ${({ color, theme: { colors } }: any) => color || colors.black};
  border-radius: ${({ radius }: any) => radius || 0};
  border-width: ${({ width }: any) => width || 0.5};
  opacity: ${({ opacity, theme: { isDarkMode } }: any) =>
    isDarkMode ? 0 : opacity || 0.06};
`;

export default InnerBorder;
