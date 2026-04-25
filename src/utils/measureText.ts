import { PixelRatio, type TextStyle } from 'react-native';

import * as MeasureText from '@domir/react-native-measure-text';
import TextSize from 'react-native-text-size';

import { fonts } from '../styles';

const defaultTextStyles = {
  fontFamily: fonts.family.SFProRounded,
  fontSize: fonts.size.medium,
  fontWeight: fonts.weight.regular,
  letterSpacing: fonts.letterSpacing.rounded,
};

const DefaultMeasurementsState = {
  height: undefined,
  width: undefined,
};

export type MeasureTextStyle = {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: Extract<TextStyle['fontWeight'], string>;
  letterSpacing?: number;
  allowFontScaling?: boolean;
};

export default async function measureText(text: any, textStyles = {}) {
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ fontFamily: string; fontSize: ... Remove this comment to see the full error message
  return TextSize.measure({
    allowFontScaling: false,
    text,
    ...defaultTextStyles,
    ...textStyles,
  })
    .then(measurements => {
      return measurements;
    })
    .catch(() => {
      return DefaultMeasurementsState;
    });
}

export function measureTextSync(
  text: string,
  // not all style props are supported by the react-native-measure-text library
  textStyles: MeasureTextStyle = {}
): number {
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
