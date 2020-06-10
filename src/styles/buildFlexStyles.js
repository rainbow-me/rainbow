import { css } from 'styled-components/primitives';

export const getFlexStylesFromShorthand = style =>
  style === 'end' || style === 'start' ? `flex-${style}` : style;

const buildFlexStyles = css`
  /* Align Items */
  align-items: ${({ align = 'stretch' }) => getFlexStylesFromShorthand(align)};

  /* Align Self */
  ${({ self }) =>
    self ? `align-self: ${getFlexStylesFromShorthand(self)};` : ''}

  /* Flex */
  ${({ flex }) => (flex !== undefined ? `flex: ${flex};` : '')}

  /* Flex Direction */
  flex-direction: ${({ direction = 'row' }) => direction};

  /* Flex Grow */
  ${({ grow }) => (grow !== undefined ? `flex-grow: ${grow};` : '')}

  /* Flex Shrink */
  ${({ shrink }) => (shrink !== undefined ? `flex-shrink: ${shrink};` : '')}

  /* Flex Wrap */
  flex-wrap: ${({ wrap }) => (wrap ? 'wrap' : 'nowrap')};

  /* Justify Content */
  justify-content: ${({ justify = 'start' }) =>
    getFlexStylesFromShorthand(justify)};
`;

export default buildFlexStyles;
