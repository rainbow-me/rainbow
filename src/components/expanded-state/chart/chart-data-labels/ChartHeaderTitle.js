import styled from 'styled-components/primitives';
import { TruncatedText } from '../../../text';
import { colors } from '@rainbow-me/styles';

const ChartHeaderTitle = styled(TruncatedText).attrs(
  ({ color = colors.dark }) => ({
    color,
    letterSpacing: 'roundedTight',
    size: 'big',
    weight: 'bold',
  })
)``;

export default ChartHeaderTitle;
