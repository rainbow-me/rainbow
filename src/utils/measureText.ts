import { PixelRatio, type TextStyle } from 'react-native';

import * as MeasureText from '@domir/react-native-measure-text';

export type MeasureTextStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight?: Extract<TextStyle['fontWeight'], string>;
  letterSpacing?: number;
  allowFontScaling?: boolean;
};

export function measureTextSync(text: string, textStyles: MeasureTextStyle): number {
  if (textStyles.allowFontScaling) {
    const fontScale = PixelRatio.getFontScale();
    const style = {
      ...textStyles,
      fontSize: textStyles.fontSize ? Math.round(textStyles.fontSize * fontScale) : textStyles.fontSize,
    };
    return PixelRatio.roundToNearestPixel(MeasureText.measureWidth(text, style));
  }

  return PixelRatio.roundToNearestPixel(MeasureText.measureWidth(text, textStyles));
}
