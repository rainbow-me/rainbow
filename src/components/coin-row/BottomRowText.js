import { TruncatedText } from '../text';
import styled from '@/styled-thing';

const BottomRowText = styled(TruncatedText).attrs(({ align = 'left', color, theme: { colors } }) => ({
  align,
  color: color ?? colors.alpha(colors.blueGreyDark, 0.5),
  size: 'smedium',
  weight: 'medium',
}))({});
export default BottomRowText;
