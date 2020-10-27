import TextSize from 'react-native-text-size';
import { fonts } from '../styles';

const defaultTextStyles = {
  fontFamily: fonts.family.SFProRounded,
  fontSize: parseFloat(fonts.size.medium),
  fontWeight: fonts.weight.regular,
  letterSpacing: fonts.letterSpacing.rounded,
};

const DefaultMeasurementsState = {
  height: undefined,
  width: undefined,
};

export default async function measureText(text, textStyles = {}) {
  return TextSize.measure({
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
