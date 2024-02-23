import { precomputeValues } from '@capsizecss/core';
import { mapValues } from 'lodash';
import { PixelRatio, Platform } from 'react-native';
import { fontWeights } from './fontWeights';
import { typeHierarchy } from './typeHierarchy';

const capsize = (options: Parameters<typeof precomputeValues>[0]) => {
  const values = precomputeValues(options);
  const fontSize = parseFloat(values.fontSize);
  const baselineTrimEm = parseFloat(values.baselineTrim);
  const capHeightTrimEm = parseFloat(values.capHeightTrim);
  const fontScale = PixelRatio.getFontScale();

  return {
    fontSize,
    lineHeight: values.lineHeight !== 'normal' ? parseFloat(values.lineHeight) : undefined,
    marginBottom: PixelRatio.roundToNearestPixel(baselineTrimEm * fontSize * fontScale),
    marginTop: PixelRatio.roundToNearestPixel(capHeightTrimEm * fontSize * fontScale),
  } as const;
};

export const fonts = {
  SFProRounded: {
    regular: {
      fontFamily: ios ? 'SF Pro Rounded' : 'SF-Pro-Rounded-Regular',
      fontWeight: ios ? fontWeights.regular : 'normal',
    },
    medium: {
      fontFamily: ios ? 'SF Pro Rounded' : 'SF-Pro-Rounded-Medium',
      fontWeight: ios ? fontWeights.medium : 'normal',
    },
    semibold: {
      fontFamily: ios ? 'SF Pro Rounded' : 'SF-Pro-Rounded-Semibold',
      fontWeight: ios ? fontWeights.semibold : 'normal',
    },
    bold: {
      fontFamily: ios ? 'SF Pro Rounded' : 'SF-Pro-Rounded-Bold',
      fontWeight: ios ? fontWeights.bold : 'normal',
    },
    heavy: {
      fontFamily: ios ? 'SF Pro Rounded' : 'SF-Pro-Rounded-Heavy',
      fontWeight: ios ? fontWeights.heavy : 'normal',
    },
    black: {
      fontFamily: ios ? 'SF Pro Rounded' : 'SF-Pro-Rounded-Black',
      fontWeight: ios ? fontWeights.black : 'normal',
    },
  },

  SFMono: {
    regular: {
      fontFamily: ios ? 'SF Mono' : 'SF-Mono-Regular',
      fontWeight: ios ? fontWeights.regular : 'normal',
    },
    medium: {
      fontFamily: ios ? 'SF Mono' : 'SF-Mono-Medium',
      fontWeight: ios ? fontWeights.medium : 'normal',
    },
  },
} as const;

const { black, heavy, bold } = fonts.SFProRounded;
export const headingWeights = { black, heavy, bold };
export const textWeights = fonts.SFProRounded;

// Sourced from https://seek-oss.github.io/capsize
export const fontMetrics = {
  capHeight: 1443,
  ascent: 1950,
  descent: -494,
  lineGap: 0,
  unitsPerEm: 2048,
} as const;

const createTextSize = ({
  fontSize,
  lineHeight: leading,
  letterSpacing,
  marginCorrection,
}: {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  marginCorrection: {
    ios: number;
    android: number;
  };
}) => {
  const styles = {
    letterSpacing,
    ...capsize({
      fontMetrics,
      fontSize,
      leading,
    }),
  } as const;

  const marginCorrectionForPlatform = marginCorrection[ios ? 'ios' : 'android'];

  if (Platform.OS === 'web') {
    return styles;
  }
  return {
    ...styles,
    marginTop: PixelRatio.roundToNearestPixel(styles.marginTop + marginCorrectionForPlatform),
    marginBottom: PixelRatio.roundToNearestPixel(styles.marginBottom - marginCorrectionForPlatform),
  };
};

export const headingSizes = mapValues(typeHierarchy.heading, createTextSize);
export const textSizes = mapValues(typeHierarchy.text, createTextSize);
