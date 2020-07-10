import styled from 'styled-components/primitives';
import { TruncatedText } from '../text';
import { colors } from '@rainbow-me/styles';

const TokenInfoValue = styled(TruncatedText).attrs(
  ({ color = colors.dark, weight = 'semibold' }) => ({
    color,
    letterSpacing: 'roundedTight',
    size: 'larger',
    weight,
  })
)``;

export default TokenInfoValue;
