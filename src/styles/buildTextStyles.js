import { get, isNil } from 'lodash';
import { Platform } from 'react-native';
import { css } from 'styled-components/primitives';
import colors from './colors';
import fonts from './fonts';

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function selectBestFontFit(mono, weight) {
  if (weight) {
    return weight <= 400
      ? 'Regular'
      : mono
      ? 'Medium'
      : capitalizeFirstLetter(weight);
  } else {
    return 'Regular';
  }
}

const buildTextStyles = css`
  /* Color */
  color: ${({ color }) => colors.get(color) || colors.dark};

  /* Font Family */
  ${({ isEmoji, family = 'SFProRounded', mono, weight }) =>
    isEmoji
      ? ''
      : `font-family: ${
          fonts.family[
            mono
              ? `SFMono${
                  Platform.OS === 'android'
                    ? `-${selectBestFontFit(mono, weight)}`
                    : ''
                }`
              : family
          ]
        }${
          Platform.OS === 'android' ? `-${selectBestFontFit(mono, weight)}` : ''
        };`}

  /* Font Size */
  font-size: ${({ size = 'medium' }) =>
    typeof size === 'number' ? size : get(fonts, `size[${size}]`, size)};

  /* Font Weight */
  ${({ isEmoji, weight = 'regular' }) =>
    isEmoji || isNil(weight)
      ? ''
      : `font-weight: ${get(fonts, `weight[${weight}]`, weight)};`}

  /* Letter Spacing */
  ${({ letterSpacing = 'rounded' }) =>
    isNil(letterSpacing)
      ? ''
      : `letter-spacing: ${get(
          fonts,
          `letterSpacing[${letterSpacing}]`,
          letterSpacing
        )};`}

  /* Line Height */
  ${({ isEmoji, lineHeight }) =>
    isNil(lineHeight) || (isEmoji && Platform.OS === 'android')
      ? ''
      : `line-height: ${get(fonts, `lineHeight[${lineHeight}]`, lineHeight)};`}

  /* Opacity */
  ${({ opacity }) => (isNil(opacity) ? '' : `opacity: ${opacity};`)}

  /* Tabular Numbers */
  ${({ tabularNums }) => (tabularNums ? 'font-variant: tabular-nums;' : '')}

  /* Text Align */
  ${({ align }) => (isNil(align) ? '' : `text-align: ${align};`)}

  /* Uppercase */
  ${({ uppercase }) => (uppercase ? 'text-transform: uppercase;' : '')}
`;

export default buildTextStyles;
