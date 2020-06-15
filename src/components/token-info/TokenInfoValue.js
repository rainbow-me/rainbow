import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { TruncatedText } from '../text';

const TokenInfoValue = styled(TruncatedText).attrs(
  ({ color = colors.dark }) => ({
    color,
    size: 'larger',
    weight: 'semibold',
  })
)``;

export default TokenInfoValue;
