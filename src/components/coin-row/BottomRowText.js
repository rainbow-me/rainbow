import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { TruncatedText } from '../text';

const BottomRowText = styled(TruncatedText).attrs(
  ({ align = 'left', color = colors.blueGreyDark50 }) => ({
    align,
    color,
    size: 'smedium',
  })
)``;

export default BottomRowText;
