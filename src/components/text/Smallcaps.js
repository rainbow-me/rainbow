import styled from 'styled-components/primitives';
import Text from './Text';
import { colors_NOT_REACTIVE } from '@rainbow-me/styles';

const Smallcaps = styled(Text).attrs({
  color: colors_NOT_REACTIVE.alpha(colors_NOT_REACTIVE.blueGreyDark, 0.8),
  size: 'small',
  uppercase: true,
  weight: 'semibold',
})``;

export default Smallcaps;
