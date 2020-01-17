import { css } from 'styled-components';
import colors from './colors';
import fonts from './fonts';

export default css`
  ${({ align }) => (align ? `text-align: ${align};` : '')}
  ${({ letterSpacing }) =>
    letterSpacing
      ? `letter-spacing: ${fonts.letterSpacing[letterSpacing]};`
      : ''}
  ${({ lineHeight }) =>
    lineHeight ? `line-height: ${fonts.lineHeight[lineHeight]};` : ''}
  ${({ uppercase }) => (uppercase ? 'text-transform: uppercase;' : '')}
  color: ${({ color }) => colors.get(color) || colors.dark}
  ${({ emoji, family = 'SFProText', mono }) =>
    emoji ? '' : `font-family: ${fonts.family[mono ? 'SFMono' : family]}`};
  font-size: ${({ size }) => fonts.size[size || 'medium']};
  ${({ emoji, weight }) =>
    emoji ? '' : `font-weight: ${fonts.weight[weight || 'regular']}`};
`;
