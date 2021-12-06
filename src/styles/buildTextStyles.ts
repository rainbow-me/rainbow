import { get, isNil } from 'lodash';
import { css } from 'styled-components';
import colors from './colors';
import fonts from './fonts';

function capitalizeFirstLetter(string: any) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function selectBestFontFit(mono: any, weight: any) {
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

function familyFontWithAndroidWidth(weight: any, family: any, mono: any) {
  return `${
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'family' does not exist on type '{}'.
    fonts.family[
      mono
        ? // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
          `SFMono${android ? `-${selectBestFontFit(mono, weight)}` : ''}`
        : family
    ]
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  }${android ? `-${selectBestFontFit(mono, weight)}` : ''}`;
}

export function fontWithWidth(
  weight: any,
  family = 'SFProRounded',
  mono = false
) {
  return {
    fontFamily: familyFontWithAndroidWidth(weight, family, mono),
    // https://github.com/facebook/react-native/issues/18820
    // https://www.youtube.com/watch?v=87rhZTumujw
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    ...(ios ? { fontWeight: weight } : { fontWeight: 'normal' }),
  };
}

const buildTextStyles = css`
  /* Color */
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'color' does not exist on type 'ThemeProp... Remove this comment to see the full error message
  color: ${({ color, theme }) =>
    colors.get(color, theme.colors) || theme.colors.dark};

  /* Font Family */
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'isEmoji' does not exist on type 'ThemePr... Remove this comment to see the full error message
  ${({ isEmoji, family = 'SFProRounded', mono, weight }) => {
    const t = isEmoji
      ? ''
      : `font-family: ${familyFontWithAndroidWidth(weight, family, mono)};`;
    return t;
  }}

  /* Font Size */
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'size' does not exist on type 'ThemeProps... Remove this comment to see the full error message
  font-size: ${({ size = 'medium' }) =>
    typeof size === 'number' ? size : get(fonts, `size[${size}]`, size)};

  /* Font Weight */
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'isEmoji' does not exist on type 'ThemePr... Remove this comment to see the full error message
  ${({ isEmoji, weight = 'regular' }) =>
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    isEmoji || isNil(weight) || android
      ? ''
      : `font-weight: ${get(fonts, `weight[${weight}]`, weight)};`}

  /* Letter Spacing */
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'letterSpacing' does not exist on type 'T... Remove this comment to see the full error message
  ${({ letterSpacing = 'rounded' }) =>
    isNil(letterSpacing)
      ? ''
      : `letter-spacing: ${get(
          fonts,
          `letterSpacing[${letterSpacing}]`,
          letterSpacing
        )};`}

  /* Line Height */
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'isEmoji' does not exist on type 'ThemePr... Remove this comment to see the full error message
  ${({ isEmoji, lineHeight }) =>
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    isNil(lineHeight) || (isEmoji && android)
      ? ''
      : `line-height: ${get(fonts, `lineHeight[${lineHeight}]`, lineHeight)};`}

  /* Opacity */
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'opacity' does not exist on type 'ThemePr... Remove this comment to see the full error message
  ${({ opacity }) => (isNil(opacity) ? '' : `opacity: ${opacity};`)}

  /* Tabular Numbers */
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'tabularNums' does not exist on type 'The... Remove this comment to see the full error message
  ${({ tabularNums }) => (tabularNums ? 'font-variant: tabular-nums;' : '')}

  /* Text Align */
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'align' does not exist on type 'ThemeProp... Remove this comment to see the full error message
  ${({ align }) => (isNil(align) ? '' : `text-align: ${align};`)}

  /* Uppercase */
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'uppercase' does not exist on type 'Theme... Remove this comment to see the full error message
  ${({ uppercase }) => (uppercase ? 'text-transform: uppercase;' : '')}
`;

export default buildTextStyles;
