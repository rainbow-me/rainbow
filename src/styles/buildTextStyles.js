import { isNil } from 'lodash';
import colors from './colors';
import fonts from './fonts';
import { css } from '@/styled-thing';

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function selectBestFontFit(weight) {
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
    return weight <= 400 ? 'Regular' : capitalizeFirstLetter(weight);
  } else {
    return 'Regular';
  }
}
function capitalizeFirstLetterWorklet(string) {
  'worklet';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function selectBestFontFitWorklet(weight) {
  'worklet';
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
    return weight <= 400 ? 'Regular' : capitalizeFirstLetterWorklet(weight);
  } else {
    return 'Regular';
  }
}

function familyFontWithAndroidWidth(weight, family) {
  return `${fonts.family[family]}${android ? `-${selectBestFontFit(weight)}` : ''}`;
}

export function fontWithWidth(weight, family = 'SFProRounded') {
  return {
    fontFamily: familyFontWithAndroidWidth(weight, family),
    // https://github.com/facebook/react-native/issues/18820
    // https://www.youtube.com/watch?v=87rhZTumujw
    ...(ios ? { fontWeight: weight } : { fontWeight: 'normal' }),
  };
}

function familyFontWithAndroidWidthWorklet(weight, family) {
  'worklet';
  return `${fonts.family[family]}${android ? `-${selectBestFontFitWorklet(weight)}` : ''}`;
}

export function fontWithWidthWorklet(weight, family = 'SFProRounded') {
  'worklet';
  return {
    fontFamily: familyFontWithAndroidWidthWorklet(weight, family),
    // https://github.com/facebook/react-native/issues/18820
    // https://www.youtube.com/watch?v=87rhZTumujw
    ...(ios ? { fontWeight: weight } : { fontWeight: 'normal' }),
  };
}

const buildTextStyles = css`
  /* Color */
  color: ${({ color, theme }) => colors.get(color, theme.colors) || theme.colors.dark};

  /* Font Family */
  ${({ isEmoji, family = 'SFProRounded', mono, weight }) => {
    const t = isEmoji ? '' : `font-family: ${familyFontWithAndroidWidth(weight, family, mono)};`;
    return t;
  }}

  /* Font Size */
  font-size:  ${({ size = 'medium' }) => (typeof size === 'number' ? size : fonts?.size?.[size] ?? size)};

  /* Font Weight */
  ${({ isEmoji, weight = 'regular' }) => (isEmoji || isNil(weight) || android ? '' : `font-weight: ${fonts?.weight?.[weight] ?? weight};`)}

  /* Letter Spacing */
  ${({ letterSpacing = 'rounded' }) =>
    isNil(letterSpacing) ? '' : `letter-spacing: ${fonts?.letterSpacing?.[letterSpacing] ?? letterSpacing};`}

  /* Line Height */
  ${({ isEmoji, lineHeight }) =>
    isNil(lineHeight) || (isEmoji && android) ? '' : `line-height: ${fonts?.lineHeight?.[lineHeight] ?? lineHeight};`}

  /* Opacity */
  ${({ opacity }) => (isNil(opacity) ? '' : `opacity: ${opacity};`)}

  /* Tabular Numbers */
  ${({ tabularNums }) => (tabularNums ? 'font-variant: tabular-nums;' : '')}

  /* Text Align */
  ${({ align }) => (isNil(align) ? '' : `text-align: ${align};`)}

  /* Uppercase */
  ${({ uppercase }) => (uppercase ? 'text-transform: uppercase;' : '')}
`;

buildTextStyles.object = ({
  color,
  theme,
  size = 'medium',
  isEmoji,
  family = 'SFProRounded',
  mono,
  weight,
  letterSpacing = 'rounded',
  lineHeight,
  opacity,
  align,
  tabularNums,
  uppercase,
}) => {
  const styles = {
    color: colors.get(color, theme.colors) || theme.colors.dark,
    fontSize: typeof size === 'number' ? size : fonts.size[size] ?? size,
  };

  if (!isEmoji) {
    styles.fontFamily = familyFontWithAndroidWidth(weight, family, mono);
  }

  if (!(isEmoji || isNil(weight) || android)) {
    if (typeof weight === 'undefined') {
      weight = 'regular';
    }

    styles.fontWeight = fonts.weight[weight] ?? weight;
  }

  if (!isNil(letterSpacing)) {
    styles.letterSpacing = fonts.letterSpacing[letterSpacing] ?? letterSpacing;
  }

  if (!(isNil(lineHeight) || (isEmoji && android))) {
    styles.lineHeight = fonts.lineHeight[lineHeight] ?? lineHeight;
  }

  if (!isNil(opacity)) {
    styles.opacity = opacity;
  }

  if (tabularNums) {
    styles.fontVariant = ['tabular-nums'];
  }

  if (!isNil(align)) {
    styles.textAlign = align;
  }

  if (uppercase) {
    styles.textTransform = 'uppercase';
  }

  return styles;
};

export default buildTextStyles;
