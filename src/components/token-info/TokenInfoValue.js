import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { TruncatedText } from '../text';

const TokenInfoValue = styled(TruncatedText).attrs(
  ({ color = colors.dark, weight = 'semibold' }) => ({
    color,
    size: 'larger',
    weight,
  })
)``;

export default TokenInfoValue;
