import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { Text } from '../text';

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
