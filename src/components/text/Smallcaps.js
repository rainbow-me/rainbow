import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import Text from './Text';

const Smallcaps = styled(Text).attrs({
  color: colors.alpha(colors.blueGreyDark, 0.8),
  size: 'small',
  uppercase: true,
  weight: 'semibold',
})``;

export default Smallcaps;
