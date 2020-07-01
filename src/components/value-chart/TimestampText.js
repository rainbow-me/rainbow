import styled from 'styled-components/primitives';
import { Text } from '../text';
import { colors } from '@rainbow-me/styles';

const TimestampText = styled(Text).attrs({
  align: 'center',
  color: colors.blueGreyDark50,
  letterSpacing: 'roundedTight',
  size: 'smedium',
  weight: 'semibold',
})`
  margin-left: -15;
`;

export default TimestampText;
