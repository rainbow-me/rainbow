/* eslint-disable sort-keys */
import capsize from 'react-native-capsize';

const fonts = {
  SFProRounded: {
    regular: {
      fontFamily: ios ? 'SF Pro Rounded' : 'SF-Pro-Rounded-Regular',
      fontWeight: ios ? '400' : 'normal',
    },
    medium: {
      fontFamily: ios ? 'SF Pro Rounded' : 'SF-Pro-Rounded-Medium',
      fontWeight: ios ? '500' : 'normal',
    },
    semibold: {
      fontFamily: ios ? 'SF Pro Rounded' : 'SF-Pro-Rounded-Semibold',
      fontWeight: ios ? '600' : 'normal',
    },
    bold: {
      fontFamily: ios ? 'SF Pro Rounded' : 'SF-Pro-Rounded-Bold',
      fontWeight: ios ? '700' : 'normal',
    },
    heavy: {
      fontFamily: ios ? 'SF Pro Rounded' : 'SF-Pro-Rounded-Heavy',
      fontWeight: ios ? '800' : 'normal',
    },
  },

  SFMono: {
    regular: {
      fontFamily: ios ? 'SF Mono' : 'SFMono-Regular',
      fontWeight: ios ? '400' : 'normal',
    },
    medium: {
      fontFamily: ios ? 'SF Mono' : 'SFMono-Medium',
      fontWeight: ios ? '500' : 'normal',
    },
  },
} as const;

// Sourced from https://seek-oss.github.io/capsize
const fontMetrics = {
  capHeight: 1443,
  ascent: 1950,
  descent: -494,
  lineGap: 0,
  unitsPerEm: 2048,
} as const;

const androidMarginCorrectionForFontSize: Record<
  number,
  Record<'top' | 'bottom', number>
> = {
  16: { top: 1.4, bottom: -1.9 },
  23: { top: 0.1, bottom: -0.1 },
};

const createTextVariant = <FontFamily extends keyof typeof fonts>({
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight: leading,
  letterSpacing,
}: {
  fontFamily: FontFamily;
  fontWeight: keyof typeof fonts[FontFamily];
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}) => {
  const styles = {
    letterSpacing,
    ...fonts[fontFamily][fontWeight],
    ...capsize({
      fontMetrics,
      fontSize,
      leading,
    }),
  } as const;

  const marginCorrection =
    android && fontSize in androidMarginCorrectionForFontSize
      ? androidMarginCorrectionForFontSize[fontSize]
      : { top: 0, bottom: 0 };

  return {
    ...styles,
    ...{
      marginTop: styles.marginTop + marginCorrection.top,
      marginBottom: styles.marginBottom + marginCorrection.bottom,
    },
  };
};

export const textVariants = {
  title: createTextVariant({
    fontFamily: 'SFProRounded',
    fontWeight: 'bold',
    fontSize: 23,
    lineHeight: 27,
    letterSpacing: 0.5,
  }),
  heading: createTextVariant({
    fontFamily: 'SFProRounded',
    fontWeight: 'bold',
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0.5,
  }),
  bodyLarge: createTextVariant({
    fontFamily: 'SFProRounded',
    fontWeight: 'regular',
    fontSize: 18,
    lineHeight: 20,
    letterSpacing: 0.5,
  }),
  body: createTextVariant({
    fontFamily: 'SFProRounded',
    fontWeight: 'medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.5,
  }),
  bodyThick: createTextVariant({
    fontFamily: 'SFProRounded',
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.6,
  }),
  smallBodyThick: createTextVariant({
    fontFamily: 'SFProRounded',
    fontWeight: 'semibold',
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: 0.6,
  }),
} as const;
