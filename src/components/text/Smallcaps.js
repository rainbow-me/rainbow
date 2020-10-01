import styled from 'styled-components/primitives';
import Text from './Text';
import { colors } from '@rainbow-me/styles';

const Smallcaps = styled(Text).attrs({
  color: colors.alpha(colors.blueGreyDark, 0.8),
  size: 'small',
  uppercase: true,
  weight: 'semibold',
})``;

export default Smallcaps;
