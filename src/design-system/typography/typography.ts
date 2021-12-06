/* eslint-disable sort-keys-fix/sort-keys-fix */
import { precomputeValues } from '@capsizecss/core';
import { mapValues, pick } from 'lodash';
import { PixelRatio } from 'react-native';
import { ForegroundColor } from './../color/palettes';
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
    lineHeight:
      values.lineHeight !== 'normal'
        ? parseFloat(values.lineHeight)
        : undefined,
    marginBottom: PixelRatio.roundToNearestPixel(
      baselineTrimEm * fontSize * fontScale
    ),
    marginTop: PixelRatio.roundToNearestPixel(
      capHeightTrimEm * fontSize * fontScale
    ),
  } as const;
};

export const fonts = {
  SFProRounded: {
    regular: {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      fontFamily: ios ? 'SF Pro Rounded' : 'SF-Pro-Rounded-Regular',
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      fontWeight: ios ? fontWeights.regular : 'normal',
    },
    medium: {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      fontFamily: ios ? 'SF Pro Rounded' : 'SF-Pro-Rounded-Medium',
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      fontWeight: ios ? fontWeights.medium : 'normal',
    },
    semibold: {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      fontFamily: ios ? 'SF Pro Rounded' : 'SF-Pro-Rounded-Semibold',
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      fontWeight: ios ? fontWeights.semibold : 'normal',
    },
    bold: {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      fontFamily: ios ? 'SF Pro Rounded' : 'SF-Pro-Rounded-Bold',
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      fontWeight: ios ? fontWeights.bold : 'normal',
    },
    heavy: {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      fontFamily: ios ? 'SF Pro Rounded' : 'SF-Pro-Rounded-Heavy',
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      fontWeight: ios ? fontWeights.heavy : 'normal',
    },
  },

  SFMono: {
    regular: {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      fontFamily: ios ? 'SF Mono' : 'SFMono-Regular',
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      fontWeight: ios ? fontWeights.regular : 'normal',
    },
    medium: {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      fontFamily: ios ? 'SF Mono' : 'SFMono-Medium',
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      fontWeight: ios ? fontWeights.medium : 'normal',
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

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  const marginCorrectionForPlatform = marginCorrection[ios ? 'ios' : 'android'];

  return {
    ...styles,
    marginTop: PixelRatio.roundToNearestPixel(
      styles.marginTop + marginCorrectionForPlatform
    ),
    marginBottom: PixelRatio.roundToNearestPixel(
      styles.marginBottom - marginCorrectionForPlatform
    ),
  };
};

export const headingSizes = mapValues(typeHierarchy.heading, createTextSize);
export const textSizes = mapValues(typeHierarchy.text, createTextSize);

function selectForegroundColors<
  SelectedColors extends readonly (ForegroundColor | 'accent')[]
>(...colors: SelectedColors): SelectedColors {
  return colors;
}

export const textColors = selectForegroundColors(
  'accent',
  'action',
  'primary',
  'secondary',
  'secondary30',
  'secondary40',
  'secondary50',
  'secondary60',
  'secondary70',
  'secondary80'
);

export type TextColor = typeof textColors[number];
