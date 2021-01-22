import styled from 'styled-components/primitives';
import { TruncatedText } from '../text';
import { colors_NOT_REACTIVE } from '@rainbow-me/styles';

const TokenInfoValue = styled(TruncatedText).attrs(
  ({ color = colors_NOT_REACTIVE.dark, weight = 'semibold' }) => ({
    color,
    letterSpacing: 'roundedTight',
    size: 'larger',
    weight,
  })
)``;

export default TokenInfoValue;
