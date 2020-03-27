import { get, isNil } from 'lodash';
import { css } from 'styled-components';
import colors from './colors';
import fonts from './fonts';

const buildFontFamily = ({ emoji, family = 'SFProRounded', mono }) => {
  if (emoji) return '';
  return `font-family: ${fonts.family[mono ? 'SFMono' : family]}`;
};

const buildFontWeight = ({ emoji, weight = 'regular' }) => {
  if (emoji || isNil(weight)) return '';
  return `font-weight: ${get(fonts, `weight[${weight}]`, weight)};`;
};

const buildLetterSpacing = ({ letterSpacing = 'rounded' }) => {
  if (isNil(letterSpacing)) return '';
  return `letter-spacing: ${get(
    fonts,
    `letterSpacing[${letterSpacing}]`,
    letterSpacing
  )};`;
};

const buildLineHeight = ({ lineHeight }) => {
  if (isNil(lineHeight)) return '';
  return `line-height: ${get(fonts, `lineHeight[${lineHeight}]`, lineHeight)};`;
};

export default css`
  ${buildFontFamily}
  ${buildFontWeight}
  ${buildLetterSpacing}
  ${buildLineHeight}
  ${({ align }) => (align ? `text-align: ${align};` : '')}
  ${({ opacity }) => (isNil(opacity) ? '' : `opacity: ${opacity};`)}
  ${({ uppercase }) => (uppercase ? 'text-transform: uppercase;' : '')}
  color: ${({ color }) => colors.get(color) || colors.dark}
  font-size: ${({ size }) =>
    typeof size === 'number' ? size : fonts.size[size || 'medium']};
`;
