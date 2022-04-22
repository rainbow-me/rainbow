import { TruncatedText } from '../text';
import styled from '@rainbow-me/styled-components';

const BottomRowText = styled(TruncatedText).attrs(
  ({ align = 'left', color, theme: { colors } }) => ({
    align,
    color: color ?? colors.alpha(colors.blueGreyDark, 0.5),
    size: 'smedium',
  })
)({});
export default BottomRowText;
