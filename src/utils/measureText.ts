import { PixelRatio, type TextStyle } from 'react-native';

import * as MeasureText from '@domir/react-native-measure-text';

import { type TextProps } from '@/design-system/components/Text/Text';
import { textSizes, textWeights } from '@/design-system/typography/typography';

// ============ Types ========================================================== //

/**
 * Design-system text style used for native width measurement.
 */
export type MeasureTextProps = Required<Pick<TextProps, 'size' | 'weight'>>;

type NativeMeasureTextStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight?: Extract<TextStyle['fontWeight'], string>;
  letterSpacing?: number;
};

// ============ Measurement ==================================================== //

/**
 * Measures rendered text width in pixels.
 */
export function measureTextSync(text: string, textStyles: MeasureTextProps): number {
  return PixelRatio.roundToNearestPixel(MeasureText.measureWidth(text, buildNativeMeasureTextStyle(textStyles)));
}

// ============ Text Styles ==================================================== //

function buildNativeMeasureTextStyle({ size, weight }: MeasureTextProps): NativeMeasureTextStyle {
  return {
    fontFamily: textWeights[weight].fontFamily,
    fontSize: textSizes[size].fontSize,
    fontWeight: textWeights[weight].fontWeight,
    letterSpacing: textSizes[size].letterSpacing,
  };
}
