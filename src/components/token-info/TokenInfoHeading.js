import styled from 'styled-components/primitives';
import { Text } from '../text';
import { colors_NOT_REACTIVE } from '@rainbow-me/styles';

const TokenInfoHeading = styled(Text).attrs({
  color: colors_NOT_REACTIVE.alpha(colors_NOT_REACTIVE.blueGreyDark, 0.5),
  letterSpacing: 'roundedMedium',
  size: 'smedium',
  weight: 'semibold',
})``;

export default TokenInfoHeading;
