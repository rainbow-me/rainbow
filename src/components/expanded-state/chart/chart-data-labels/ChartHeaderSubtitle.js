import styled from 'styled-components/primitives';
import { TruncatedText } from '../../../text';
import { colors } from '@rainbow-me/styles';

const ChartHeaderSubtitle = styled(TruncatedText).attrs(
  ({
    color = colors.alpha(colors.blueGreyDark, 0.8),
    letterSpacing = 'roundedMedium',
    weight = 'bold',
  }) => ({
    color,
    letterSpacing,
    size: 'larger',
    weight,
  })
)`
  ${android &&
    `margin-vertical: -10px
    margin-left: 9`}
`;

export default ChartHeaderSubtitle;
