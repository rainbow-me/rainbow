import { get, isNil } from 'lodash';
import { css } from 'styled-components/primitives';
import colors from './colors';
import fonts from './fonts';

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function selectBestFontFit(mono, weight) {
  if (weight) {
    if (weight === 900) {
      return 'Heavy';
    }
    if (weight >= 700) {
      return 'Bold';
    }
    if (weight >= 500) {
      return 'Semibold';
    }
    return weight <= 400
      ? 'Regular'
      : mono
      ? 'Medium'
      : capitalizeFirstLetter(weight);
  } else {
    return 'Regular';
  }
}

function familyFontWithAndroidWidth(weight, family, mono) {
  return `${
    fonts.family[
      mono
        ? `SFMono${android ? `-${selectBestFontFit(mono, weight)}` : ''}`
        : family
    ]
  }${android ? `-${selectBestFontFit(mono, weight)}` : ''}`;
}

export function fontWithWidth(weight, family = 'SFProRounded', mono = false) {
  return {
    fontFamily: familyFontWithAndroidWidth(weight, family, mono),
    // https://github.com/facebook/react-native/issues/18820
    // https://www.youtube.com/watch?v=87rhZTumujw
    ...(ios ? { fontWeight: weight } : { fontWeight: 'normal' }),
  };
}

const buildTextStyles = css`
  /* Color */
  color: ${({ color }) => colors.get(color) || colors.dark};

  /* Font Family */
  ${({ isEmoji, family = 'SFProRounded', mono, weight }) => {
    const t = isEmoji
      ? ''
      : `font-family: ${familyFontWithAndroidWidth(weight, family, mono)};`;
    return t;
  }}

  /* Font Size */
  font-size: ${({ size = 'medium' }) =>
    typeof size === 'number' ? size : get(fonts, `size[${size}]`, size)};

  /* Font Weight */
  ${({ isEmoji, weight = 'regular' }) =>
    isEmoji || isNil(weight) || android
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
    isNil(lineHeight) || (isEmoji && android)
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
