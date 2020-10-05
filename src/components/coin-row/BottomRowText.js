import styled from 'styled-components/primitives';
import { TruncatedText } from '../text';
import { colors } from '@rainbow-me/styles';

const BottomRowText = styled(TruncatedText).attrs(
  ({ align = 'left', color = colors.blueGreyDark50 }) => ({
    align,
    color,
    size: 'smedium',
  })
)``;

export default BottomRowText;
