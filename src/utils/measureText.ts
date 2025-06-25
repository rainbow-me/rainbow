import TextSize from 'react-native-text-size';
import { fonts } from '../styles';
import * as MeasureText from '@domir/react-native-measure-text';
import { PixelRatio } from 'react-native';

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

export function measureTextSync(text: string, textStyles = {}) {
  // This rounding is likely something the library should be doing, but it's not.
  return PixelRatio.roundToNearestPixel(MeasureText.measureWidth(text, textStyles));
}
