import styled from 'styled-components/primitives';
import { TruncatedText } from '../../../text';

const ChartHeaderSubtitle = styled(TruncatedText).attrs(
  ({
    theme: { colors },
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
  margin-left: ${android ? 6 : 0};
  ${android ? 'height: 38' : ''};
`;

export default ChartHeaderSubtitle;
