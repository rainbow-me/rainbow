import styled from 'styled-components';
import { TruncatedText } from '../text';

const TokenInfoValue = styled(TruncatedText).attrs(
  ({ color, theme: { colors }, size, weight = 'semibold' }) => ({
    color: color || colors.dark,
    letterSpacing: 'roundedTight',
    size: size || 'larger',
    weight,
  })
)``;

export default TokenInfoValue;
