import styled from 'styled-components/primitives';
import { TruncatedText } from '../text';

const TokenInfoValue = styled(TruncatedText).attrs(
  ({ color, theme: { colors }, weight = 'semibold' }) => ({
    color: color || colors.dark,
    letterSpacing: 'roundedTight',
    size: 'larger',
    weight,
  })
)``;

export default TokenInfoValue;
