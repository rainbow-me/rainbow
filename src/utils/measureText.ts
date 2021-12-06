import TextSize from 'react-native-text-size';
import { fonts } from '../styles';

const defaultTextStyles = {
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'family' does not exist on type '{}'.
  fontFamily: fonts.family.SFProRounded,
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'size' does not exist on type '{}'.
  fontSize: parseFloat(fonts.size.medium),
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'weight' does not exist on type '{}'.
  fontWeight: fonts.weight.regular,
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'letterSpacing' does not exist on type '{... Remove this comment to see the full error message
  letterSpacing: fonts.letterSpacing.rounded,
};

const DefaultMeasurementsState = {
  height: undefined,
  width: undefined,
};

export default async function measureText(text: any, textStyles = {}) {
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
