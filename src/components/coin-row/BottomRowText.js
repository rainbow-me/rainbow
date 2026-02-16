import { TruncatedText } from '../text';
import styled from '@/styled-thing';
import { opacity } from '@/framework/ui/utils/opacity';

const BottomRowText = styled(TruncatedText).attrs(({ align = 'left', color, theme: { colors } }) => ({
  align,
  color: color ?? opacity(colors.blueGreyDark, 0.5),
  size: 'smedium',
  weight: 'medium',
}))({});
export default BottomRowText;
