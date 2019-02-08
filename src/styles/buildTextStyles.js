import { css } from 'styled-components';
import colors from './colors';
import fonts from './fonts';

export default css`
  ${({ align }) => (
    align
      ? `text-align: ${align};`
      : ''
  )}
  ${({ letterSpacing }) => (
    letterSpacing
      ? `letter-spacing: ${fonts.letterSpacing[letterSpacing]};`
      : ''
  )}
  ${({ lineHeight }) => (
    lineHeight
      ? `line-height: ${fonts.lineHeight[lineHeight]};`
      : ''
  )}
  color: ${({ color }) => (colors.get(color) || colors.dark)}
  font-family: ${({ family }) => fonts.family[family || 'SFProText']};
  font-size: ${({ size }) => fonts.size[size || 'medium']};
  font-weight: ${({ weight }) => fonts.weight[weight || 'regular']};
`;
