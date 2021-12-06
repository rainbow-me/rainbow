import { css } from 'styled-components';
import position from './position';

export const getFlexStylesFromShorthand = (style: any) =>
  style === 'end' || style === 'start' ? `flex-${style}` : style;

const buildFlexStyles = css`
  /* Align Items */
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'align' does not exist on type 'ThemeProp... Remove this comment to see the full error message
  align-items: ${({ align = 'stretch' }) => getFlexStylesFromShorthand(align)};

  /* Align Self */
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'self' does not exist on type 'ThemeProps... Remove this comment to see the full error message
  ${({ self }) =>
    self ? `align-self: ${getFlexStylesFromShorthand(self)};` : ''}

  /* Flex */
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'flex' does not exist on type 'ThemeProps... Remove this comment to see the full error message
  ${({ flex }) => (flex !== undefined ? `flex: ${flex};` : '')}

  /* Flex Direction */
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'direction' does not exist on type 'Theme... Remove this comment to see the full error message
  flex-direction: ${({ direction = 'row' }) => direction};

  /* Flex Grow */
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'grow' does not exist on type 'ThemeProps... Remove this comment to see the full error message
  ${({ grow }) => (grow !== undefined ? `flex-grow: ${grow};` : '')}

  /* Flex Shrink */
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'shrink' does not exist on type 'ThemePro... Remove this comment to see the full error message
  ${({ shrink }) => (shrink !== undefined ? `flex-shrink: ${shrink};` : '')}

  /* Flex Wrap */
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'wrap' does not exist on type 'ThemeProps... Remove this comment to see the full error message
  flex-wrap: ${({ wrap }) => (wrap ? 'wrap' : 'nowrap')};

  /* Justify Content */
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'justify' does not exist on type 'ThemePr... Remove this comment to see the full error message
  justify-content: ${({ justify = 'start' }) =>
    getFlexStylesFromShorthand(justify)};

  /* Shorthand Shortcuts 💇‍♂️️ */
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'centered' does not exist on type 'ThemeP... Remove this comment to see the full error message
  ${({ centered }) => (centered ? position.centered : '')}
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'cover' does not exist on type 'ThemeProp... Remove this comment to see the full error message
  ${({ cover }) => (cover ? position.cover : '')}
`;

export default buildFlexStyles;
