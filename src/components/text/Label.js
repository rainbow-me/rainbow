import styled from 'styled-components/primitives';
import Text from './Text';
import { colors_NOT_REACTIVE } from '@rainbow-me/styles';

const labelStyles = {
  color: colors_NOT_REACTIVE.blueGreyDark,
  opacity: 0.6,
  size: 'h5',
  weight: 'semibold',
};

const Label = styled(Text).attrs(labelStyles)``;
Label.textProps = labelStyles;
export default Label;
