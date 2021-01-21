import styled from 'styled-components/primitives';
import { TruncatedText } from '../text';
import { colors } from '@rainbow-me/styles';

const BottomRowText = styled(TruncatedText).attrs(
  ({ align = 'left', color = colors.alpha(colors.blueGreyDark, 0.5) }) => ({
    align,
    color,
    size: 'smedium',
  })
)``;

export default BottomRowText;
