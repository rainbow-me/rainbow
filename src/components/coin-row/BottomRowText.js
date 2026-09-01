import { opacity } from '@/design-system/utils/opacity';
import styled from '@/framework/ui/styled-thing';

import { TruncatedText } from '../text';

const BottomRowText = styled(TruncatedText).attrs(({ align = 'left', color, theme: { colors } }) => ({
  align,
  color: color ?? opacity(colors.blueGreyDark, 0.5),
  size: 'smedium',
  weight: 'medium',
}))({});
export default BottomRowText;
