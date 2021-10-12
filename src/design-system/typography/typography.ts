/* eslint-disable sort-keys-fix/sort-keys-fix */
import { precomputeValues } from '@capsizecss/core';
import { pick } from 'lodash';
import { PixelRatio } from 'react-native';

const capsize = (options: Parameters<typeof precomputeValues>[0]) => {
  const values = precomputeValues(options);
  const fontSize = parseFloat(values.fontSize);
  const baselineTrimEm = parseFloat(values.baselineTrim);
  const capHeightTrimEm = parseFloat(values.capHeightTrim);
  const fontScale = PixelRatio.getFontScale();

  return {
    fontSize,
    lineHeight:
      values.lineHeight !== 'normal'
        ? parseFloat(values.lineHeight)
        : undefined,
    marginBottom: baselineTrimEm * fontSize * fontScale,
    marginTop: capHeightTrimEm * fontSize * fontScale,
  } as const;
};

export const fonts = {
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

export const headingWeights = pick(fonts.SFProRounded, ['heavy', 'bold']);
export const textWeights = fonts.SFProRounded;

// Sourced from https://seek-oss.github.io/capsize
const fontMetrics = {
  capHeight: 1443,
  ascent: 1950,
  descent: -494,
  lineGap: 0,
  unitsPerEm: 2048,
} as const;

const marginCorrectionForFontSize = {
  23: ios ? -0.3 : -0.35,
  20: ios ? -0.5 : -0.2,
  18: ios ? 0.4 : 0.2,
  16: ios ? -0.5 : 1.9,
  14: ios ? -0.3 : -0.1,
} as const;

const createTextSize = ({
  fontSize,
  lineHeight: leading,
  letterSpacing,
}: {
  fontSize: keyof typeof marginCorrectionForFontSize;
  lineHeight: number;
  letterSpacing: number;
}) => {
  const styles = {
    letterSpacing,
    ...capsize({
      fontMetrics,
      fontSize,
      leading,
    }),
  } as const;

  const marginCorrection =
    fontSize in marginCorrectionForFontSize
      ? marginCorrectionForFontSize[fontSize]
      : 0;

  return {
    ...styles,
    marginTop: styles.marginTop + marginCorrection,
    marginBottom: styles.marginBottom - marginCorrection,
  };
};

export const headingSizes = {
  title: createTextSize({
    fontSize: 23,
    lineHeight: 27,
    letterSpacing: 0.6,
  }),
  heading: createTextSize({
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0.6,
  }),
};

export const textSizes = {
  body: createTextSize({
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.5,
  }),
  small: createTextSize({
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: 0.6,
  }),
} as const;
