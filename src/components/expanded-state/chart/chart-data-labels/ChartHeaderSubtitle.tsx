import styled from 'styled-components';
import { TruncatedText } from '../../../text';

const ChartHeaderSubtitle = styled(TruncatedText).attrs(
  ({
    theme: { colors },
    color = colors.alpha(colors.blueGreyDark, 0.8),
    letterSpacing = 'roundedMedium',
    testID,
    weight = 'bold',
  }) => ({
    color,
    letterSpacing,
    size: 'larger',
    testID,
    weight,
  })
)`
  flex: 1;
  ${android &&
  `margin-vertical: -10px
    margin-left: 9`}
`;

export default ChartHeaderSubtitle;
