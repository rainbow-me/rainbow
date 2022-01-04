import { get, isNil } from 'lodash';
import colors from './colors';
import fonts from './fonts';
import { css } from 'rainbowed-components';

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
  color: ${({ color, theme }) =>
    colors.get(color, theme.colors) || theme.colors.dark};

  /* Font Family */
  ${({ isEmoji, family = 'SFProRounded', mono, weight }) => {
    const t = isEmoji
      ? ''
      : `font-family: ${familyFontWithAndroidWidth(weight, family, mono)};`;
    return t;
  }}

  /* Font Size */
  fontSize:  ${({ size = 'medium' }) =>
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
      : `letterSpacing: ${get(
          fonts,
          `letterSpacing[${letterSpacing}]`,
          letterSpacing
        )};`}

  /* Line Height */
  ${({ isEmoji, lineHeight }) =>
    isNil(lineHeight) || (isEmoji && android)
      ? ''
      : `lineHeight: ${get(fonts, `lineHeight[${lineHeight}]`, lineHeight)};`}

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
  size,
  isEmoji,
  family,
  mono,
  weight,
  letterSpacing,
  lineHeight,
  opacity,
  align,
  tabularNums,
  uppercase,
}) => {
  const styles = {
    color: colors.get(color, theme.colors) || theme.colors.dark,
  };

  // function is used because of default argument values
  (({ isEmoji, family = 'SFProRounded', mono, weight }) => {
    if (isEmoji) {
      return;
    }

    styles.fontFamily = familyFontWithAndroidWidth(weight, family, mono);
  })({ family, isEmoji, mono, weight });

  // function is used because of default argument values
  (({ size = 'medium' }) => {
    styles.fontSize =
      typeof size === 'number' ? size : fonts.size[size] ?? size;
  })({
    size,
  });

  // function is used because of default argument values
  (({ isEmoji, weight = 'regular' }) => {
    if (isEmoji || isNil(weight) || android) {
      return;
    }

    styles.fontWeight = fonts.weight[weight] ?? weight;
  })({ isEmoji, weight });

  // function is used because of default argument values
  (({ letterSpacing = 'rounded' }) => {
    if (!isNil(letterSpacing)) {
      styles.letterSpacing =
        fonts.letterSpacing[letterSpacing] ?? letterSpacing;
    }
  })({ letterSpacing });

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
